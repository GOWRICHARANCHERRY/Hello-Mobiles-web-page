import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerLayout from './pages/customer/CustomerLayout';
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import Profile from './pages/customer/Profile';
import Wishlist from './pages/customer/Wishlist';
import EMICalculator from './pages/customer/EMICalculator';
import ExchangeCalculator from './pages/customer/ExchangeCalculator';

import EmployeeLayout from './pages/employee/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeInventory from './pages/employee/EmployeeInventory';
import EmployeeOrders from './pages/employee/EmployeeOrders';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'employee') return '/employee';
    return '/';
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getHomeRoute()} /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={getHomeRoute()} /> : <Signup />} />

      <Route path="/" element={<ProtectedRoute roles={['customer']}><CustomerLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="emi-calculator" element={<EMICalculator />} />
        <Route path="exchange-calculator" element={<ExchangeCalculator />} />
      </Route>

      <Route path="/employee" element={<ProtectedRoute roles={['employee', 'admin']}><EmployeeLayout /></ProtectedRoute>}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="inventory" element={<EmployeeInventory />} />
        <Route path="orders" element={<EmployeeOrders />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to={getHomeRoute()} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
