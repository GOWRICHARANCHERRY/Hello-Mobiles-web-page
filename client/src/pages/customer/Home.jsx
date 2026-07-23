import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import HeroCarousel from '../../components/HeroCarousel';
import { Smartphone, Tv, Watch, Headphones, Laptop, Home as HomeIcon, Zap, Shield, Truck, Percent, ChevronRight, Star, Gift, CreditCard, RotateCcw } from 'lucide-react';

const categories = [
  { name: 'Mobiles', icon: Smartphone, color: 'from-gold-400 to-gold-600' },
  { name: 'TVs', icon: Tv, color: 'from-amber-400 to-amber-600' },
  { name: 'Smart Watches', icon: Watch, color: 'from-yellow-400 to-yellow-600' },
  { name: 'Earbuds', icon: Headphones, color: 'from-gold-500 to-amber-500' },
  { name: 'Laptops', icon: Laptop, color: 'from-orange-400 to-orange-600' },
  { name: 'Home Appliances', icon: HomeIcon, color: 'from-gold-600 to-gold-800' },
];

const brands = ['Apple', 'Samsung', 'Vivo', 'Oppo', 'Realme', 'Redmi', 'Sony', 'LG'];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    api.get('/products?featured=true').then(r => setFeaturedProducts(r.data)).catch(() => {});
    api.get('/products?onOffer=true').then(r => setOfferProducts(r.data)).catch(() => {});
    api.get('/products?newArrival=true').then(r => setNewArrivals(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Feature Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'No Cost EMI', desc: '0% interest available' },
          { icon: Percent, label: 'Festival Offers', desc: 'Up to 40% off' },
          { icon: Truck, label: 'Free Delivery', desc: 'On orders above ₹5K' },
          { icon: Shield, label: 'Genuine Products', desc: '100% authentic' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm card-hover animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
              <item.icon size={22} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium transition">View All <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <Link key={cat.name} to={`/products?category=${cat.name}`}
              className="bg-white rounded-xl p-5 text-center shadow-sm card-hover group animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`bg-gradient-to-br ${cat.color} text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <cat.icon size={28} />
              </div>
              <p className="text-sm font-semibold text-gray-700">{cat.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h2 className="section-title">Featured Brands</h2>
        <div className="flex flex-wrap gap-3">
          {brands.map((brand, i) => (
            <Link key={brand} to={`/products?brand=${brand}`}
              className="bg-white border-2 border-gold-200 rounded-xl px-6 py-3 font-semibold text-gray-700 hover:border-gold-500 hover:text-gold-700 hover:bg-gold-50 transition-all duration-300 card-hover animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              {brand}
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Offers */}
      {offerProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title flex items-center gap-2">
              <Gift className="text-gold-500" size={28} /> Today's Offers
            </h2>
            <Link to="/products?onOffer=true" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offerProducts.slice(0, 4).map((product, i) => (
              <ProductCard key={product._id} product={product} delay={i} />
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products?featured=true" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.slice(0, 4).map((product, i) => (
              <ProductCard key={product._id} product={product} delay={i} />
            ))}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">New Arrivals</h2>
            <Link to="/products?newArrival=true" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newArrivals.slice(0, 4).map((product, i) => (
              <ProductCard key={product._id} product={product} delay={i} />
            ))}
          </div>
        </div>
      )}

      {/* EMI & Exchange */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/emi-calculator" className="bg-gradient-to-br from-gold-600 via-gold-500 to-amber-500 rounded-2xl p-8 text-white card-hover group block">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform"><CreditCard size={28} /></div>
            <h3 className="text-xl font-bold">No Cost EMI Available</h3>
          </div>
          <p className="text-gold-100 text-sm mb-4">Buy now and pay in easy installments. 0% interest on all major banks.</p>
          <span className="bg-white text-gold-700 px-5 py-2 rounded-lg text-sm font-semibold inline-block group-hover:shadow-lg transition">Calculate EMI →</span>
        </Link>
        <Link to="/exchange-calculator" className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 text-white card-hover group block">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform"><RotateCcw size={28} /></div>
            <h3 className="text-xl font-bold">Exchange Your Old Phone</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">Get instant exchange value for your old phone. Best prices guaranteed.</p>
          <span className="bg-gold-500 text-white px-5 py-2 rounded-lg text-sm font-semibold inline-block group-hover:shadow-lg transition">Check Value →</span>
        </Link>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl p-8 shadow-sm gold-border">
        <h2 className="section-title">Visit Our Stores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="https://maps.app.goo.gl/8HxWnUeXKD8WgvRs8" target="_blank" rel="noopener noreferrer"
            className="bg-gold-50 rounded-xl p-6 card-hover group block border-2 border-gold-200 hover:border-gold-400 transition">
            <h3 className="font-bold text-xl gold-text mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Hello Mobiles - Allur</h3>
            <p className="text-gray-600 text-sm">📍 Allur, Andhra Pradesh</p>
            <p className="text-gray-600 text-sm">📞 +91 88868 88128</p>
            <p className="text-gray-600 text-sm">⏰ 10:00 AM - 9:00 PM (All days)</p>
            <span className="text-gold-600 text-sm font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              View on Google Maps →
            </span>
          </a>
          <a href="https://maps.app.goo.gl/t2NDNdpWf8zp8R4L8" target="_blank" rel="noopener noreferrer"
            className="bg-gold-50 rounded-xl p-6 card-hover group block border-2 border-gold-200 hover:border-gold-400 transition">
            <h3 className="font-bold text-xl gold-text mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Hello Mobiles - Buchi</h3>
            <p className="text-gray-600 text-sm">📍 Buchi, Andhra Pradesh</p>
            <p className="text-gray-600 text-sm">📞 +91 88868 88128</p>
            <p className="text-gray-600 text-sm">⏰ 10:00 AM - 9:00 PM (All days)</p>
            <span className="text-gold-600 text-sm font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              View on Google Maps →
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, delay = 0 }) {
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <Link to={`/products/${product._id}`}
      className="bg-white rounded-xl shadow-sm overflow-hidden card-hover block animate-fade-in-up" style={{ animationDelay: `${delay * 0.1}s` }}>
      <div className="bg-gradient-to-br from-gold-50 to-amber-50 p-4 h-48 flex items-center justify-center relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full object-contain hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="text-gray-400 text-sm">No Image</div>
        )}
        {discount > 0 && <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">{discount}% OFF</span>}
        {product.isNewArrival && <span className="absolute top-2 right-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">NEW</span>}
      </div>
      <div className="p-4">
        <p className="text-xs text-gold-600 font-semibold">{product.brand}</p>
        <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>}
        </div>
        {product.emiAvailable && <p className="text-xs text-gold-600 mt-1 font-medium">EMI from ₹{Math.round(product.price / 12).toLocaleString()}/mo</p>}
        {product.ratings > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star size={12} className="fill-gold-400 text-gold-400" />
            <span className="text-xs text-gray-600">{product.ratings} ({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
