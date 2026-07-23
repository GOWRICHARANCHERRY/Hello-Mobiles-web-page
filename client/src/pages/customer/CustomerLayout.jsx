import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Home, Search, ShoppingCart, User, Heart, Menu, X, LogOut, Calculator, RotateCcw, LogIn, Mail, Instagram } from 'lucide-react';
import { useState } from 'react';
import LoginPopup from '../../components/LoginPopup';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginPopup, setShowLoginPopup] = useState(false);
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
            <img src="/logo.png" alt="Hello Mobiles" className="w-10 h-10 rounded-xl shadow-md group-hover:scale-110 transition-transform object-contain" />
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
            {user ? (
              <>
                <Link to="/profile" className="text-sm text-gray-700 hover:text-gold-600 flex items-center gap-1 transition font-medium">
                  <User size={18} /> {user?.name?.split(' ')[0]}
                </Link>
                <button onClick={logout} className="text-gray-500 hover:text-red-500 transition"><LogOut size={18} /></button>
              </>
            ) : (
              <button onClick={() => setShowLoginPopup(true)}
                className="gold-gradient text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 hover:opacity-90 transition shadow-md">
                <LogIn size={16} /> Login
              </button>
            )}
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
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><User size={18} /> Profile</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 text-red-500 w-full hover:bg-red-50"><LogOut size={18} /> Logout</button>
            </>
          ) : (
            <button onClick={() => { setShowLoginPopup(true); setMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 text-gold-600 w-full hover:bg-gold-50 font-semibold"><LogIn size={18} /> Login</button>
          )}
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
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Hello Mobiles" className="w-8 h-8 rounded-lg object-contain" />
              <h3 className="font-bold text-lg gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h3>
            </div>
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
        <div className="border-t border-gray-800 py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">&copy; 2024 Hello Mobiles & Electronics. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/hellomobilesandelectronics?igsh=MW1wY3JhOTh3ZW81MA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-pink-500 transition text-sm">
                <Instagram size={16} /> Instagram
              </a>
              <a href="mailto:svlnmobiles12@gmail.com"
                className="flex items-center gap-1.5 text-gray-400 hover:text-gold-400 transition text-sm">
                <Mail size={16} /> svlnmobiles12@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/918886888128" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}
