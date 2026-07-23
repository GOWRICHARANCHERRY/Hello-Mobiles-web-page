import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, Users, UserCheck, BarChart3, LogOut, Menu, X, Image } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/banners', label: 'Banners', icon: Image },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/employees', label: 'Employees', icon: UserCheck },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transition-transform`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Hello Mobiles" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            <div>
              <h1 className="text-lg font-bold">HELLO MOBILES</h1>
              <p className="text-gray-400 text-xs">Admin Panel</p>
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
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white mt-3 text-sm w-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between md:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="font-bold">Admin Panel</h1>
          <div></div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
