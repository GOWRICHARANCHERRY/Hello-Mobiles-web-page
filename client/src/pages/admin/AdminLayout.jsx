import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LayoutDashboard, Package, ShoppingCart, Users, UserCheck, BarChart3, LogOut, Menu, X, Image, Tag, Mail } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard },
    { to: '/admin/products', label: t('admin.products'), icon: Package },
    { to: '/admin/banners', label: t('admin.banners'), icon: Image },
    { to: '/admin/orders', label: t('admin.orders'), icon: ShoppingCart },
    { to: '/admin/employees', label: t('admin.employees'), icon: UserCheck },
    { to: '/admin/customers', label: t('admin.customers'), icon: Users },
    { to: '/admin/analytics', label: t('admin.analytics'), icon: BarChart3 },
    { to: '/admin/coupons', label: t('admin.coupons'), icon: Tag },
    { to: '/admin/leads', label: t('admin.leads'), icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transition-transform md:sticky md:top-0 md:inset-y-auto md:h-screen`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Hello Mobiles" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            <div>
              <h1 className="text-lg font-bold">HELLO MOBILES</h1>
              <p className="text-gray-400 text-xs">{t('admin.adminPanel')}</p>
            </div>
          </div>
        </div>
        <nav className="px-4 py-4 space-y-1">
          {links.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === link.to ? 'bg-gold-600' : 'hover:bg-white/10'}`}>
              <link.icon size={18} /> {link.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400">{t('admin.administrator')}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white mt-3 text-sm w-full">
            <LogOut size={16} /> {t('admin.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="font-bold">{t('admin.adminPanel')}</h1>
          <div></div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
