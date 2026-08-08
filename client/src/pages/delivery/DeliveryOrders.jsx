import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { Bike, ChevronDown, ChevronUp, MapPin, RefreshCw, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_COLORS = {
  assigned: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  unassigned: 'bg-gray-100 text-gray-600',
};

const PAYMENT_LABEL = { online: 'delv.pay.online', phonepe: 'delv.pay.phonepe', razorpay: 'delv.pay.razorpay', cod: 'delv.pay.cod', store_pickup: 'delv.pay.store_pickup' };

export default function DeliveryOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('focus');
  const focusedOnce = useRef(false);

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
    if (!focusId || focusedOnce.current) return;
    const el = document.getElementById(`order-${focusId}`);
    if (el) {
      focusedOnce.current = true;
      setExpanded(focusId);
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [focusId, orders]);

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
          {filtered.map(order => (
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
                      {order.deliveryStatus === 'delivered' && order.deliveredAt && (
                        <p className="text-xs text-green-600 mb-2">{t('delv.deliveredOn', { date: new Date(order.deliveredAt).toLocaleString('en-IN') })}</p>
                      )}
                      {order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'cancelled' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {order.deliveryStatus === 'assigned' && (
                            <button onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order._id, 'out_for_delivery'); }}
                              className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-700 transition">
                              {t('delv.startDelivery')}
                            </button>
                          )}
                          {order.deliveryStatus === 'out_for_delivery' && (
                            <button onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(order._id, 'delivered'); }}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                              {t('delv.markDelivered')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
