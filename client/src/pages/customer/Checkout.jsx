import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CreditCard, Banknote, Store, Check, MapPin, Loader, Ticket, X, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LocationPicker from '../../components/LocationPicker';

const STORE_UPI = 'svlnmobiles12@ybl';
const HAS_MAPS = !!import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function Checkout() {
  const { t } = useLanguage();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', landmark: '', altPhone: '',
    city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [mapLoc, setMapLoc] = useState({ lat: null, lng: null, mapLabel: '' });
  const [paymentMethod, setPaymentMethod] = useState('online');

  const deliveryCharge = cartTotal > 5000 ? 0 : 99;
  const couponDiscount = coupon?.discount || 0;
  const total = Math.max(0, cartTotal + deliveryCharge - couponDiscount);

  const taxable = Math.round((cartTotal / 1.18) * 100) / 100;
  const cgst = Math.round((taxable * 0.09) * 100) / 100;
  const sgst = Math.round((taxable * 0.09) * 100) / 100;
  const fmt2 = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const applyCoupon = async () => {
    if (!couponCode.trim()) return toast.error(t('cust.toastEnterCouponCode'));
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal: cartTotal,
        items: cart.map(i => ({ product: i._id, amount: i.price * i.quantity })),
      });
      setCoupon(data);
      toast.success(t('cust.toastCouponApplied', { amount: data.discount.toLocaleString() }));
    } catch (e) {
      setCoupon(null);
      toast.error(e.response?.data?.message || t('cust.toastInvalidCoupon'));
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode('');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return toast.error(t('cust.toastGeoNotSupported'));
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
          toast.success(t('cust.toastLocationDetected'));
        } catch (error) {
          toast.error(t('cust.toastGetAddressFailed'));
        }
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === 1) toast.error(t('cust.toastLocationDenied'));
        else toast.error(t('cust.toastGetLocationFailed'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapLocation = (fields) => {
    setMapLoc({ lat: fields.lat, lng: fields.lng, mapLabel: fields.mapLabel });
    setForm(prev => ({
      ...prev,
      street: fields.street || prev.street,
      city: fields.city || prev.city,
      state: fields.state || prev.state,
      pincode: fields.pincode || prev.pincode,
    }));
    toast.success(t('cust.toastLocationDetected'));
  };

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.street || !form.city || !form.pincode) {
      return toast.error(t('cust.toastFillShipping'));
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
        shippingAddress: {
          name: form.name, phone: form.phone, street: form.street, city: form.city,
          state: form.state, pincode: form.pincode,
          landmark: form.landmark || undefined,
          altPhone: form.altPhone || undefined,
          latitude: mapLoc.lat || undefined,
          longitude: mapLoc.lng || undefined,
          mapLabel: mapLoc.mapLabel || undefined,
        },
        paymentMethod,
        couponCode: coupon?.code || undefined,
      };
      const { data } = await api.post('/orders', orderData);
      clearCart();
      toast.success(t('cust.toastOrderPlaced'));
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || t('cust.toastOrderFailed'));
    }
    setLoading(false);
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('cust.checkout')}</h1>

      <div className="flex items-center mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-gold-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > s ? <Check size={16} /> : s}
            </div>
            <span className={`ml-2 text-sm ${step >= s ? 'text-gold-600 font-medium' : 'text-gray-500'}`}>
              {s === 1 ? t('cust.stepShipping') : s === 2 ? t('cust.stepPayment') : t('cust.stepReview')}
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
                <h2 className="text-lg font-bold">{t('cust.shippingDetails')}</h2>
                {!HAS_MAPS && (
                  <button onClick={handleGetLocation} disabled={locationLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-gold-600 hover:to-gold-700 transition disabled:opacity-50 shadow-md">
                    {locationLoading ? (
                      <><Loader size={16} className="animate-spin" /> {t('cust.detecting')}</>
                    ) : (
                      <><MapPin size={16} /> {t('cust.useCurrentLocation')}</>
                    )}
                  </button>
                )}
              </div>
              {HAS_MAPS && (
                <div className="mb-5">
                  <LocationPicker
                    initial={{ lat: mapLoc.lat, lng: mapLoc.lng, mapLabel: mapLoc.mapLabel }}
                    onLocation={handleMapLocation}
                    onError={(msg) => toast.error(msg)}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.fullName')}</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.phone')}</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.altPhone')} <span className="text-xs text-gray-400 font-normal">({t('cust.optional')})</span></label>
                  <input value={form.altPhone} onChange={e => setForm({...form, altPhone: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.address')}</label>
                  <input value={form.street} onChange={e => setForm({...form, street: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.landmark')} <span className="text-xs text-gray-400 font-normal">({t('cust.optional')})</span></label>
                  <input value={form.landmark} onChange={e => setForm({...form, landmark: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.city')}</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.state')}</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('cust.pincode')}</label>
                  <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>
              <button onClick={() => setStep(2)} className="mt-6 btn-gold rounded-xl">
                {t('cust.continueToPayment')}
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">{t('cust.paymentMethod')}</h2>
              <div className="space-y-3">
                {[
                  { id: 'online', label: 'cust.onlinePayment', icon: CreditCard, desc: 'cust.upiCardNetBanking' },
                  { id: 'cod', label: 'cust.cashOnDelivery', icon: Banknote, desc: 'cust.payWhenReceive' },
                  { id: 'store_pickup', label: 'cust.storePickup', icon: Store, desc: 'cust.payAtStore' },
                ].map(method => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === method.id ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={e => setPaymentMethod(e.target.value)} className="text-gold-600" />
                    <method.icon size={22} className={paymentMethod === method.id ? 'text-gold-600' : 'text-gray-400'} />
                    <div>
                      <p className="font-medium">{t(method.label)}</p>
                      <p className="text-sm text-gray-500">{t(method.desc)}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === 'online' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2"><CreditCard size={16} /> {t('cust.payViaUpi')}</p>
                  <p className="text-xs text-blue-700 mb-2">{t('cust.upiInstruction')}</p>
                  <div className="bg-white rounded-lg border border-blue-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('cust.upiId')}</p>
                      <p className="font-mono font-bold text-gray-800 text-lg">{STORE_UPI}</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(STORE_UPI); toast.success(t('cust.toastUpiCopied')); }}
                      className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition flex-shrink-0">
                      {t('cust.copyUpiId')}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">{t('cust.supportedUpi')}</p>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline-gold rounded-xl">{t('cust.back')}</button>
                <button onClick={() => setStep(3)} className="btn-gold rounded-xl">{t('cust.reviewOrder')}</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">{t('cust.reviewOrder')}</h2>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-1">{t('cust.shippingTo')}</h3>
                  <p className="text-sm text-gray-600">{form.name}, {form.street}, {form.city}, {form.state} - {form.pincode}</p>
                  {form.landmark && <p className="text-sm text-gray-600">{t('cust.landmark')}: {form.landmark}</p>}
                  <p className="text-sm text-gray-600">{t('cust.phoneLabel', { phone: form.phone })}</p>
                  {form.altPhone && <p className="text-sm text-gray-600">{t('cust.altPhone')}: {form.altPhone}</p>}
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium text-gray-700 mb-1">{t('cust.paymentColon')}{paymentMethod === 'online' ? t('cust.onlinePayment') : paymentMethod === 'cod' ? t('cust.cashOnDelivery') : t('cust.storePickup')}</h3>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">{t('cust.items')}</h3>
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
                <button onClick={() => setStep(2)} className="btn-outline-gold rounded-xl">{t('cust.back')}</button>
                <button onClick={handlePlaceOrder} disabled={loading}
                  className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 hover:from-accent-600 hover:to-accent-700 shadow-lg">
                  {loading ? t('cust.placingOrder') : t('cust.placeOrder')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm h-fit sticky top-20 overflow-hidden gold-border">
          <div className="gold-gradient px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t('cust.orderSummary')}</h2>
              <p className="text-white/80 text-xs mt-0.5">{t(cart.length > 1 ? 'cust.itemsInCart' : 'cust.itemInCart', { count: cart.length })}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2.5"><ShoppingBag size={20} className="text-white" /></div>
          </div>

          {/* Items */}
          <div className="px-6 py-2 max-h-72 overflow-y-auto divide-y divide-gray-100">
            {cart.map(item => (
              <div key={item.cartKey} className="flex items-center gap-3 py-3">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span className="text-lg font-bold text-gold-400">{item.name?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  {item.variantLabel && <p className="text-[11px] text-gold-600 truncate">{item.variantLabel}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.quantity} × ₹{item.price.toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-gray-800 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700"><Ticket size={16} className="text-gold-600 flex-shrink-0" /> {t('cust.applyCoupon')}</div>
            {coupon ? (
              <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 w-full overflow-hidden">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-green-700 truncate">{coupon.code}</p>
                  <p className="text-xs text-green-600 truncate">{t('cust.youSave', { amount: coupon.discount.toLocaleString() })}</p>
                </div>
                <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder={t('cust.enterCouponCodePlaceholder')}
                  className="flex-1 min-w-0 border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                <button onClick={applyCoupon} disabled={couponLoading}
                  className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gold-700 transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                  {couponLoading ? <Loader size={14} className="animate-spin" /> : t('cust.apply')}
                </button>
              </div>
            )}
          </div>

          {/* Price Details */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('cust.priceDetails')}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('cust.taxableValue')}</span>
                <span className="text-gray-700">₹{fmt2(taxable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('cust.cgst9')}</span>
                <span className="text-gray-700">₹{fmt2(cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('cust.sgst9')}</span>
                <span className="text-gray-700">₹{fmt2(sgst)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-200 pt-2">
                <span className="text-gray-700">{t('cust.subtotalInclGst')}</span>
                <span className="font-semibold text-gray-900">₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('cust.delivery')}</span>
                {deliveryCharge === 0 ? (
                  <span className="text-green-600 font-semibold">{t('cust.free')}</span>
                ) : (
                  <span className="text-gray-700">₹{deliveryCharge}</span>
                )}
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>{t('cust.couponLabel', { code: coupon.code })}</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              {deliveryCharge === 0 && (
                <p className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 font-medium">
                  {t('cust.freeDeliveryYouSave')}
                </p>
              )}
              <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-gray-800">
                <span className="text-base font-bold text-gray-900">{t('cust.total')}</span>
                <span className="text-xl font-bold gold-text">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={16} className="text-green-500 flex-shrink-0" />
              <span>{t('cust.secureCheckout')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
