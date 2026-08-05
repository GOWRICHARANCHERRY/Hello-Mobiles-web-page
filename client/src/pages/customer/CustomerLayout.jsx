import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { Home, Search, ShoppingCart, User, Heart, Menu, X, LogOut, Calculator, RotateCcw, LogIn, Mail, Instagram, CreditCard, Package, MapPin, Ticket, HelpCircle, Globe, ChevronDown, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import LoginPopup from '../../components/LoginPopup';
import SearchBar from '../../components/SearchBar';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const BAJAJ_CHECK_LIMIT_URL = 'https://www.bajajfinserv.in/qr-code-rural-web-page?xc=wZJcF8vPcfuCf8IpnelpO2wo91ynp9JJsM12UNYH40AFzOXsNG4aQX+fjLXg47b9TPaQyWA9RzzmbFi7op12aw==&utm_source=RURAL_ARU&utm_medium=OFFERMART_QR_GEN';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { cartCount, clearGuestCart } = useCart();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) return toast.error(t('comp.invalidEmail'));
    setNewsletterLoading(true);
    try {
      await api.post('/leads', { email: newsletterEmail.trim(), name: '', message: '', source: 'newsletter' });
      setNewsletterEmail('');
      toast.success(t('comp.subscribed'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('comp.subscribeFailed'));
    }
    setNewsletterLoading(false);
  };

  useEffect(() => {
    if (!user) clearGuestCart();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: t('comp.navHome'), icon: Home },
    { to: '/products', label: t('comp.navProducts'), icon: Search },
    { to: '/wishlist', label: t('comp.navWishlist'), icon: Heart, requiresAuth: true },
    { to: '/cart', label: t('comp.navCart'), icon: ShoppingCart, badge: user ? cartCount : 0, requiresAuth: true },
    { to: '/emi-calculator', label: t('comp.navEmiCalc'), icon: Calculator, requiresAuth: true },
    { to: '/exchange-calculator', label: t('comp.navExchange'), icon: RotateCcw, requiresAuth: true },
    { href: BAJAJ_CHECK_LIMIT_URL, label: t('comp.navCheckLimit'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gold-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gold-100 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Hello Mobiles" width="40" height="40" className="w-10 h-10 rounded-xl shadow-md group-hover:scale-110 transition-transform object-contain" />
            <div className="text-center">
              <h1 className="text-lg font-bold gold-text leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h1>
              <p className="hidden sm:block text-[10px] text-gray-500 whitespace-nowrap">{t('comp.headerTagline')}</p>
            </div>
          </Link>

          <SearchBar placeholder={t('comp.searchProducts')} className="hidden md:flex flex-1 max-w-xl mx-8" />

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => {
              if (link.href) {
                return (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="relative flex flex-col items-center text-xs transition-all duration-300 text-gray-600 hover:text-blue-600 cursor-pointer">
                    <div className="relative">
                      <link.icon size={20} />
                    </div>
                    <span className="mt-1 font-medium">{link.label}</span>
                  </a>
                );
              }
              const needsAuth = link.requiresAuth && !user;
              const Tag = needsAuth ? 'button' : Link;
              const props = needsAuth
                ? { onClick: () => setShowLoginPopup(true), className: `relative flex flex-col items-center text-xs transition-all duration-300 text-gray-600 hover:text-gold-700 cursor-pointer` }
                : { to: link.to, className: `relative flex flex-col items-center text-xs transition-all duration-300 ${location.pathname === link.to ? 'text-gold-700 scale-110' : 'text-gray-600 hover:text-gold-700'}` };
              return (
                <Tag key={link.to} {...props}>
                  <div className="relative">
                    <link.icon size={20} />
                    {link.badge > 0 && <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">{link.badge}</span>}
                  </div>
                  <span className="mt-1 font-medium">{link.label}</span>
                </Tag>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3 ml-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gold-700 transition font-medium">
                  <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-down">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.phone || user?.email}</p>
                    </div>

                    <Link to="/profile?tab=orders" onClick={() => setProfileOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gold-50 transition text-left">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Package size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('comp.orders')}</p>
                        <p className="text-xs text-gray-500">{t('comp.trackOrders')}</p>
                      </div>
                    </Link>

                    <Link to="/profile?tab=personal" onClick={() => setProfileOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gold-50 transition text-left">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('comp.personalDetails')}</p>
                        <p className="text-xs text-gray-500">{t('comp.personalDetailsSub')}</p>
                      </div>
                    </Link>

                    <Link to="/profile?tab=address" onClick={() => setProfileOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gold-50 transition text-left">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('comp.savedAddress')}</p>
                        <p className="text-xs text-gray-500">{t('comp.manageAddresses')}</p>
                      </div>
                    </Link>

                    <Link to="/profile?tab=coupons" onClick={() => setProfileOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gold-50 transition text-left">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Ticket size={16} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('comp.myCoupons')}</p>
                        <p className="text-xs text-gray-500">{t('comp.manageCoupons')}</p>
                      </div>
                    </Link>

                    <Link to="/profile?tab=help" onClick={() => setProfileOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gold-50 transition text-left">
                      <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <HelpCircle size={16} className="text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('comp.helpSupport')}</p>
                        <p className="text-xs text-gray-500">{t('comp.helpSupportSub')}</p>
                      </div>
                    </Link>

                    <Link to="/profile?tab=language" onClick={() => setProfileOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gold-50 transition text-left">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Globe size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('comp.preferredLanguage')}</p>
                        <p className="text-xs text-gray-500">{t('comp.langName')}</p>
                      </div>
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { setProfileOpen(false); logout(); }}
                        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 transition text-left text-red-600">
                        <LogOut size={16} /> <span className="text-sm font-semibold">{t('comp.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowLoginPopup(true)}
                className="gold-gradient text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 hover:opacity-90 transition shadow-md">
                <LogIn size={16} /> {t('comp.login')}
              </button>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar placeholder={t('comp.searchProducts')} />
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg animate-fade-in-down">
          {navLinks.map(link => {
            if (link.href) {
              return (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-3 border-b text-blue-600 hover:bg-blue-50 font-semibold">
                  <link.icon size={18} /> {link.label}
                </a>
              );
            }
            const needsAuth = link.requiresAuth && !user;
            if (needsAuth) {
              return (
                <button key={link.to} onClick={() => { setShowLoginPopup(true); setMenuOpen(false); }}
                  className={`flex items-center gap-3 px-6 py-3 border-b transition w-full text-left text-gray-700 hover:bg-gold-50`}>
                  <link.icon size={18} /> {link.label}
                </button>
              );
            }
            return (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 border-b transition ${location.pathname === link.to ? 'bg-gold-50 text-gold-700 font-semibold' : 'text-gray-700 hover:bg-gold-50'}`}>
                <link.icon size={18} /> {link.label}
                {link.badge > 0 && <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">{link.badge}</span>}
              </Link>
            );
          })}
          {user ? (
            <>
              <Link to="/profile?tab=orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><Package size={18} /> {t('comp.myOrders')}</Link>
              <Link to="/profile?tab=personal" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><User size={18} /> {t('comp.personalDetails')}</Link>
              <Link to="/profile?tab=address" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><MapPin size={18} /> {t('comp.savedAddress')}</Link>
              <Link to="/profile?tab=coupons" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><Ticket size={18} /> {t('comp.myCoupons')}</Link>
              <Link to="/profile?tab=help" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gold-50"><HelpCircle size={18} /> {t('comp.helpSupport')}</Link>
              <Link to="/profile?tab=language" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-gray-500 text-sm flex items-center gap-3 hover:bg-gold-50"><Globe size={18} /> {t('comp.languagePref', { langName: t('comp.langName') })}</Link>
              <div className="border-t border-gray-200"></div>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 text-red-500 w-full hover:bg-red-50"><LogOut size={18} /> {t('comp.logout')}</button>
            </>
          ) : (
            <button onClick={() => { setShowLoginPopup(true); setMenuOpen(false); }} className="flex items-center gap-3 px-6 py-3 text-gold-700 w-full hover:bg-gold-50 font-semibold"><LogIn size={18} /> {t('comp.login')}</button>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white mt-12">
        <div className="gold-gradient h-1"></div>

        {/* Newsletter */}
        <div className="border-b border-white/10 bg-gray-800/40">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-gold-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white">{t('comp.latestOffers')}</h3>
                <p className="text-sm text-gray-300">{t('comp.newsletterSub')}</p>
              </div>
            </div>
            <form onSubmit={handleNewsletter} className="flex w-full md:w-auto gap-2">
              <input type="email" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                placeholder={t('comp.enterEmail')}
                className="flex-1 md:w-72 bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none placeholder-gray-500" />
              <button type="submit" disabled={newsletterLoading}
                className="bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:from-gold-600 hover:to-gold-700 transition disabled:opacity-50 flex-shrink-0">
                {newsletterLoading ? t('comp.subscribing') : t('comp.subscribe')}
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Hello Mobiles" width="48" height="48" loading="lazy" className="w-12 h-12 rounded-xl shadow-lg object-contain border-2 border-gold-500/30" />
                <div>
                  <h3 className="text-xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h3>
                  <p className="text-[11px] text-gold-500/70 tracking-wider">{t('comp.footerBrandTagline')}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-5 max-w-sm">{t('comp.aboutDescription')}</p>
              <div className="flex items-center gap-3">
                <a href="https://wa.me/918886888128" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white hover:scale-110 transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://www.instagram.com/hellomobilesandelectronics?igsh=MW1wY3JhOTh3ZW81MA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 hover:bg-pink-500 hover:text-white hover:scale-110 transition-all duration-300">
                  <Instagram size={18} />
                </a>
                <a href="https://www.youtube.com/@HelloMobilesElectronics" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://www.facebook.com/hellomobilesandelectronics" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white hover:scale-110 transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.73-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="mailto:svlnmobiles12@gmail.com" aria-label="Email us"
                  className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-white hover:scale-110 transition-all duration-300">
                  <Mail size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">{t('comp.quickLinks')}</h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.navHome')}</Link></li>
                <li><Link to="/products" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.allProducts')}</Link></li>
                <li><Link to="/emi-calculator" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.emiCalculator')}</Link></li>
                <li><Link to="/exchange-calculator" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.exchangeCalculator')}</Link></li>
                <li><a href={BAJAJ_CHECK_LIMIT_URL} target="_blank" rel="noopener noreferrer" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.checkBajajLimit')}</a></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">{t('comp.categories')}</h4>
              <ul className="space-y-2.5">
              <li><Link to="/products?category=Mobiles" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.categoryMobiles')}</Link></li>
              <li><Link to="/products?category=Electronics" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.categoryElectronics')}</Link></li>
              <li><Link to="/products?category=Home%20Appliances" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.categoryHomeAppliances')}</Link></li>
              <li><Link to="/products?category=Furniture" className="text-gray-300 text-sm hover:text-gold-400 transition flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full"></span>{t('comp.categoryFurniture')}</Link></li>
              </ul>
            </div>

            {/* Our Stores */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">{t('comp.ourStores')}</h4>
              <div className="space-y-4">
                <a href="https://maps.app.goo.gl/8HxWnUeXKD8WgvRs8" target="_blank" rel="noopener noreferrer" className="block group">
                  <p className="font-semibold text-sm text-white group-hover:text-gold-400 transition flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gold-500"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {t('comp.storeAllur')}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{t('comp.storeAllurSub')}</p>
                </a>
                <a href="https://maps.app.goo.gl/t2NDNdpWf8zp8R4L8" target="_blank" rel="noopener noreferrer" className="block group">
                  <p className="font-semibold text-sm text-white group-hover:text-gold-400 transition flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gold-500"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {t('comp.storeBuchi')}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{t('comp.storeBuchiSub')}</p>
                </a>
                <div className="pt-2 space-y-1.5 text-sm text-gray-300">
                  <p className="flex items-center gap-2">📞 <span>+91 97157 36736</span></p>
                  <p className="flex items-center gap-2">💬 <span>+91 88868 88128 (WhatsApp)</span></p>
                  <p className="flex items-center gap-2">✉️ <span>svlnmobiles12@gmail.com</span></p>
                  <p className="flex items-center gap-2">⏰ <span>09:00 AM – 10:00 PM</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; 2024 Hello Mobiles & Electronics. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap justify-center">
              <Link to="/terms-and-conditions" className="hover:text-gold-400 transition">{t('comp.termsConditions')}</Link>
              <Link to="/terms-and-conditions" className="hover:text-gold-400 transition">{t('comp.privacyPolicy')}</Link>
              <Link to="/terms-and-conditions" className="hover:text-gold-400 transition">{t('comp.returnsRefunds')}</Link>
              <Link to="/about" className="hover:text-gold-400 transition">{t('comp.aboutUs')}</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/918886888128" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse no-print">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}
