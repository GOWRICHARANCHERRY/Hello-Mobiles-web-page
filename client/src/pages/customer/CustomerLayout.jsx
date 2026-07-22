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
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-primary-700 text-white text-xs py-1.5 px-4 flex justify-between items-center">
        <span>Free Delivery on orders above ₹5,000 | EMI Available</span>
        <span>Call: +91 99999 99999</span>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">HM</div>
            <div>
              <h1 className="text-lg font-bold text-primary-700 leading-tight">HELLO MOBILES</h1>
              <p className="text-[10px] text-gray-500">Mobiles | TVs | Electronics</p>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-r-lg hover:bg-primary-700 transition">
              <Search size={18} />
            </button>
          </form>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={`relative flex flex-col items-center text-xs transition ${location.pathname === link.to ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
                <div className="relative">
                  <link.icon size={20} />
                  {link.badge > 0 && <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{link.badge}</span>}
                </div>
                <span className="mt-1">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 ml-4">
            <Link to="/profile" className="text-sm text-gray-700 hover:text-primary-600 flex items-center gap-1">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-r-lg"><Search size={16} /></button>
          </div>
        </form>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-6 py-3 border-b ${location.pathname === link.to ? 'bg-primary-50 text-primary-600' : 'text-gray-700'}`}>
              <link.icon size={18} /> {link.label}
              {link.badge > 0 && <span className="ml-auto bg-accent-500 text-white text-xs rounded-full px-2">{link.badge}</span>}
            </Link>
          ))}
          <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700"><User size={18} /> Profile</Link>
          <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 text-red-500 w-full"><LogOut size={18} /> Logout</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">HELLO MOBILES</h3>
            <p className="text-gray-400 text-sm">Your trusted destination for mobiles, TVs, and electronics. Best prices, EMI options, and exchange offers.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link to="/products" className="block hover:text-white">All Products</Link>
              <Link to="/emi-calculator" className="block hover:text-white">EMI Calculator</Link>
              <Link to="/exchange-calculator" className="block hover:text-white">Exchange Calculator</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Categories</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <Link to="/products?category=Mobiles" className="block hover:text-white">Mobiles</Link>
              <Link to="/products?category=TVs" className="block hover:text-white">TVs</Link>
              <Link to="/products?category=Earbuds" className="block hover:text-white">Earbuds</Link>
              <Link to="/products?category=Laptops" className="block hover:text-white">Laptops</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>123 Main Street, City - 500001</p>
              <p>+91 99999 99999</p>
              <p>info@hellomobiles.com</p>
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
