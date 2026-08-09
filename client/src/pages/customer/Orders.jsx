import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { payWithRazorpay, normalizeContact } from '../../utils/razorpay';
import { Package, Check, Clock, Truck, CheckCircle, XCircle, CreditCard } from 'lucide-react';

const statusSteps = ['confirmed', 'processing', 'packed', 'shipped', 'delivered'];

const PAYMENT_LABEL = { online: 'cust.onlinePayment', phonepe: 'cust.phonePe', razorpay: 'cust.razorpay', cod: 'cust.cashOnDelivery', store_pickup: 'cust.storePickup' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const { t } = useLanguage();

  const loadOrders = useCallback(() => {
    api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePayNow = async (order) => {
    setPayingId(order._id);
    try {
      const { data } = await api.post('/razorpay/create-order', { orderId: order._id });
      const contact = normalizeContact(order.shippingAddress?.phone);
      const response = await payWithRazorpay({
        amount: data.amount,
        currency: data.currency,
        orderId: data.order_id,
        description: `${t('cust.order')} ${order.orderNumber}`,
        prefill: { name: order.shippingAddress?.name, contact, email: '' },
        readonly: { name: true, email: true, contact: true },
      });
      await api.post('/razorpay/verify-payment', response);
      toast.success(t('cust.toastPaymentSuccess'));
      loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || t('cust.toastPaymentFailed'));
    }
    setPayingId(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={20} className="text-green-500" />;
      case 'shipped': return <Truck size={20} className="text-gold-500" />;
      case 'cancelled': return <XCircle size={20} className="text-red-500" />;
      default: return <Clock size={20} className="text-yellow-500" />;
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t('cust.noOrdersYet')}</h2>
        <p className="text-gray-500 mb-6">{t('cust.startShopping')}</p>
        <Link to="/products" className="bg-gold-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gold-700 transition inline-block">{t('cust.shopNow')}</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('cust.myOrders')}</h1>
      <div className="space-y-4">
        {orders.map(order => {
          const currentStep = statusSteps.indexOf(order.orderStatus);
          return (
            <div key={order._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">{t('cust.order')} #{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  {getStatusIcon(order.orderStatus)}
                  <span className={`font-medium capitalize text-sm ${order.orderStatus === 'delivered' ? 'text-green-600' : order.orderStatus === 'cancelled' ? 'text-red-500' : 'text-gray-700'}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {order.orderStatus !== 'cancelled' && (
                <div className="relative mb-6">
                  <div className="absolute top-3 left-3 right-3 h-1 bg-gray-200 rounded-full"></div>
                  <div className="absolute top-3 left-3 h-1 bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `calc(${Math.max(0, currentStep) * (100 / (statusSteps.length - 1))}% - 24px)` }}></div>
                  <div className="relative flex justify-between">
                    {statusSteps.map((step, i) => {
                      const label = t(`cust.status${step.charAt(0).toUpperCase() + step.slice(1)}`);
                      return (
                        <div key={step} className="flex flex-col items-center z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${i <= currentStep ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                            {i <= currentStep ? <Check size={12} /> : i + 1}
                          </div>
                          <span className={`mt-1.5 text-[10px] font-medium text-center leading-tight ${i <= currentStep ? 'text-gold-700' : 'text-gray-500'}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {order.assignedDelivery && ['assigned', 'out_for_delivery'].includes(order.deliveryStatus) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 px-3 py-2 bg-gold-50/70 border border-gold-200 rounded-lg text-sm">
                  <span className="flex items-center gap-1.5 text-gray-700"><Truck size={14} className="text-gold-600" />
                    {t('cust.deliveryBoy')}: <b className="text-gray-900">{order.assignedDelivery.name}</b>
                  </span>
                  {order.assignedDelivery.phone && (
                    <a href={`tel:${order.assignedDelivery.phone}`} className="text-gold-700 hover:text-gold-800 font-medium">📞 {order.assignedDelivery.phone}</a>
                  )}
                  {order.deliveryOtp && (
                    <span className="text-gray-600">{t('cust.deliveryOtp')}: <b className="text-gray-900 tracking-widest">{order.deliveryOtp}</b></span>
                  )}
                  <Link to={`/orders/${order._id}`} className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-800">{t('cust.trackDelivery')}</Link>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex gap-2 overflow-x-auto">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gold-50 rounded-lg p-2 min-w-0">
                      {item.image && <img src={item.image} alt="" width="40" height="40" loading="lazy" className="w-10 h-10 object-contain flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">{item.name}</p>
                        <p className="text-xs text-gray-500">{t('cust.qty', { count: item.quantity })}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && <span className="text-sm text-gray-500 self-center">+{order.items.length - 3} {t('cust.more')}</span>}
                </div>
                <div className="text-right mt-3 md:mt-0">
                  <p className="text-lg font-bold text-gray-900">₹{order.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize">{t(PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod)}</p>
                  {order.paymentMethod === 'razorpay' && order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => handlePayNow(order)}
                      disabled={payingId === order._id}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition">
                      <CreditCard size={13} />
                      {payingId === order._id ? `${t('cust.processing')}...` : t('cust.payNow')}
                    </button>
                  )}
                  <Link to={`/orders/${order._id}`} className="inline-block mt-2 text-xs font-semibold text-gold-700 hover:text-gold-700 bg-gold-50 border border-gold-200 px-3 py-1.5 rounded-lg">
                    {t('cust.viewDetailsInvoice')}
                  </Link>
                </div>
              </div>

              {order.deliveryStatus === 'delivered' && (order.startDeliveryPhoto || order.deliveryPhoto) && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('cust.deliveryPhotos')}</p>
                  <div className="flex gap-3">
                    {order.startDeliveryPhoto && (
                      <div className="flex flex-col gap-1">
                        <img src={order.startDeliveryPhoto} alt="" className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
                        <span className="text-[10px] text-gray-500">{t('cust.startDeliveryPhoto')}</span>
                      </div>
                    )}
                    {order.deliveryPhoto && (
                      <div className="flex flex-col gap-1">
                        <img src={order.deliveryPhoto} alt="" className="w-24 h-24 rounded-lg object-cover border border-gray-200" />
                        <span className="text-[10px] text-gray-500">{t('cust.deliveryProofPhoto')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
