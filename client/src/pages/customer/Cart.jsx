import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const deliveryCharge = cartTotal > 5000 ? 0 : 99;
  const fmt2 = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (cart.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t('cust.cartEmpty')}</h2>
        <p className="text-gray-500 mb-6">{t('cust.addProductsToCart')}</p>
        <Link to="/products" className="bg-gold-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gold-700 transition inline-block">
          {t('cust.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('cust.shoppingCart')} ({cart.length} {t('cust.items')})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.cartKey} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
              <Link to={`/products/${item._id}`} className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image ? <img src={item.image} alt={item.name} loading="lazy" className="max-h-full object-contain" /> : <span className="text-gray-400 text-xs">{t('cust.noImage')}</span>}
              </Link>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{item.brand}</p>
                    <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                    {item.variantLabel && <p className="text-xs text-gold-600 font-medium mt-0.5">{item.variantLabel}</p>}
                  </div>
                  <button onClick={() => { removeFromCart(item.cartKey); toast.success(t('cust.removedFromCart')); }}
                    className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-2">₹{item.price.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100"><Minus size={14} /></button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100"><Plus size={14} /></button>
                  </div>
                  <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <Link to="/products" className="border border-gold-600 text-gold-600 px-6 py-2 rounded-xl font-medium hover:bg-gold-50 transition text-sm">
              {t('cust.continueShopping')}
            </Link>
            <button onClick={() => { clearCart(); toast.success(t('cust.cartCleared')); }}
              className="border border-red-300 text-red-500 px-6 py-2 rounded-xl font-medium hover:bg-red-50 transition text-sm">
              {t('cust.clearCart')}
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm h-fit sticky top-20 overflow-hidden gold-border">
          <div className="gold-gradient px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t('cust.orderSummary')}</h2>
              <p className="text-white/80 text-xs mt-0.5">{cart.length} {t('cust.itemsInCart')}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-2.5"><ShoppingBag size={20} className="text-white" /></div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('cust.priceDetails')}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t('cust.taxableValue')}</span><span className="text-gray-700">₹{fmt2(cartTotal / 1.18)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('cust.cgst')} @ 9%</span><span className="text-gray-700">₹{fmt2((cartTotal / 1.18) * 0.09)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('cust.sgst')} @ 9%</span><span className="text-gray-700">₹{fmt2((cartTotal / 1.18) * 0.09)}</span></div>
              <div className="flex justify-between border-t border-dashed border-gray-200 pt-2"><span className="text-gray-700">{t('cust.subtotalInclGst')}</span><span className="font-semibold text-gray-900">₹{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('cust.delivery')}</span><span className={`font-medium ${deliveryCharge === 0 ? 'text-green-600' : ''}`}>{deliveryCharge === 0 ? t('cust.free') : `₹${deliveryCharge}`}</span></div>
              {deliveryCharge > 0 && <p className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 font-medium">{t('cust.freeDeliveryAbove')}</p>}
              <div className="border-t-2 border-gray-800 pt-3 mt-1 flex justify-between items-center text-lg font-bold">
                <span className="text-gray-900">{t('cust.total')}</span><span className="gold-text text-xl">₹{(cartTotal + deliveryCharge).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100">
            <button onClick={() => navigate('/checkout')}
              className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
              {t('cust.proceedToCheckout')} <ArrowRight size={18} />
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">{t('cust.emiOptionsAvailable')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
