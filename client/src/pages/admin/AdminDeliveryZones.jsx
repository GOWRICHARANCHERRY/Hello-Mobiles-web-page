import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Pencil, Trash2, Save, X, Loader, Power, Search, LocateFixed } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import loadGoogleMaps from '../../utils/loadGoogleMaps';

const DEFAULT_CENTER = { lat: 14.4426, lng: 79.9865 };
const PRESETS = [10, 25, 50, 60, 100];

function ZoneMap({ lat, lng, radiusKm, onPlace }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const searchRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => { if (!cancelled) setReady(true); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const gm = window.google.maps;
    const center = { lat, lng };
    if (!mapRef.current) {
      mapRef.current = new gm.Map(ref.current, { center, zoom: 10, mapTypeControl: false });
      markerRef.current = new gm.Marker({ map: mapRef.current, position: center, draggable: true });
      mapRef.current.addListener('click', (e) => {
        markerRef.current.setPosition(e.latLng);
        onPlace(e.latLng.lat(), e.latLng.lng());
      });
      markerRef.current.addListener('dragend', () => {
        const p = markerRef.current.getPosition();
        onPlace(p.lat(), p.lng());
      });
    } else {
      mapRef.current.setCenter(center);
      markerRef.current.setPosition(center);
    }
    if (circleRef.current) circleRef.current.setMap(null);
    circleRef.current = new gm.Circle({
      map: mapRef.current,
      center,
      radius: radiusKm * 1000,
      strokeColor: '#d4a017',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#d4a017',
      fillOpacity: 0.15,
    });
  }, [ready, lat, lng, radiusKm]); // eslint-disable-line

  useEffect(() => {
    if (!ready || !searchRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;
    const autocomplete = new window.google.maps.places.Autocomplete(searchRef.current);
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place?.geometry?.location) return;
      const ll = place.geometry.location;
      mapRef.current?.setCenter(ll);
      mapRef.current?.setZoom(12);
      markerRef.current?.setPosition(ll);
      onPlace(ll.lat(), ll.lng());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return toast.error(t('cust.toastGeoNotSupported'));
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.setCenter(ll);
        mapRef.current?.setZoom(12);
        markerRef.current?.setPosition(ll);
        onPlace(ll.lat, ll.lng);
      },
      () => {
        setLocating(false);
        toast.error(t('cust.toastGetLocationFailed'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            placeholder={t('admin2.searchLocationPlaceholder')}
            className="w-full border-2 border-gold-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50"
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className="flex-shrink-0 bg-white border-2 border-gold-300 text-gold-700 rounded-lg px-3.5 py-2 text-sm font-semibold flex items-center gap-1.5 hover:bg-gold-50 transition">
          {locating ? <Loader size={14} className="animate-spin" /> : <LocateFixed size={14} className="text-gold-700" />}
          {t('cust.useCurrentLocation')}
        </button>
      </div>
      <div ref={ref} className="w-full h-80 rounded-xl border-2 border-gold-200" />
    </div>
  );
}

export default function AdminDeliveryZones() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [zones, setZones] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get('/delivery-zones/config')
      .then((r) => { setEnabled(!!r.data.enabled); setZones(r.data.zones || []); })
      .catch(() => toast.error(t('admin2.zoneLoadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line

  const save = async (nextEnabled, nextZones) => {
    setSaving(true);
    try {
      const { data } = await api.put('/delivery-zones/config', { enabled: nextEnabled, zones: nextZones });
      setEnabled(!!data.enabled);
      setZones(data.zones || []);
      toast.success(t('admin2.zoneSaved'));
    } catch (e) {
      toast.error(e.response?.data?.message || t('admin2.zoneSaveFailed'));
    }
    setSaving(false);
  };

  const openAdd = () => {
    setEditing({
      _isNew: true,
      name: '',
      centerLat: DEFAULT_CENTER.lat,
      centerLng: DEFAULT_CENTER.lng,
      radiusKm: 50,
      isActive: true,
    });
  };

  const openEdit = (zone) => {
    setEditing({ ...zone, _isNew: false });
  };

  const saveZone = (zone) => {
    if (!zone.name.trim()) return toast.error(t('admin2.zoneRequireName'));
    if (!(Number(zone.radiusKm) > 0)) return toast.error(t('admin2.zoneRequireRadius'));
    const clean = {
      name: zone.name.trim(),
      centerLat: Number(zone.centerLat),
      centerLng: Number(zone.centerLng),
      radiusKm: Number(zone.radiusKm),
      isActive: zone.isActive,
    };
    if (zone._isNew) {
      save(enabled, [...zones, clean]);
    } else {
      save(enabled, zones.map((z) => (z._id === zone._id ? clean : z)));
    }
    setEditing(null);
  };

  const deleteZone = (zone) => {
    if (!window.confirm(t('admin2.zoneDeleteConfirm'))) return;
    save(enabled, zones.filter((z) => z._id !== zone._id));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-gold-700" size={24} /> {t('admin2.deliveryZones')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin2.deliveryZonesDesc')}</p>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:from-gold-600 hover:to-gold-700 transition shadow-lg">
          <Plus size={16} /> {t('admin2.addZone')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm gold-border p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Power size={18} className="text-gold-700" /> {t('admin2.deliveryRestriction')}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {enabled ? t('admin2.deliveryRestrictionOn') : t('admin2.deliveryRestrictionOff')}
          </p>
        </div>
        <button
          onClick={() => save(!enabled, zones)}
          disabled={saving}
          aria-label="Toggle delivery restriction"
          className={`relative w-14 h-8 rounded-full transition flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}>
          <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl shadow-sm gold-border p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">{editing._isNew ? t('admin2.addZone') : t('admin2.editZone')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin2.zoneName')}</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder={t('admin2.zoneNamePlaceholder')}
                className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin2.zoneRadius')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={editing.radiusKm}
                  onChange={(e) => setEditing({ ...editing, radiusKm: Number(e.target.value) })}
                  className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                <span className="text-sm text-gray-500 flex-shrink-0">{t('admin2.km')}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditing({ ...editing, radiusKm: p })}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${editing.radiusKm === p ? 'bg-gold-600 text-white' : 'bg-gold-50 text-gold-700 hover:bg-gold-100'}`}>
                    {p} {t('admin2.km')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="text-gold-700 w-4 h-4" />
                {t('admin2.zoneActive')}
              </label>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{t('admin2.zoneSetOnMap')}</p>
          <p className="text-xs text-gray-400 mb-3">{t('admin2.zoneMapHint')}</p>
          <ZoneMap
            lat={editing.centerLat}
            lng={editing.centerLng}
            radiusKm={editing.radiusKm}
            onPlace={(lat, lng) => setEditing((prev) => ({ ...prev, centerLat: lat, centerLng: lng }))} />
          <div className="flex gap-3 mt-5">
            <button onClick={() => saveZone(editing)} disabled={saving}
              className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:from-gold-600 hover:to-gold-700 transition disabled:opacity-50 shadow-lg">
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />} {t('admin2.zoneSave')}
            </button>
            <button onClick={() => setEditing(null)}
              className="bg-white border-2 border-gold-300 text-gold-700 px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gold-50 transition">
              <X size={16} /> {t('admin2.cancel')}
            </button>
          </div>
        </div>
      )}

      {zones.length === 0 && !editing ? (
        <div className="bg-white rounded-2xl p-12 text-center gold-border">
          <MapPin size={48} className="mx-auto text-gold-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">{t('admin2.zoneNoZones')}</p>
          <button onClick={openAdd} className="btn-gold rounded-xl mt-4">{t('admin2.addZone')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((z) => (
            <div key={z._id} className={`bg-white rounded-2xl shadow-sm gold-border p-5 border-l-4 ${z.isActive ? 'border-l-green-500' : 'border-l-gray-300'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{z.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{z.centerLat.toFixed(4)}, {z.centerLng.toFixed(4)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(z)} aria-label="Edit zone"
                    className="p-2 text-gray-500 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition"><Pencil size={16} /></button>
                  <button onClick={() => deleteZone(z)} aria-label="Delete zone"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gold-100 text-gold-700">
                  {t('admin2.zoneRadius')}: {z.radiusKm} {t('admin2.km')}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${z.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {z.isActive ? t('admin2.zoneActive') : t('admin2.zoneInactive')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6">{t('admin2.zoneRadiusNote')}</p>
    </div>
  );
}
