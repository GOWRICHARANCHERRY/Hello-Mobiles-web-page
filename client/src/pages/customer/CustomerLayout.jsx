import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Home, Search, ShoppingCart, User, Heart, Menu, X, LogOut, Calculator, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Products', icon: Search },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { to: '/emi-calculator', label: 'EMI Calc', icon: Calculator },
    { to: '/exchange-calculator', label: 'Exchange', icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen bg-gold-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gold-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="gold-gradient text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-110 transition-transform">HM</div>
            <div>
              <h1 className="text-lg font-bold gold-text leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h1>
              <p className="text-[10px] text-gray-500">Mobiles | TVs | Electronics</p>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
              className="w-full px-4 py-2 border-2 border-gold-200 rounded-l-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition bg-gold-50" />
            <button type="submit" className="gold-gradient text-white px-6 py-2 rounded-r-lg hover:opacity-90 transition shadow-md">
              <Search size={18} />
            </button>
          </form>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={`relative flex flex-col items-center text-xs transition-all duration-300 ${location.pathname === link.to ? 'text-gold-600 scale-110' : 'text-gray-600 hover:text-gold-600'}`}>
                <div className="relative">
                  <link.icon size={20} />
                  {link.badge > 0 && <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">{link.badge}</span>}
                </div>
                <span className="mt-1 font-medium">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 ml-4">
            <Link to="/profile" className="text-sm text-gray-700 hover:text-gold-600 flex items-center gap-1 transition font-medium">
              <User size={18} /> {user?.name?.split(' ')[0]}
            </Link>
            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition"><LogOut size={18} /></button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="flex">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
              className="w-full px-4 py-2 border-2 border-gold-200 rounded-l-lg focus:ring-2 focus:ring-gold-400 outline-none text-sm bg-gold-50" />
            <button type="submit" className="gold-gradient text-white px-4 py-2 rounded-r-lg"><Search size={16} /></button>
          </div>
        </form>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg animate-fade-in-down">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-3 border-b transition ${location.pathname === link.to ? 'bg-gold-50 text-gold-600 font-semibold' : 'text-gray-700 hover:bg-gold-50'}`}>
              <link.icon size={18} /> {link.label}
              {link.badge > 0 && <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">{link.badge}</span>}
            </Link>
          ))}
          <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><User size={18} /> Profile</Link>
          <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 text-red-500 w-full hover:bg-red-50"><LogOut size={18} /> Logout</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="gold-gradient h-1"></div>
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3 gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h3>
            <p className="text-gray-400 text-sm">Your trusted destination for mobiles, TVs, and electronics. Best prices, EMI options, and exchange offers.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gold-400">Quick Links</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link to="/products" className="block hover:text-gold-400 transition">All Products</Link>
              <Link to="/emi-calculator" className="block hover:text-gold-400 transition">EMI Calculator</Link>
              <Link to="/exchange-calculator" className="block hover:text-gold-400 transition">Exchange Calculator</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gold-400">Categories</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link to="/products?category=Mobiles" className="block hover:text-gold-400 transition">Mobiles</Link>
              <Link to="/products?category=TVs" className="block hover:text-gold-400 transition">TVs</Link>
              <Link to="/products?category=Earbuds" className="block hover:text-gold-400 transition">Earbuds</Link>
              <Link to="/products?category=Laptops" className="block hover:text-gold-400 transition">Laptops</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gold-400">Our Stores</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <a href="https://maps.app.goo.gl/8HxWnUeXKD8WgvRs8" target="_blank" rel="noopener noreferrer" className="block hover:text-gold-400 transition">
                <p className="font-medium text-white">Hello Mobiles - Allur</p>
                <p>Allur, Andhra Pradesh</p>
              </a>
              <a href="https://maps.app.goo.gl/t2NDNdpWf8zp8R4L8" target="_blank" rel="noopener noreferrer" className="block hover:text-gold-400 transition">
                <p className="font-medium text-white">Hello Mobiles - Buchi</p>
                <p>Buchi, Andhra Pradesh</p>
              </a>
              <p>📞 +91 88868 88128</p>
              <p>⏰ 10:00 AM - 9:00 PM</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 text-center py-4 text-sm text-gray-500">
          &copy; 2024 Hello Mobiles & Electronics. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
