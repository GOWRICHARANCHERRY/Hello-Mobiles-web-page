import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { User, MapPin, CreditCard, Clock, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    street: user?.address?.street || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const { data } = await api.put('/profile', {
        name: form.name, email: form.email,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
      });
      updateUser(data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <User size={32} className="text-gold-600" />
            </div>
            <h2 className="font-bold text-lg">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.phone}</p>
            {user?.email && <p className="text-sm text-gray-500">{user.email}</p>}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-gray-500">Loyalty Points</p>
              <p className="text-2xl font-bold text-yellow-600">{user?.loyaltyPoints || 0}</p>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Personal Details</h3>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              className="text-gold-600 flex items-center gap-1 text-sm font-medium">
              {editing ? <><Save size={16} /> Save</> : <><Edit2 size={16} /> Edit</>}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!editing}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none' : 'bg-gold-50'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!editing}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none' : 'bg-gold-50'}`} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              <input value={form.street} onChange={e => setForm({...form, street: e.target.value})} disabled={!editing}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none' : 'bg-gold-50'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">City</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} disabled={!editing}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none' : 'bg-gold-50'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">State</label>
              <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} disabled={!editing}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none' : 'bg-gold-50'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pincode</label>
              <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} disabled={!editing}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none' : 'bg-gold-50'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h3 className="font-bold text-lg mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₹{order.total.toLocaleString()}</p>
                  <p className={`text-xs capitalize ${order.orderStatus === 'delivered' ? 'text-green-600' : 'text-gray-500'}`}>{order.orderStatus}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
