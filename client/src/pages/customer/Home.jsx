import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Smartphone, Tv, Watch, Headphones, Laptop, Home, Zap, Shield, Truck, Percent, ChevronRight, Star } from 'lucide-react';

const categories = [
  { name: 'Mobiles', icon: Smartphone, color: 'bg-blue-500' },
  { name: 'TVs', icon: Tv, color: 'bg-purple-500' },
  { name: 'Smart Watches', icon: Watch, color: 'bg-green-500' },
  { name: 'Earbuds', icon: Headphones, color: 'bg-pink-500' },
  { name: 'Laptops', icon: Laptop, color: 'bg-orange-500' },
  { name: 'Home Appliances', icon: Home, color: 'bg-teal-500' },
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
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="gradient-bg rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Welcome to Hello Mobiles</h2>
          <p className="text-blue-100 text-lg mb-6 max-w-xl">Best deals on mobiles, TVs, and electronics. EMI available, exchange offers, and free delivery!</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/products" className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">Shop Now</Link>
            <Link to="/exchange-calculator" className="border border-white/50 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">Exchange Old Phone</Link>
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'No Cost EMI', desc: '0% interest' },
          { icon: Percent, label: 'Cashback Offers', desc: 'Up to 10% off' },
          { icon: Truck, label: 'Free Delivery', desc: 'Orders above ₹5K' },
          { icon: Shield, label: 'Genuine Products', desc: '100% authentic' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm card-hover">
            <div className="bg-primary-100 text-primary-600 w-12 h-12 rounded-lg flex items-center justify-center"><item.icon size={22} /></div>
            <div>
              <p className="font-semibold text-sm text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Shop by Category</h2>
          <Link to="/products" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link key={cat.name} to={`/products?category=${cat.name}`} className="bg-white rounded-xl p-4 text-center shadow-sm card-hover">
              <div className={`${cat.color} text-white w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <cat.icon size={26} />
              </div>
              <p className="text-sm font-medium text-gray-700">{cat.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Featured Brands</h2>
        <div className="flex flex-wrap gap-3">
          {brands.map(brand => (
            <Link key={brand} to={`/products?brand=${brand}`}
              className="bg-white border-2 border-gray-200 rounded-xl px-6 py-3 font-semibold text-gray-700 hover:border-primary-500 hover:text-primary-600 transition">
              {brand}
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Offers */}
      {offerProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Today's Offers</h2>
            <Link to="/products?onOffer=true" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offerProducts.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Featured Products</h2>
            <Link to="/products?featured=true" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">New Arrivals</h2>
            <Link to="/products?newArrival=true" className="text-primary-600 text-sm flex items-center gap-1 hover:underline">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newArrivals.slice(0, 4).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* EMI & Exchange Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">No Cost EMI Available</h3>
          <p className="text-blue-100 text-sm mb-4">Buy now and pay in easy installments. 0% interest on all major banks.</p>
          <Link to="/emi-calculator" className="bg-white text-blue-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition inline-block">Calculate EMI</Link>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Exchange Your Old Phone</h3>
          <p className="text-orange-100 text-sm mb-4">Get instant exchange value for your old phone. Best prices guaranteed.</p>
          <Link to="/exchange-calculator" className="bg-white text-orange-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-50 transition inline-block">Check Value</Link>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Visit Our Store</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Hello Mobiles</h3>
            <p className="text-gray-600">123 Main Street, Near City Center</p>
            <p className="text-gray-600">City - 500001</p>
            <p className="text-gray-600">Phone: +91 99999 99999</p>
            <p className="text-gray-600">Timing: 10:00 AM - 9:00 PM (All days)</p>
          </div>
          <div className="bg-gray-200 rounded-xl h-48 flex items-center justify-center text-gray-500">
            <p>Google Map Embed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <Link to={`/products/${product._id}`} className="bg-white rounded-xl shadow-sm overflow-hidden card-hover block">
      <div className="bg-gray-100 p-4 h-48 flex items-center justify-center relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full object-contain" />
        ) : (
          <div className="text-gray-400 text-sm">No Image</div>
        )}
        {discount > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">{discount}% OFF</span>}
        {product.isNewArrival && <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">NEW</span>}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">{product.brand}</p>
        <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>}
        </div>
        {product.emiAvailable && <p className="text-xs text-green-600 mt-1">EMI from ₹{Math.round(product.price / 12).toLocaleString()}/mo</p>}
        {product.ratings > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">{product.ratings} ({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
