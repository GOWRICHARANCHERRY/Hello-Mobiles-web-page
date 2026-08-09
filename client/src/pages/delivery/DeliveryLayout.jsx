import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bike, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import NewOrderNotifier from '../../components/NewOrderNotifier';

export default function DeliveryLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const links = [
    { to: '/delivery', label: t('delv.myDeliveries'), icon: Bike },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <NewOrderNotifier />
      {/* Mobile backdrop - closes sidebar on outside click */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-gold-700 text-white transition-transform md:sticky md:top-0 md:inset-y-auto md:h-screen flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Hello Mobiles" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            <div>
              <h1 className="text-lg font-bold">HELLO MOBILES</h1>
              <p className="text-blue-200 text-xs">{t('delv.portal')}</p>
            </div>
          </div>
        </div>
        <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
          {links.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === link.to ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <link.icon size={18} /> {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-blue-200">{user?.phone}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-blue-200 hover:text-white mt-3 text-sm w-full">
            <LogOut size={16} /> {t('delv.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="font-bold">{t('delv.portal')}</h1>
          <div></div>
        </header>
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
