import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/auth/me').then(r => { setWishlist(r.data.wishlist || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.post(`/auth/wishlist/${productId}`);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>;

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Heart size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
        <p className="text-gray-500 mb-6">Save items you love for later</p>
        <Link to="/products" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition inline-block">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist ({wishlist.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wishlist.map(product => (
          <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
            <Link to={`/products/${product._id}`} className="bg-gray-100 p-4 h-48 flex items-center justify-center">
              {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="max-h-full object-contain" /> : <span className="text-gray-400">No Image</span>}
            </Link>
            <div className="p-4">
              <p className="text-xs text-gray-500">{product.brand}</p>
              <h3 className="font-semibold text-sm text-gray-800 mt-1">{product.name}</h3>
              <p className="text-lg font-bold text-gray-900 mt-2">₹{product.price?.toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { addToCart(product); toast.success('Added to cart!'); }}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-primary-700">
                  <ShoppingCart size={14} /> Add to Cart
                </button>
                <button onClick={() => handleRemove(product._id)} className="text-red-500 hover:text-red-600 px-3 py-2 border rounded-lg">
                  <Heart size={16} className="fill-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
