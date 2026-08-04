import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';
import HeroCarousel from '../../components/HeroCarousel';
import TextBannerCarousel from '../../components/TextBannerCarousel';
import { Zap, Shield, Truck, Percent, ChevronRight, Star, Gift, CreditCard, RotateCcw, LogIn } from 'lucide-react';

const categories = [
  { name: 'Mobiles', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <rect x="16" y="4" width="32" height="56" rx="6" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="20" y="10" width="24" height="36" rx="2" fill="white" fillOpacity="0.3"/>
      <circle cx="32" cy="52" r="2.5" fill="white"/>
      <rect x="27" y="6" width="10" height="1.5" rx="1" fill="white" fillOpacity="0.5"/>
    </svg>
  )},
  { name: 'TVs', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <rect x="4" y="8" width="56" height="36" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="8" y="12" width="48" height="28" rx="2" fill="white" fillOpacity="0.3"/>
      <rect x="24" y="48" width="16" height="2" rx="1" fill="white"/>
      <rect x="20" y="50" width="24" height="3" rx="1.5" fill="white" fillOpacity="0.6"/>
    </svg>
  )},
  { name: 'Smart Watches', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <rect x="18" y="2" width="28" height="8" rx="3" fill="white" fillOpacity="0.5"/>
      <rect x="18" y="54" width="28" height="8" rx="3" fill="white" fillOpacity="0.5"/>
      <rect x="14" y="10" width="36" height="44" rx="10" stroke="white" strokeWidth="2.5" fill="none"/>
      <circle cx="32" cy="32" r="12" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2"/>
      <line x1="32" y1="24" x2="32" y2="32" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="32" x2="38" y2="32" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
  { name: 'Earbuds', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <ellipse cx="20" cy="24" rx="8" ry="10" stroke="white" strokeWidth="2.5" fill="white" fillOpacity="0.2"/>
      <path d="M20 34 L20 50" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="44" cy="24" rx="8" ry="10" stroke="white" strokeWidth="2.5" fill="white" fillOpacity="0.2"/>
      <path d="M44 34 L44 50" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="20" cy="22" r="3" fill="white" fillOpacity="0.5"/>
      <circle cx="44" cy="22" r="3" fill="white" fillOpacity="0.5"/>
    </svg>
  )},
  { name: 'Laptops', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <rect x="8" y="8" width="48" height="32" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="12" y="12" width="40" height="24" rx="2" fill="white" fillOpacity="0.3"/>
      <path d="M4 44 L12 40 L52 40 L60 44 L60 48 Q60 50 58 50 L6 50 Q4 50 4 48 Z" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.15"/>
    </svg>
  )},
  { name: 'Electronics', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <rect x="14" y="14" width="36" height="36" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="20" y="20" width="24" height="24" rx="2" fill="white" fillOpacity="0.2"/>
      <rect x="26" y="26" width="12" height="12" rx="1.5" stroke="white" strokeWidth="1.5"/>
      <line x1="20" y1="32" x2="6" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="32" x2="58" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="20" x2="32" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="44" x2="32" y2="56" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )},
  { name: 'Home Appliances', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <rect x="10" y="6" width="44" height="52" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
      <circle cx="32" cy="30" r="14" stroke="white" strokeWidth="2" fill="white" fillOpacity="0.15"/>
      <circle cx="32" cy="30" r="8" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.2"/>
      <rect x="14" y="50" width="8" height="2" rx="1" fill="white" fillOpacity="0.6"/>
      <rect x="26" y="50" width="12" height="2" rx="1" fill="white" fillOpacity="0.6"/>
      <rect x="42" y="50" width="8" height="2" rx="1" fill="white" fillOpacity="0.6"/>
    </svg>
  )},
  { name: 'Furniture', color: 'from-gold-400 to-gold-600', svg: (
    <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14 md:w-16 md:h-16">
      <path d="M8 40 Q8 30 16 28 L16 20 Q16 16 20 16 L44 16 Q48 16 48 20 L48 28 Q56 30 56 40" stroke="white" strokeWidth="2.5" fill="none"/>
      <rect x="6" y="38" width="52" height="10" rx="4" stroke="white" strokeWidth="2.5" fill="white" fillOpacity="0.25"/>
      <line x1="12" y1="48" x2="12" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="52" y1="48" x2="52" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )},
];

const brands = [
  { name: 'Apple', slug: 'apple', color: '555555' },
  { name: 'Samsung', slug: 'samsung', color: '1428A0' },
  { name: 'Vivo', slug: 'vivo', color: '415FFF' },
  { name: 'Oppo', slug: 'oppo', color: '1BA784' },
  { name: 'Realme', slug: null, img: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Realme_logo_SVG.svg' },
  { name: 'Redmi', slug: 'xiaomi', color: 'FF6900' },
  { name: 'Sony', slug: 'sony', color: '000000' },
  { name: 'LG', slug: 'lg', color: 'A50034' },
];

import LoginPopup from '../../components/LoginPopup';

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    api.get('/products?featured=true').then(r => setFeaturedProducts(r.data)).catch(() => {});
    api.get('/products?onOffer=true').then(r => setOfferProducts(r.data)).catch(() => {});
    api.get('/products?newArrival=true').then(r => setNewArrivals(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-10 animate-fade-in">
      <SEO
        title="Home"
        description="Hello Mobiles — Your one-stop shop for mobile phones, electronics, laptops, TVs, and gadgets in Visakhapatnam. Best prices, EMI options, and home delivery."
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Hello Mobiles',
          description: 'Mobile phones, electronics, laptops, TVs, and gadgets store in Visakhapatnam',
          url: 'https://hello-mobiles.com',
          telephone: '+91-88868-88128',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Visakhapatnam',
            addressRegion: 'Andhra Pradesh',
            addressCountry: 'IN',
          },
          areaServed: 'Visakhapatnam',
          priceRange: '₹',
          image: 'https://hello-mobiles.com/logo.png',
        }}
      />
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Banner 2 — Text Offers Carousel */}
      <TextBannerCarousel />

      {/* Feature Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: t('cust.noCostEmi'), desc: t('cust.noCostEmiDesc') },
          { icon: Percent, label: t('cust.festivalOffers'), desc: t('cust.festivalOffersDesc') },
          { icon: Truck, label: t('cust.freeDelivery'), desc: t('cust.freeDeliveryDesc') },
          { icon: Shield, label: t('cust.genuineProducts'), desc: t('cust.genuineProductsDesc') },
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
          <h2 className="section-title">{t('cust.shopByCategory')}</h2>
          <Link to="/products" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium transition">{t('cust.viewAll')} <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          {categories.map((cat, i) => (
            <Link key={cat.name} to={`/products?category=${cat.name}`}
              className="bg-white rounded-xl p-3 md:p-4 text-center shadow-sm card-hover group animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`bg-gradient-to-br ${cat.color} w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {cat.svg}
              </div>
              <p className="text-[11px] md:text-sm font-semibold text-gray-700 leading-tight">{cat.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">{t('cust.featuredBrands')}</h2>
          <Link to="/products" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium transition">{t('cust.viewAll')} <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {brands.map((brand, i) => (
            <Link key={brand.name} to={`/products?brand=${brand.name}`}
              className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-100 hover:border-gold-300 hover:shadow-md card-hover group animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              {brand.slug ? (
                <img src={`https://cdn.simpleicons.org/${brand.slug}/${brand.color}`} alt={brand.name}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <img src={brand.img} alt={brand.name}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain group-hover:scale-110 transition-transform duration-300" />
              )}
              <span className="text-xs md:text-sm font-semibold text-gray-700 group-hover:text-gold-600 transition">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Offers */}
      {offerProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title flex items-center gap-2">
              <Gift className="text-gold-500" size={28} /> {t('cust.todaysOffers')}
            </h2>
            <Link to="/products?onOffer=true" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium">{t('cust.viewAll')} <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            <h2 className="section-title">{t('cust.featuredProducts')}</h2>
            <Link to="/products?featured=true" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium">{t('cust.viewAll')} <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            <h2 className="section-title">{t('cust.newArrivals')}</h2>
            <Link to="/products?newArrival=true" className="text-gold-600 text-sm flex items-center gap-1 hover:text-gold-700 font-medium">{t('cust.viewAll')} <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            <h3 className="text-xl font-bold">{t('cust.noCostEmiAvailable')}</h3>
          </div>
          <p className="text-gold-100 text-sm mb-4">{t('cust.noCostEmiDesc')}</p>
          <span className="bg-white text-gold-700 px-5 py-2 rounded-lg text-sm font-semibold inline-block group-hover:shadow-lg transition">{t('cust.calculateEmi')} →</span>
        </Link>
        <Link to="/exchange-calculator" className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 text-white card-hover group block">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform"><RotateCcw size={28} /></div>
            <h3 className="text-xl font-bold">{t('cust.exchangeYourOldPhone')}</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">{t('cust.exchangeDesc')}</p>
          <span className="bg-gold-500 text-white px-5 py-2 rounded-lg text-sm font-semibold inline-block group-hover:shadow-lg transition">{t('cust.checkValue')} →</span>
        </Link>
      </div>

      {/* Financing Partners */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm gold-border">
        <div className="text-center mb-6">
          <h2 className="section-title inline-block">{t('cust.financePartners')}</h2>
          <p className="text-gray-500 text-sm mt-2">{t('cust.financePartnersDesc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <a href="https://www.bajajfinserv.in/qr-code-rural-web-page?xc=wZJcF8vPcfuCf8IpnelpO2wo91ynp9JJsM12UNYH40AFzOXsNG4aQX+fjLXg47b9TPaQyWA9RzzmbFi7op12aw==&utm_source=RURAL_ARU&utm_medium=OFFERMART_QR_GEN" target="_blank" rel="noopener noreferrer"
            className="bg-gradient-to-br from-blue-50 to-blue-100/80 rounded-2xl p-6 flex flex-col items-center text-center card-hover border-2 border-blue-200 hover:border-blue-400 transition group block">
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 w-full flex items-center justify-center group-hover:shadow-md transition">
              <img src="/bajaj-finserv.png" alt="Bajaj Finserv" className="h-12 object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Bajaj Finserv</h3>
            <p className="text-gray-500 text-xs mt-1">No Cost EMI · 0% Interest · 3-24 months</p>
            <span className="mt-3 bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full group-hover:bg-blue-700 transition">Check Limit →</span>
          </a>

          <div className="bg-gradient-to-br from-red-50 to-orange-100/80 rounded-2xl p-6 flex flex-col items-center text-center card-hover border-2 border-red-200 hover:border-red-400 transition">
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 w-full flex items-center justify-center">
              <img src="/tvs-credit.svg" alt="TVS Credit" className="h-12 object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">TVS Credit</h3>
            <p className="text-gray-500 text-xs mt-1">Easy EMI · Quick Approval · 6-18 months</p>
            <span className="mt-3 bg-red-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">Available ✓</span>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-100/80 rounded-2xl p-6 flex flex-col items-center text-center card-hover border-2 border-orange-200 hover:border-orange-400 transition">
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 w-full flex items-center justify-center">
              <img src="/chola-finance.svg" alt="Chola Finance" className="h-12 object-contain" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Chola Finance</h3>
            <p className="text-gray-500 text-xs mt-1">Low EMI · Flexible Tenure · 6-24 months</p>
            <span className="mt-3 bg-orange-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">Available ✓</span>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl p-8 shadow-sm gold-border">
        <h2 className="section-title">{t('cust.visitOurStores')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="https://maps.app.goo.gl/8HxWnUeXKD8WgvRs8" target="_blank" rel="noopener noreferrer"
            className="bg-gold-50 rounded-xl p-6 card-hover group block border-2 border-gold-200 hover:border-gold-400 transition">
            <h3 className="font-bold text-xl gold-text mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Hello Mobiles - Allur</h3>
            <p className="text-gray-600 text-sm">📍 Allur, Andhra Pradesh</p>
            <p className="text-gray-600 text-sm">📞 +91 88868 88128</p>
            <p className="text-gray-600 text-sm">⏰ 10:00 AM - 9:00 PM (All days)</p>
            <span className="text-gold-600 text-sm font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              {t('cust.viewOnGoogleMaps')} →
            </span>
          </a>
          <a href="https://maps.app.goo.gl/t2NDNdpWf8zp8R4L8" target="_blank" rel="noopener noreferrer"
            className="bg-gold-50 rounded-xl p-6 card-hover group block border-2 border-gold-200 hover:border-gold-400 transition">
            <h3 className="font-bold text-xl gold-text mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Hello Mobiles - Buchi</h3>
            <p className="text-gray-600 text-sm">📍 Buchi, Andhra Pradesh</p>
            <p className="text-gray-600 text-sm">📞 +91 88868 88128</p>
            <p className="text-gray-600 text-sm">⏰ 10:00 AM - 9:00 PM (All days)</p>
            <span className="text-gold-600 text-sm font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              {t('cust.viewOnGoogleMaps')} →
            </span>
          </a>
        </div>
      </div>

      {/* Login CTA for guests */}
      {!user && (
        <div className="gold-gradient rounded-2xl p-6 text-center text-white">
          <p className="text-lg font-semibold mb-2">{t('cust.loginUnlockDeals')}</p>
          <button onClick={() => setShowLoginPopup(true)}
            className="bg-white text-gold-700 px-6 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition inline-flex items-center gap-2">
            <LogIn size={16} /> {t('cust.loginNow')}
          </button>
        </div>
      )}

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}

function ProductCard({ product, delay = 0 }) {
  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <Link to={`/products/${product._id}`}
      className="bg-white rounded-xl shadow-sm overflow-hidden card-hover block animate-fade-in-up" style={{ animationDelay: `${delay * 0.1}s` }}>
      <div className="bg-gradient-to-br from-gold-50 to-amber-50 p-3 sm:p-4 h-32 sm:h-48 flex items-center justify-center relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full object-contain hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="text-gray-400 text-sm">No Image</div>
        )}
        {discount > 0 && <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">{discount}% OFF</span>}
        {product.isNewArrival && <span className="absolute top-2 right-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">NEW</span>}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-xs text-gold-600 font-semibold">{product.brand}</p>
        <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">{product.name}</h3>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 sm:mt-2">
          <span className="text-base sm:text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          {product.mrp > product.price && <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>}
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
