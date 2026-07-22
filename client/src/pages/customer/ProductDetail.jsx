import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, MessageCircle, ChevronLeft, Minus, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/auth/wishlist/${product._id}`);
      setInWishlist(!inWishlist);
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleWhatsApp = () => {
    const msg = `Hi, I'm interested in ${product?.name} (₹${product?.price?.toLocaleString()}). Please share more details.`;
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  if (!product) return <div className="text-center py-16"><p className="text-gray-500 text-lg">Product not found</p></div>;

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-primary-600 mb-4 text-sm">
        <ChevronLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="bg-gray-100 rounded-xl p-8 h-80 flex items-center justify-center mb-4">
              {product.images?.[selectedImage] ? (
                <img src={product.images[selectedImage]} alt={product.name} className="max-h-full object-contain" />
              ) : (
                <div className="text-gray-400 text-lg">No Image Available</div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg border-2 flex-shrink-0 overflow-hidden ${selectedImage === i ? 'border-primary-500' : 'border-gray-200'}`}>
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-sm text-gray-500">{product.brand}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>

            {product.ratings > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm">
                  <Star size={14} className="fill-green-700" /> {product.ratings}
                </div>
                <span className="text-sm text-gray-500">{product.reviewCount} reviews</span>
              </div>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
                    <span className="text-green-600 font-semibold">{discount}% off</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* EMI Info */}
            {product.emiAvailable && (
              <div className="mt-4 p-3 border border-green-200 bg-green-50 rounded-xl">
                <p className="text-green-700 font-medium text-sm">EMI starts from ₹{product.emiStarting?.toLocaleString() || Math.round(product.price / 12).toLocaleString()}/month</p>
                <p className="text-xs text-gray-600 mt-1">No Cost EMI available on select banks. 0% Down Payment option available.</p>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100"><Minus size={16} /></button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-gray-100"><Plus size={16} /></button>
              </div>
              {product.stock > 0 ? (
                <span className="text-green-600 text-sm flex items-center gap-1"><Check size={14} /> In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-500 text-sm">Out of Stock</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleBuyNow} disabled={product.stock <= 0}
                className="flex-1 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                Buy Now
              </button>
              <button onClick={handleAddToCart} disabled={product.stock <= 0}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>

            <div className="mt-3 flex gap-3">
              <button onClick={handleWishlist} className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition ${inWishlist ? 'bg-red-50 border-red-300 text-red-600' : 'hover:bg-gray-50'}`}>
                <Heart size={16} className={inWishlist ? 'fill-red-500' : ''} /> {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 border border-green-300 bg-green-50 text-green-700 rounded-xl text-sm hover:bg-green-100 transition">
                <MessageCircle size={16} /> Ask on WhatsApp
              </button>
              <button onClick={() => { navigator.share?.({ title: product.name, url: window.location.href }); }}
                className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 transition">
                <Share2 size={16} /> Share
              </button>
            </div>

            {/* Features */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery' },
                { icon: Shield, label: 'Genuine Product' },
                { icon: RotateCcw, label: 'Easy Returns' },
              ].map((f, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                  <f.icon size={20} className="mx-auto text-primary-600 mb-1" />
                  <p className="text-xs font-medium text-gray-700">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.specifications && Object.entries(product.specifications).filter(([k, v]) => v && k !== 'other').map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          {product.description && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
