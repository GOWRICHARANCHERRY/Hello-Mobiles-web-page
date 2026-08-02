import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Store, Check, MapPin, Loader } from 'lucide-react';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('online');

  const deliveryCharge = cartTotal > 5000 ? 0 : 99;
  const total = cartTotal + deliveryCharge;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser');
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'User-Agent': 'HelloMobiles/1.0' } }
          );
          const data = await response.json();
          const addr = data.address || {};
          console.log('OSM Address:', addr);

          const street = [addr.house_number, addr.road, addr.residential, addr.suburb, addr.neighbourhood, addr.hamlet].filter(Boolean).join(', ');
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.county || '';
          const state = addr.state || addr.state_district || '';
          const pincode = addr.postcode || '';

          setForm(prev => ({
            ...prev,
            street: street || data.display_name?.split(',')?.slice(0, 3)?.join(',') || '',
            city, state, pincode,
          }));
          toast.success('Location detected!');
        } catch (error) {
          toast.error('Failed to get address. Please enter manually.');
        }
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === 1) toast.error('Location permission denied. Please allow location access.');
        else toast.error('Failed to get location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.street || !form.city || !form.pincode) {
      return toast.error('Please fill all shipping details');
    }
    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          variantId: item.variant?._id || undefined,
          variant: item.variant ? {
            variantId: item.variant._id,
            color: item.selectedColor || '',
            ram: item.variant.ram || '',
            storage: item.variant.storage || '',
            sku: item.variant.sku || '',
          } : undefined,
        })),
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

      <div className="flex items-center mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-gold-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > s ? <Check size={16} /> : s}
            </div>
            <span className={`ml-2 text-sm ${step >= s ? 'text-gold-600 font-medium' : 'text-gray-500'}`}>
              {s === 1 ? 'Shipping' : s === 2 ? 'Payment' : 'Review'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-gold-600' : 'bg-gray-200'}`}></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Shipping Details</h2>
                <button onClick={handleGetLocation} disabled={locationLoading}
                  className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-gold-600 hover:to-gold-700 transition disabled:opacity-50 shadow-md">
                  {locationLoading ? (
                    <><Loader size={16} className="animate-spin" /> Detecting...</>
                  ) : (
                    <><MapPin size={16} /> Use Current Location</>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={form.street} onChange={e => setForm({...form, street: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>
              <button onClick={() => setStep(2)} className="mt-6 btn-gold rounded-xl">
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
                  <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === method.id ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={e => setPaymentMethod(e.target.value)} className="text-gold-600" />
                    <method.icon size={22} className={paymentMethod === method.id ? 'text-gold-600' : 'text-gray-400'} />
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline-gold rounded-xl">Back</button>
                <button onClick={() => setStep(3)} className="btn-gold rounded-xl">Review Order</button>
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
                    <div key={item.cartKey} className="flex justify-between text-sm py-1">
                      <div>
                        <span>{item.name} x {item.quantity}</span>
                        {item.variantLabel && <span className="text-xs text-gold-600 block">{item.variantLabel}</span>}
                      </div>
                      <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="btn-outline-gold rounded-xl">Back</button>
                <button onClick={handlePlaceOrder} disabled={loading}
                  className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 hover:from-accent-600 hover:to-accent-700 shadow-lg">
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-0 h-fit sticky top-20 overflow-hidden gold-border">
          <div className="gold-gradient px-6 py-4">
            <h2 className="text-lg font-bold text-white">Order Summary</h2>
            <p className="text-white/80 text-xs mt-0.5">{cart.length} item{cart.length > 1 ? 's' : ''} in your cart</p>
          </div>

          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            {cart.map(item => (
              <div key={item.cartKey} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="w-12 h-12 rounded-lg bg-gold-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span className="text-lg font-bold text-gold-400">{item.name?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  {item.variantLabel && <p className="text-[11px] text-gold-600 truncate">{item.variantLabel}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-700">₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              {deliveryCharge === 0 ? (
                <span className="text-green-600 font-semibold">FREE</span>
              ) : (
                <span className="text-gray-700">₹{deliveryCharge}</span>
              )}
            </div>
            {deliveryCharge === 0 && (
              <p className="text-[11px] text-green-600 bg-green-50 rounded-lg px-3 py-1.5 text-center font-medium">
                You saved ₹99 on delivery!
              </p>
            )}
            <div className="flex justify-between pt-2.5 border-t border-gray-200">
              <span className="text-base font-bold text-gray-800">Total</span>
              <span className="text-lg font-bold gold-text">₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-500 flex-shrink-0"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              <span>Secure checkout · 100% genuine products</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
