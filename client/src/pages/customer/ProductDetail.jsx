import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';
import LoginPopup from '../../components/LoginPopup';
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, MessageCircle, ChevronLeft, Minus, Plus, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_MAP = {
  'black': '#1a1a1a', 'white': '#f5f5f5', 'blue': '#3b82f6', 'green': '#22c55e',
  'red': '#ef4444', 'gold': '#d4a017', 'purple': '#a855f7', 'silver': '#c0c0c0',
  'gray': '#6b7280', 'grey': '#6b7280', 'pink': '#ec4899', 'orange': '#f97316',
  'yellow': '#eab308', 'cyan': '#06b6d4', 'lime': '#84cc14', 'teal': '#14b8a6',
  'navy': '#1e3a5f', 'brown': '#92400e', 'beige': '#d4c5a9', 'bronze': '#cd7f32',
  'copper': '#b87333', 'violet': '#7c3aed', 'indigo': '#6366f1', 'rose': '#f43f5e',
  'maroon': '#800000', 'cream': '#fffdd0', 'titanium': '#878681', 'coral': '#ff7f50',
  'mint': '#98ff98', 'lavender': '#e6e6fa', 'peach': '#ffcba4', 'mauve': '#e0b0ff',
  'aqua': '#00ffff', 'charcoal': '#36454f', 'olive': '#808000', 'burgundy': '#800020',
  'sky blue': '#87ceeb', 'rose gold': '#b76e79', 'midnight blue': '#191970',
  'forest green': '#228b22', 'champagne': '#f7e7ce', 'ruby': '#e0115f',
  'emerald': '#50c878', 'ivory': '#fffff0',
  'aurora green': '#22c55e', 'starry white': '#f5f5f5', 'twilight blue': '#3b82f6',
  'fresh': '#22c55e', 'blaze': '#ef4444', 'cappuccino brown': '#6f4e37',
  'olive green': '#556b2f', 'prism violet': '#a855f7', 'icy blue': '#a5d8ff',
  'glacier blue': '#5da9e9', 'midnight black': '#1a1a1a', 'phantom black': '#1a1a1a',
  'celestial magic': '#a855f7', 'luxury purple': '#a855f7', 'luxe lavender': '#b57edc',
  'coca brown': '#6f4e37', 'blooming purple': '#a855f7', 'sprouting green': '#22c55e',
  'parrot purple': '#a855f7', 'master gold': '#d4a017',
};

function getColorHex(colorName) {
  if (!colorName) return null;
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

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
  const { t } = useLanguage();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedColorName, setSelectedColorName] = useState('');

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = () => {
    setReviewsLoading(true);
    api.get(`/products/${id}/reviews`).then(r => { setReviews(r.data); setReviewsLoading(false); }).catch(() => setReviewsLoading(false));
  };

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data);
      setSelectedImage(0);
      setSelectedRam('');
      setSelectedStorage('');
      setSelectedColorName('');
      setLoading(false);
    }).catch(() => { setLoading(false); });
    loadReviews();
  }, [id]);

  const submitReview = async () => {
    if (!user) return setShowLoginPopup(true);
    if (!reviewForm.rating) return toast.error('Please select a star rating');
    if (!reviewForm.comment.trim()) return toast.error('Please write a review');
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/products/${id}/reviews`, reviewForm);
      setReviews(prev => [data, ...prev]);
      setReviewForm({ rating: 0, title: '', comment: '' });
      toast.success('Thank you for your review!');
      setProduct(prev => prev ? { ...prev, ratings: data.productRatings ?? prev.ratings, reviewCount: (prev.reviewCount || 0) + 1 } : prev);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/products/${id}/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      toast.success('Review deleted');
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const hasVariants = product?.variants?.length > 0;
  const normalize = (s) => (s || '').toLowerCase().trim();

  const ramOptions = useMemo(() => {
    if (!hasVariants) return [];
    const seen = new Map();
    product.variants.forEach(v => {
      if (v.ram) {
        const key = normalize(v.ram);
        if (!seen.has(key)) seen.set(key, v.ram.trim());
      }
    });
    return [...seen.values()];
  }, [product, hasVariants]);

  const storageOptions = useMemo(() => {
    if (!hasVariants) return [];
    let filtered = product.variants;
    if (selectedRam) filtered = filtered.filter(v => normalize(v.ram) === normalize(selectedRam));
    const seen = new Map();
    filtered.forEach(v => {
      if (v.storage) {
        const key = normalize(v.storage);
        if (!seen.has(key)) seen.set(key, v.storage.trim());
      }
    });
    return [...seen.values()];
  }, [product, hasVariants, selectedRam]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants || !product) return null;
    return product.variants.find(v =>
      (!selectedRam || normalize(v.ram) === normalize(selectedRam)) &&
      (!selectedStorage || normalize(v.storage) === normalize(selectedStorage))
    ) || null;
  }, [product, hasVariants, selectedRam, selectedStorage]);

  const variantColors = useMemo(() => {
    if (!selectedVariant?.colors) return [];
    return selectedVariant.colors.filter(c => c.name);
  }, [selectedVariant]);

  const selectedColorObj = useMemo(() => {
    if (!selectedColorName || !variantColors.length) return null;
    return variantColors.find(c => normalize(c.name) === normalize(selectedColorName)) || null;
  }, [selectedColorName, variantColors]);

  const currentPrice = selectedVariant?.price ?? product?.price;
  const currentMrp = selectedVariant?.mrp ?? product?.mrp;
  const currentStock = selectedColorObj ? selectedColorObj.stock : (selectedVariant?.colors?.reduce((s, c) => s + (c.stock || 0), 0) ?? product?.stock ?? 0);
  const currentImage = selectedColorObj?.image || product?.images?.[selectedImage];
  const discount = currentMrp && currentPrice ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;

  useEffect(() => {
    if (ramOptions.length > 0 && !selectedRam) setSelectedRam(ramOptions[0]);
  }, [ramOptions]);

  useEffect(() => {
    if (storageOptions.length > 0 && !selectedStorage) setSelectedStorage(storageOptions[0]);
  }, [storageOptions]);

  useEffect(() => {
    if (variantColors.length > 0 && !selectedColorName) {
      setSelectedColorName(variantColors[0].name);
    }
  }, [variantColors]);

  const handleRamSelect = (ram) => {
    const newRam = normalize(ram) === normalize(selectedRam) ? '' : ram;
    setSelectedRam(newRam);
    setSelectedStorage('');
    setSelectedColorName('');
  };

  const handleStorageSelect = (storage) => {
    const newStorage = normalize(storage) === normalize(selectedStorage) ? '' : storage;
    setSelectedStorage(newStorage);
    setSelectedColorName('');
  };

  const handleColorSelect = (name) => {
    setSelectedColorName(normalize(name) === normalize(selectedColorName) ? '' : name);
  };

  const handleAddToCart = () => {
    if (!user) return setShowLoginPopup(true);
    if (hasVariants && !selectedVariant) return toast.error('Please select a variant');
    if (hasVariants && variantColors.length > 0 && !selectedColorObj) return toast.error('Please select a color');
    if (hasVariants && currentStock <= 0) return toast.error('Selected option is out of stock');
    addToCart(product, quantity, selectedVariant, selectedColorObj);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!user) return setShowLoginPopup(true);
    if (hasVariants && !selectedVariant) return toast.error('Please select a variant');
    if (hasVariants && variantColors.length > 0 && !selectedColorObj) return toast.error('Please select a color');
    if (hasVariants && currentStock <= 0) return toast.error('Selected option is out of stock');
    addToCart(product, quantity, selectedVariant, selectedColorObj);
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!user) return setShowLoginPopup(true);
    try {
      await api.post(`/auth/wishlist/${product._id}`);
      setInWishlist(!inWishlist);
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleWhatsApp = () => {
    const variantText = selectedVariant ? ` (${selectedRam || ''}${selectedStorage ? '/' + selectedStorage : ''}${selectedColorName ? ' - ' + selectedColorName : ''})` : '';
    const msg = `Hi, I'm interested in ${product?.name}${variantText} (₹${currentPrice?.toLocaleString()}). Please share more details.`;
    window.open(`https://wa.me/918886888128?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const allImages = useMemo(() => {
    if (!product) return [];
    const imgs = [...(product.images || [])];
    if (selectedVariant?.colors) {
      selectedVariant.colors.forEach(c => { if (c.image && !imgs.includes(c.image)) imgs.push(c.image); });
    }
    return imgs;
  }, [product, selectedVariant]);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div></div>;
  if (!product) return <div className="text-center py-16"><p className="text-gray-500 text-lg">Product not found</p></div>;

  return (
    <div className="animate-fade-in">
      <SEO
        title={product.name}
        description={`${product.name} — ${product.brand || ''} ${product.category || ''} at best price ₹${product.price?.toLocaleString()}. Buy now with EMI options and home delivery in Visakhapatnam.`}
        path={`/products/${product._id}`}
        image={product.images?.[0]}
        product={true}
        structuredData={product ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description || product.name,
          image: product.images?.[0],
          brand: { '@type': 'Brand', name: product.brand || 'Hello Mobiles' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.price,
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://hello-mobiles.com/products/${product._id}`,
          },
          aggregateRating: product.rating ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.numReviews || 1,
          } : undefined,
        } : undefined}
      />
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gold-600 mb-4 text-sm">
        <ChevronLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="bg-gray-100 rounded-xl p-8 h-80 flex items-center justify-center mb-4">
              {currentImage ? (
                <img src={currentImage} alt={product.name} loading="lazy" className="max-h-full object-contain" />
              ) : allImages[selectedImage] ? (
                <img src={allImages[selectedImage]} alt={product.name} loading="lazy" className="max-h-full object-contain" />
              ) : (
                <div className="text-gray-400 text-lg">No Image Available</div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg border-2 flex-shrink-0 overflow-hidden ${selectedImage === i ? 'border-gold-500' : 'border-gray-200'}`}>
                    <img src={img} alt="" loading="lazy" className="w-full h-full object-contain" />
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

            {/* RAM Selector */}
            {ramOptions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">RAM: <span className="text-gold-600">{selectedRam || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {ramOptions.map(ram => {
                    const isActive = normalize(selectedRam) === normalize(ram);
                    return (
                      <button key={ram} onClick={() => handleRamSelect(ram)}
                        className={`px-4 py-2 rounded-xl border-2 text-sm transition font-medium ${isActive ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 hover:border-gold-300'}`}>
                        {ram}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Selector */}
            {storageOptions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Storage: <span className="text-gold-600">{selectedStorage || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map(storage => {
                    const isActive = normalize(selectedStorage) === normalize(storage);
                    return (
                      <button key={storage} onClick={() => handleStorageSelect(storage)}
                        className={`px-4 py-2 rounded-xl border-2 text-sm transition font-medium ${isActive ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 hover:border-gold-300'}`}>
                        {storage}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {variantColors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Color: <span className="text-gold-600">{selectedColorName || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {variantColors.map(c => {
                    const hex = getColorHex(c.name);
                    const isActive = normalize(selectedColorName) === normalize(c.name);
                    const outOfStock = c.stock <= 0;
                    return (
                      <button key={c._id || c.name} onClick={() => handleColorSelect(c.name)} disabled={outOfStock}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition ${isActive ? 'border-gold-500 bg-gold-50 font-semibold' : outOfStock ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through' : 'border-gray-200 hover:border-gold-300'}`}>
                        {hex && (
                          <span className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: hex }}></span>
                        )}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 p-4 bg-gold-50 rounded-xl">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{currentPrice?.toLocaleString()}</span>
                {currentMrp > currentPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">₹{currentMrp?.toLocaleString()}</span>
                    <span className="text-green-600 font-semibold">{discount}% off</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* EMI Info */}
            {product.emiAvailable && (
              <div className="mt-4 p-3 border border-green-200 bg-green-50 rounded-xl">
                <p className="text-green-700 font-medium text-sm">EMI starts from ₹{product.emiStarting?.toLocaleString() || Math.round((currentPrice || product.price) / 12).toLocaleString()}/month</p>
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
              {currentStock > 0 ? (
                <span className="text-green-600 text-sm flex items-center gap-1"><Check size={14} /> In Stock ({currentStock} available)</span>
              ) : (
                <span className="text-red-500 text-sm">Out of Stock</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleBuyNow} disabled={currentStock <= 0}
                className="flex-1 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
                Buy Now
              </button>
              <button onClick={handleAddToCart} disabled={currentStock <= 0}
                className="flex-1 bg-gold-600 hover:bg-gold-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button onClick={handleWishlist} className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition ${inWishlist ? 'bg-red-50 border-red-300 text-red-600' : 'hover:bg-gold-50'}`}>
                <Heart size={16} className={inWishlist ? 'fill-red-500' : ''} /> {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
              <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 border border-green-300 bg-green-50 text-green-700 rounded-xl text-sm hover:bg-green-100 transition">
                <MessageCircle size={16} /> Ask on WhatsApp
              </button>
              <button onClick={() => { navigator.share?.({ title: product.name, url: window.location.href }); }}
                className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gold-50 transition">
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
                <div key={i} className="text-center p-3 bg-gold-50 rounded-xl">
                  <f.icon size={20} className="mx-auto text-gold-600 mb-1" />
                  <p className="text-xs font-medium text-gray-700">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variant Price Table */}
        {hasVariants && product.variants.length > 1 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Variants</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-xl overflow-hidden">
                <thead className="bg-gold-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-gray-700 font-semibold">RAM</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-semibold">Storage</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-semibold">Price</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-semibold">MRP</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-semibold">Colors</th>
                    <th className="text-left py-2 px-3 text-gray-700 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v, i) => {
                    const totalStock = v.colors?.reduce((s, c) => s + (c.stock || 0), 0) || 0;
                    return (
                      <tr key={i} className="border-t hover:bg-gold-50/50 transition">
                        <td className="py-2 px-3">{v.ram || '-'}</td>
                        <td className="py-2 px-3">{v.storage || '-'}</td>
                        <td className="py-2 px-3 font-semibold text-gold-600">₹{v.price?.toLocaleString()}</td>
                        <td className="py-2 px-3 text-gray-400 line-through">₹{v.mrp?.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {v.colors?.map((c, ci) => (
                              <span key={ci} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{c.name} ({c.stock})</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className={totalStock > 0 ? 'text-green-600' : 'text-red-500'}>
                            {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        {/* Reviews */}
        <div className="mt-8 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Customer Reviews ({reviews.length})</h2>
            <div className="flex items-center gap-2">
              {product.ratings > 0 && (
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm">
                  <Star size={14} className="fill-green-700" /> {product.ratings}
                </div>
              )}
            </div>
          </div>

          {/* Write a review */}
          <div className="bg-gold-50/50 rounded-xl p-4 mb-6">
            <p className="font-semibold text-gray-800 mb-2">Write a Review</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewForm(prev => ({ ...prev, rating: n }))}
                  className={n <= reviewForm.rating ? 'text-gold-500' : 'text-gray-300'}>
                  <Star size={24} className={n <= reviewForm.rating ? 'fill-gold-500' : ''} />
                </button>
              ))}
            </div>
            <input value={reviewForm.title} onChange={e => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Review title (optional)"
              className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-gold-400 outline-none bg-white" />
            <textarea value={reviewForm.comment} onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this product..."
              rows={3}
              className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-white resize-none" />
            <div className="flex justify-end">
              <button onClick={submitReview} disabled={submittingReview}
                className="bg-gold-600 hover:bg-gold-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div></div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {(review.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{review.user?.name || 'Customer'}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} size={13} className={n <= review.rating ? 'fill-gold-500 text-gold-500' : 'text-gray-300'} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    {(user?.role === 'admin' || user?._id === review.user?._id) && (
                      <button onClick={() => deleteReview(review._id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg transition" title="Delete review">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  {review.title && <p className="mt-2 font-semibold text-gray-800 text-sm">{review.title}</p>}
                  <p className="mt-1 text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}
