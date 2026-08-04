import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Search, Loader } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const DEFAULT_CENTER = { lat: 16.706, lng: 81.103 }; // Andhra Pradesh

export default function LocationPicker({ initial, onLocation, onError }) {
  const { t } = useLanguage();
  const [mapApi, setMapApi] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [label, setLabel] = useState(initial?.mapLabel || '');
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!KEY) return;
    if (window.google?.maps) {
      setMapApi(window.google.maps);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places,geocoding&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapApi(window.google.maps);
    script.onerror = () => onError?.(t('comp.mapsLoadFailed'));
    document.head.appendChild(script);
  }, []);

  const fillFromLatLng = (latLng) => {
    if (!mapApi) return;
    const lat = typeof latLng?.lat === 'function' ? latLng.lat() : latLng?.lat;
    const lng = typeof latLng?.lng === 'function' ? latLng.lng() : latLng?.lng;
    if (lat == null || lng == null) return;
    setGeocoding(true);
    const geocoder = new mapApi.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      if (status !== 'OK' || !results?.[0]) return;
      const r = results[0];
      const addr = {};
      r.address_components.forEach(c => {
        addr[c.types[0]] = c.long_name;
      });
      const street = [addr.subpremise, addr.premise, addr.street_number, addr.route, addr.sublocality_level_1, addr.sublocality_level_2, addr.neighborhood]
        .filter(Boolean).join(', ');
      const city = addr.locality || addr.sublocality_level_1 || addr.administrative_area_level_2 || '';
      const state = addr.administrative_area_level_1 || '';
      const pincode = addr.postal_code || '';
      setLabel(r.formatted_address);
      onLocation({
        lat,
        lng,
        street,
        city,
        state,
        pincode,
        mapLabel: r.formatted_address,
      });
    });
  };

  const moveTo = (latLng, zoom = 17) => {
    markerRef.current?.setPosition(latLng);
    mapRef.current?.setCenter(latLng);
    mapRef.current?.setZoom(zoom);
  };

  useEffect(() => {
    if (!mapApi || !mapElRef.current || mapRef.current) return;
    const center = initial?.lat && initial?.lng
      ? { lat: Number(initial.lat), lng: Number(initial.lng) }
      : DEFAULT_CENTER;
    const map = new mapApi.Map(mapElRef.current, {
      center,
      zoom: initial?.lat ? 16 : 11,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });
    const marker = new mapApi.Marker({
      position: center,
      map,
      draggable: true,
      animation: mapApi.Animation.DROP,
      title: t('comp.dragPinHint'),
    });
    marker.addListener('dragend', () => fillFromLatLng(marker.getPosition()));
    map.addListener('click', (e) => {
      marker.setPosition(e.latLng);
      fillFromLatLng(e.latLng);
    });
    if (searchRef.current) {
      const autocomplete = new mapApi.places.Autocomplete(searchRef.current);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.geometry?.location) {
          moveTo(place.geometry.location);
          fillFromLatLng(place.geometry.location);
        }
      });
    }
    mapRef.current = map;
    markerRef.current = marker;
  }, [mapApi]);

  const useMyLocation = () => {
    if (!navigator.geolocation || !mapApi) {
      return onError?.(t('cust.toastGeoNotSupported'));
    }
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeocoding(false);
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        moveTo(ll);
        fillFromLatLng(ll);
      },
      (err) => {
        setGeocoding(false);
        if (err.code === 1) onError?.(t('cust.toastLocationDenied'));
        else onError?.(t('cust.toastGetLocationFailed'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!KEY) return null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchRef}
          placeholder={t('comp.searchAddressPlaceholder')}
          className="w-full border-2 border-gold-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50"
        />
      </div>
      <div className="relative rounded-xl overflow-hidden border-2 border-gold-200">
        <div ref={mapElRef} className="w-full h-64 md:h-80" />
        <button
          type="button"
          onClick={useMyLocation}
          className="absolute bottom-3 right-3 bg-white text-gray-800 shadow-lg rounded-full px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50 transition"
        >
          {geocoding ? <Loader size={14} className="animate-spin" /> : <LocateFixed size={14} className="text-gold-600" />}
          {t('cust.useCurrentLocation')}
        </button>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-[11px] font-medium text-gray-600 shadow flex items-center gap-1 pointer-events-none">
          <MapPin size={12} className="text-gold-600" />
          {geocoding ? t('cust.detecting') : t('comp.dragPinHint')}
        </div>
      </div>
      {label && (
        <div className="flex items-start gap-2 bg-gold-50/60 border border-gold-200 rounded-lg px-3 py-2.5 text-xs text-gray-600">
          <MapPin size={14} className="text-gold-600 mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed">{label}</span>
        </div>
      )}
    </div>
  );
}
