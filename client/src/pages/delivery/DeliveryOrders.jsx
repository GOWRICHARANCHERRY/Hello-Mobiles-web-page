import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { Bike, ChevronDown, ChevronUp, MapPin, RefreshCw, Phone, Camera, Loader, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import compressImage from '../../utils/compressImage';

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  unassigned: 'bg-gray-100 text-gray-600',
};

const PAYMENT_LABEL = { online: 'delv.pay.online', phonepe: 'delv.pay.phonepe', razorpay: 'delv.pay.razorpay', cod: 'delv.pay.cod', store_pickup: 'delv.pay.store_pickup' };

function PhotoInput({ value, onChange, label }) {
  const inputRef = useRef(null);
  const handleFile = async (file) => {
    if (!file) return;
    try {
      const dataUri = await compressImage(file);
      onChange(dataUri);
    } catch {
      toast.error('Could not read image');
    }
  };
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full max-h-56 object-contain rounded-xl border border-gray-200" />
          <button onClick={() => onChange(null)} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-red-50">
            <X size={16} className="text-red-500" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gold-300 bg-gold-50/50 rounded-xl py-8 flex flex-col items-center gap-2 hover:bg-gold-50 transition"
        >
          <Camera size={28} className="text-gold-500" />
          <span className="text-sm font-medium text-gold-700">Choose photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}

export default function DeliveryOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('focus');
  const focusedOnce = useRef(false);

  const [modal, setModal] = useState(null); // { type: 'start'|'deliver', orderId }
  const [photo, setPhoto] = useState(null);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liveOrders, setLiveOrders] = useState({});
  const [lastUpdates, setLastUpdates] = useState({});
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const trackers = useRef({});
  const liveRef = useRef(liveOrders);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/orders/delivery');
      setOrders(data);
    } catch (error) {
      if (!silent) toast.error(t('delv.failed'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    liveRef.current = liveOrders;
  }, [liveOrders]);

  useEffect(() => {
    if (!focusId || focusedOnce.current) return;
    const el = document.getElementById(`order-${focusId}`);
    if (el) {
      focusedOnce.current = true;
      setExpanded(focusId);
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [focusId, orders]);

  useEffect(() => {
    return () => {
      Object.values(trackers.current).forEach(tr => {
        navigator.geolocation.clearWatch(tr.watchId);
        clearInterval(tr.interval);
      });
    };
  }, []);

  const startTracking = async (orderId) => {
    if (!('geolocation' in navigator)) { toast.error(t('delv.locationError')); return; }
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 }));
      await api.post(`/orders/${orderId}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e) {
      toast.error(t('delv.locationError'));
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await api.post(`/orders/${orderId}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLastUpdates(prev => ({ ...prev, [orderId]: Date.now() }));
        } catch (e) { /* transient */ }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    const interval = setInterval(async () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          await api.post(`/orders/${orderId}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLastUpdates(prev => ({ ...prev, [orderId]: Date.now() }));
        } catch (e) { /* transient */ }
      }, () => {}, { enableHighAccuracy: true, timeout: 10000 });
    }, 15000);
    trackers.current[orderId] = { watchId, interval };
    setLiveOrders(prev => ({ ...prev, [orderId]: true }));
    setLastUpdates(prev => ({ ...prev, [orderId]: Date.now() }));
  };

  const stopTracking = (orderId) => {
    const tr = trackers.current[orderId];
    if (tr) {
      navigator.geolocation.clearWatch(tr.watchId);
      clearInterval(tr.interval);
      delete trackers.current[orderId];
    }
    setLiveOrders(prev => { const n = { ...prev }; delete n[orderId]; return n; });
  };

  const startDelivery = async () => {
    if (!photo) { toast.error(t('delv.photoRequired')); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/orders/${modal.orderId}/delivery/start`, { photo });
      setOrders(prev => prev.map(o => o._id === modal.orderId ? { ...o, ...data } : o));
      setModal(null);
      setPhoto(null);
      toast.success(t('delv.startDone'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('delv.failed'));
    }
    setSubmitting(false);
  };

  const markDelivered = async () => {
    if (!photo) { toast.error(t('delv.photoRequired')); return; }
    if (!otp.trim()) { toast.error(t('delv.otpRequired')); return; }
    setSubmitting(true);
    try {
      const { data } = await api.put(`/orders/${modal.orderId}/delivery-status`, { deliveryStatus: 'delivered', photo, otp: otp.trim() });
      setOrders(prev => prev.map(o => o._id === modal.orderId ? { ...o, ...data } : o));
      setModal(null);
      setPhoto(null);
      setOtp('');
      stopTracking(modal.orderId);
      toast.success(t('delv.deliveredDone'));
    } catch (error) {
      const msg = error?.response?.data?.message;
      toast.error(msg === 'Invalid or expired OTP' ? t('delv.otpInvalid') : (msg || t('delv.failed')));
    }
    setSubmitting(false);
  };

  const updateDeliveryStatus = async (orderId, deliveryStatus) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/delivery-status`, { deliveryStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...data } : o));
      toast.success(t('delv.statusUpdated'));
    } catch (error) {
      toast.error(t('delv.failed'));
    }
  };

  const statusLabels = {
    assigned: t('delv.assigned'),
    out_for_delivery: t('delv.outForDelivery'),
    delivered: t('delv.delivered'),
    cancelled: t('delv.cancelled'),
    unassigned: t('delv.all'),
  };

  const filters = [
    { key: 'all', label: t('delv.all') },
    { key: 'assigned', label: t('delv.assigned') },
    { key: 'out_for_delivery', label: t('delv.outForDelivery') },
    { key: 'delivered', label: t('delv.delivered') },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.deliveryStatus === filter);

  const closeModal = () => { if (submitting) return; setModal(null); setPhoto(null); setOtp(''); };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('delv.title')} ({orders.length})</h1>
        <button onClick={() => loadOrders()}
          className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gold-700">
          <RefreshCw size={16} /> {t('delv.refresh')}
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f.key ? 'bg-gold-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {f.label} {f.key !== 'all' && <span className="ml-1">({orders.filter(o => o.deliveryStatus === f.key).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <Bike size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('delv.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isLive = !!liveOrders[order._id];
            const lastUpdate = lastUpdates[order._id];
            return (
              <div key={order._id} id={`order-${order._id}`} className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-24">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-sm">{t('delv.orderNo', { number: order.orderNumber })}</p>
                      <p className="text-xs text-gray-500">{order.customer?.name} | {order.customer?.phone}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    {isLive && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>{t('delv.live')}</span>}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.deliveryStatus] || 'bg-gray-100'}`}>
                      {statusLabels[order.deliveryStatus] || order.deliveryStatus}
                    </span>
                    <span className="font-bold text-sm">₹{order.total.toLocaleString()}</span>
                    {expanded === order._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {expanded === order._id && (
                  <div className="border-t p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('delv.address')}</h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p className="font-medium text-gray-900">{order.shippingAddress?.name}</p>
                          <p className="flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" /> {order.shippingAddress?.phone}
                          </p>
                          {order.shippingAddress?.altPhone && (
                            <p className="flex items-center gap-1.5 text-gray-600">
                              <Phone size={12} className="text-gray-400" /> {t('delv.altPhone')} {order.shippingAddress.altPhone}
                            </p>
                          )}
                          <p>{order.shippingAddress?.street}</p>
                          {order.shippingAddress?.landmark && <p>{t('delv.landmark')} {order.shippingAddress.landmark}</p>}
                          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                          {order.shippingAddress?.latitude && order.shippingAddress?.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`}
                              target="_blank" rel="noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              <MapPin size={12} /> {t('delv.viewOnMap')}
                            </a>
                          )}
                        </div>
                        <h4 className="font-medium text-sm mt-4 mb-2">{t('delv.items')}</h4>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 py-1 text-sm">
                            {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-contain bg-gray-100" />}
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="text-gray-500">x{item.quantity}</span>
                            <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <p className="text-sm mt-2">{t('delv.payment', { method: t(PAYMENT_LABEL[order.paymentMethod] || '') })}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">{t('delv.total')}: <span className="text-gray-900 font-bold">₹{order.total.toLocaleString()}</span></h4>
                        {(order.startDeliveryPhoto || order.deliveryPhoto) && (
                          <div className="flex gap-3 mb-2">
                            {order.startDeliveryPhoto && (
                              <button onClick={() => setZoomPhoto(order.startDeliveryPhoto)} className="flex flex-col items-center gap-1">
                                <img src={order.startDeliveryPhoto} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                                <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Eye size={10} /> {t('delv.proofPhoto')}</span>
                              </button>
                            )}
                            {order.deliveryPhoto && (
                              <button onClick={() => setZoomPhoto(order.deliveryPhoto)} className="flex flex-col items-center gap-1">
                                <img src={order.deliveryPhoto} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                                <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Eye size={10} /> {t('delv.deliveryPhoto')}</span>
                              </button>
                            )}
                          </div>
                        )}
                        {order.deliveryStatus === 'delivered' && order.deliveredAt && (
                          <p className="text-xs text-green-600 mb-2">{t('delv.deliveredOn', { date: new Date(order.deliveredAt).toLocaleString('en-IN') })}</p>
                        )}
                        {order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'cancelled' && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {order.deliveryStatus === 'assigned' && (
                              <button onClick={(e) => { e.stopPropagation(); setPhoto(null); setOtp(''); setModal({ type: 'start', orderId: order._id }); }}
                                className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-700 transition">
                                {t('delv.startDelivery')}
                              </button>
                            )}
                            {order.deliveryStatus === 'out_for_delivery' && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); isLive ? stopTracking(order._id) : startTracking(order._id); }}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isLive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                  {isLive ? t('delv.stopLive') : t('delv.goLive')}
                                </button>
                                {isLive && (
                                  <span className="self-center text-xs text-gray-500">
                                    {t('delv.updatedAgo', { time: lastUpdate ? new Date(lastUpdate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—' })}
                                  </span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setPhoto(null); setOtp(''); setModal({ type: 'deliver', orderId: order._id }); }}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                                  {t('delv.markDelivered')}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Start delivery modal */}
      {modal?.type === 'start' && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{t('delv.startPhotoTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('delv.startPhotoDesc')}</p>
            <PhotoInput value={photo} onChange={setPhoto} label={t('delv.proofPhoto')} />
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} disabled={submitting} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">{t('delv.cancel')}</button>
              <button onClick={startDelivery} disabled={submitting}
                className="flex-1 bg-gold-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-gold-700 disabled:opacity-50 flex items-center justify-center gap-1">
                {submitting ? <Loader size={16} className="animate-spin" /> : t('delv.startDelivery')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark delivered modal */}
      {modal?.type === 'deliver' && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{t('delv.deliverPhotoTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('delv.deliverPhotoDesc')}</p>
            <PhotoInput value={photo} onChange={setPhoto} label={t('delv.deliveryPhoto')} />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('delv.enterOtp')}</label>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                className="w-full border-2 border-gold-200 rounded-xl px-4 py-3 text-2xl font-bold tracking-[0.5em] text-center focus:ring-2 focus:ring-gold-400 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1.5">{t('delv.otpHint')}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} disabled={submitting} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">{t('delv.cancel')}</button>
              <button onClick={markDelivered} disabled={submitting}
                className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1">
                {submitting ? <Loader size={16} className="animate-spin" /> : t('delv.markDelivered')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo zoom */}
      {zoomPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomPhoto(null)}>
          <img src={zoomPhoto} alt="" className="max-w-full max-h-[85vh] rounded-xl" />
          <button onClick={() => setZoomPhoto(null)} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow">
            <X size={20} className="text-gray-700" />
          </button>
        </div>
      )}
    </div>
  );
}
