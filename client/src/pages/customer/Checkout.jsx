import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Store, Check } from 'lucide-react';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');

  const deliveryCharge = cartTotal > 5000 ? 0 : 99;
  const total = cartTotal + deliveryCharge;

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.street || !form.city || !form.pincode) {
      return toast.error('Please fill all shipping details');
    }
    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({ product: item._id, quantity: item.quantity })),
        shippingAddress: { name: form.name, phone: form.phone, street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        paymentMethod,
      };
      const { data } = await api.post('/orders', orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
    setLoading(false);
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > s ? <Check size={16} /> : s}
            </div>
            <span className={`ml-2 text-sm ${step >= s ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Shipping Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={form.street} onChange={e => setForm({...form, street: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <button onClick={() => setStep(2)} className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-700 transition">
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'online', label: 'Online Payment', icon: CreditCard, desc: 'UPI / Card / Net Banking' },
                  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
                  { id: 'store_pickup', label: 'Store Pickup', icon: Store, desc: 'Pay at the store' },
                ].map(method => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={e => setPaymentMethod(e.target.value)} className="text-primary-600" />
                    <method.icon size={22} className={paymentMethod === method.id ? 'text-primary-600' : 'text-gray-400'} />
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="border border-gray-300 px-6 py-2 rounded-xl font-medium hover:bg-gray-50 transition">Back</button>
                <button onClick={() => setStep(3)} className="bg-primary-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-700 transition">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Review Order</h2>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-1">Shipping To:</h3>
                  <p className="text-sm text-gray-600">{form.name}, {form.street}, {form.city}, {form.state} - {form.pincode}</p>
                  <p className="text-sm text-gray-600">Phone: {form.phone}</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-1">Payment: {paymentMethod === 'online' ? 'Online Payment' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Store Pickup'}</h3>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Items:</h3>
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between text-sm py-1">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="border border-gray-300 px-6 py-2 rounded-xl font-medium hover:bg-gray-50 transition">Back</button>
                <button onClick={handlePlaceOrder} disabled={loading}
                  className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50">
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-20">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          {cart.map(item => (
            <div key={item._id} className="flex justify-between text-sm py-2 border-b">
              <span className="text-gray-600 truncate flex-1 mr-2">{item.name} x{item.quantity}</span>
              <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
