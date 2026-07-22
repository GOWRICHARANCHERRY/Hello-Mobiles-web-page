import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const deliveryCharge = cartTotal > 5000 ? 0 : 99;

  if (cart.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Add products to your cart to get started</p>
        <Link to="/products" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({cart.length} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item._id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
              <Link to={`/products/${item._id}`} className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image ? <img src={item.image} alt={item.name} className="max-h-full object-contain" /> : <span className="text-gray-400 text-xs">No Image</span>}
              </Link>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{item.brand}</p>
                    <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>
                  </div>
                  <button onClick={() => { removeFromCart(item._id); toast.success('Removed from cart'); }}
                    className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-2">₹{item.price.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100"><Minus size={14} /></button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100"><Plus size={14} /></button>
                  </div>
                  <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <Link to="/products" className="border border-primary-600 text-primary-600 px-6 py-2 rounded-xl font-medium hover:bg-primary-50 transition text-sm">
              Continue Shopping
            </Link>
            <button onClick={() => { clearCart(); toast.success('Cart cleared'); }}
              className="border border-red-300 text-red-500 px-6 py-2 rounded-xl font-medium hover:bg-red-50 transition text-sm">
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-20">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">₹{cartTotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className={`font-medium ${deliveryCharge === 0 ? 'text-green-600' : ''}`}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
            {deliveryCharge > 0 && <p className="text-xs text-green-600">Free delivery on orders above ₹5,000</p>}
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total</span><span>₹{(cartTotal + deliveryCharge).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')}
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-xl transition mt-4 flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight size={18} />
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">EMI options available at checkout</p>
        </div>
      </div>
    </div>
  );
}
