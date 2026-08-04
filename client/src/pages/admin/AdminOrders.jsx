import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
      toast.success(t('admin2.orderStatusUpdated'));
    } catch (error) { toast.error(t('admin2.failed')); }
  };

  const updatePayment = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/payment`, { paymentStatus: status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: status } : o));
      toast.success(t('admin2.paymentUpdated'));
    } catch (error) { toast.error(t('admin2.failed')); }
  };

  const statusColors = {
    confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-yellow-100 text-yellow-700',
    packed: 'bg-purple-100 text-purple-700', shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabel = {
    all: t('admin2.all'),
    confirmed: t('admin2.status.confirmed'),
    processing: t('admin2.status.processing'),
    packed: t('admin2.status.packed'),
    shipped: t('admin2.status.shipped'),
    delivered: t('admin2.status.delivered'),
    cancelled: t('admin2.status.cancelled'),
  };
  const paymentLabel = {
    paid: t('admin2.payStatus.paid'),
    pending: t('admin2.payStatus.pending'),
    refunded: t('admin2.payStatus.refunded'),
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin2.ordersManagement')}</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === s ? 'bg-gold-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {statusLabel[s] || s} {s !== 'all' && <span className="ml-1">({orders.filter(o => o.orderStatus === s).length})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.customer?.name} | {order.customer?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.orderStatus]}`}>{statusLabel[order.orderStatus] || order.orderStatus}</span>
                <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{paymentLabel[order.paymentStatus] || order.paymentStatus}</span>
                <span className="font-bold text-sm">₹{order.total.toLocaleString()}</span>
                {expanded === order._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {expanded === order._id && (
              <div className="border-t p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">{t('admin2.items')}</h4>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 text-sm">
                        {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-contain bg-gray-100" />}
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">{t('admin2.shipping')}</h4>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.name}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.street}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    {order.shippingAddress?.latitude && order.shippingAddress?.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 mt-1"
                      >
                        <MapPin size={12} /> {t('admin2.viewOnMap')}
                      </a>
                    )}
                    <p className="text-sm text-gray-600 mt-2">{t('admin2.payment', { method: order.paymentMethod })}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">{t('admin2.actions')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                        <select onChange={e => updateStatus(order._id, e.target.value)} value=""
                          className="border rounded-lg px-2 py-1 text-xs">
                          <option value="">{t('admin2.selectStatus')}</option>
                          <option value="processing">{t('admin2.status.processing')}</option>
                          <option value="packed">{t('admin2.status.packed')}</option>
                          <option value="shipped">{t('admin2.status.shipped')}</option>
                          <option value="delivered">{t('admin2.status.delivered')}</option>
                          <option value="cancelled">{t('admin2.status.cancelled')}</option>
                        </select>
                      )}
                      <select onChange={e => updatePayment(order._id, e.target.value)} value=""
                        className="border rounded-lg px-2 py-1 text-xs">
                        <option value="">{t('admin2.selectPaymentStatus')}</option>
                        <option value="paid">{t('admin2.payStatus.paid')}</option>
                        <option value="pending">{t('admin2.payStatus.pending')}</option>
                        <option value="refunded">{t('admin2.payStatus.refunded')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
