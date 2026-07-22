import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
      toast.success('Order status updated!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const statusColors = {
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-yellow-100 text-yellow-700',
    packed: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const nextStatus = { confirmed: 'processing', processing: 'packed', packed: 'shipped', shipped: 'delivered' };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders Management</h1>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl"><p className="text-gray-500">No orders yet</p></div>
        ) : orders.map(order => (
          <div key={order._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
              onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.customer?.name} | {order.customer?.phone}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 md:mt-0">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.orderStatus] || 'bg-gray-100'}`}>{order.orderStatus}</span>
                <span className="font-bold text-sm">₹{order.total.toLocaleString()}</span>
                {expandedOrder === order._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {expandedOrder === order._id && (
              <div className="border-t p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Items:</h4>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 text-sm">
                        {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-contain bg-gray-100" />}
                        <span className="flex-1">{item.name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Shipping:</h4>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.name}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                    <p className="text-sm text-gray-600 mt-1">Payment: {order.paymentMethod}</p>
                  </div>
                </div>
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, nextStatus[order.orderStatus]); }}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                      Mark as {nextStatus[order.orderStatus]?.charAt(0).toUpperCase() + nextStatus[order.orderStatus]?.slice(1)}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, 'cancelled'); }}
                      className="border border-red-300 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
