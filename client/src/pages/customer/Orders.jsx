import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Package, Check, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';

const statusSteps = ['confirmed', 'processing', 'packed', 'shipped', 'delivered'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

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
                <div className="flex items-center mb-4">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i <= currentStep ? <Check size={12} /> : i + 1}
                      </div>
                      {i < statusSteps.length - 1 && <div className={`flex-1 h-1 mx-1 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex gap-2 overflow-x-auto">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gold-50 rounded-lg p-2">
                      {item.image && <img src={item.image} alt="" className="w-10 h-10 object-contain" />}
                      <div>
                        <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">{item.name}</p>
                        <p className="text-xs text-gray-500">{t('cust.qty')}: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && <span className="text-sm text-gray-500 self-center">+{order.items.length - 3} {t('cust.more')}</span>}
                </div>
                <div className="text-right mt-3 md:mt-0">
                  <p className="text-lg font-bold text-gray-900">₹{order.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                  <Link to={`/orders/${order._id}`} className="inline-block mt-2 text-xs font-semibold text-gold-600 hover:text-gold-700 bg-gold-50 border border-gold-200 px-3 py-1.5 rounded-lg">
                    {t('cust.viewDetailsInvoice')}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
