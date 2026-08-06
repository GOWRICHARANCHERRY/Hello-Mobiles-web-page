import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const CustomerLayout = lazy(() => import('./pages/customer/CustomerLayout'));
const Home = lazy(() => import('./pages/customer/Home'));
const ProductList = lazy(() => import('./pages/customer/ProductList'));
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const Orders = lazy(() => import('./pages/customer/Orders'));
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const Wishlist = lazy(() => import('./pages/customer/Wishlist'));
const EMICalculator = lazy(() => import('./pages/customer/EMICalculator'));
const ExchangeCalculator = lazy(() => import('./pages/customer/ExchangeCalculator'));
const TermsAndConditions = lazy(() => import('./pages/customer/TermsAndConditions'));
const AboutUs = lazy(() => import('./pages/customer/AboutUs'));

const EmployeeLayout = lazy(() => import('./pages/employee/EmployeeLayout'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const EmployeeInventory = lazy(() => import('./pages/employee/EmployeeInventory'));
const EmployeeOrders = lazy(() => import('./pages/employee/EmployeeOrders'));

const DeliveryLayout = lazy(() => import('./pages/delivery/DeliveryLayout'));
const DeliveryOrders = lazy(() => import('./pages/delivery/DeliveryOrders'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminEmployees = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminDeliveryZones = lazy(() => import('./pages/admin/AdminDeliveryZones'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));

function PageLoader() {
  return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div></div>;
}

function SuspenseRoute({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function OptionalAuthRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'employee') return '/employee';
    if (user.role === 'delivery') return '/delivery';
    return '/';
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getHomeRoute()} /> : <SuspenseRoute><Login /></SuspenseRoute>} />
      <Route path="/signup" element={user ? <Navigate to={getHomeRoute()} /> : <SuspenseRoute><Signup /></SuspenseRoute>} />

      <Route path="/" element={<OptionalAuthRoute><SuspenseRoute><CustomerLayout /></SuspenseRoute></OptionalAuthRoute>}>
        <Route index element={<SuspenseRoute><Home /></SuspenseRoute>} />
        <Route path="products" element={<SuspenseRoute><ProductList /></SuspenseRoute>} />
        <Route path="products/:id" element={<SuspenseRoute><ProductDetail /></SuspenseRoute>} />
        <Route path="terms-and-conditions" element={<SuspenseRoute><TermsAndConditions /></SuspenseRoute>} />
        <Route path="privacy-policy" element={<SuspenseRoute><TermsAndConditions /></SuspenseRoute>} />
        <Route path="shipping-policy" element={<SuspenseRoute><TermsAndConditions /></SuspenseRoute>} />
        <Route path="return-policy" element={<SuspenseRoute><TermsAndConditions /></SuspenseRoute>} />
        <Route path="refund-policy" element={<SuspenseRoute><TermsAndConditions /></SuspenseRoute>} />
        <Route path="about" element={<SuspenseRoute><AboutUs /></SuspenseRoute>} />
      </Route>

      <Route path="/" element={<ProtectedRoute roles={['customer']}><SuspenseRoute><CustomerLayout /></SuspenseRoute></ProtectedRoute>}>
        <Route path="cart" element={<SuspenseRoute><Cart /></SuspenseRoute>} />
        <Route path="checkout" element={<SuspenseRoute><Checkout /></SuspenseRoute>} />
        <Route path="orders" element={<SuspenseRoute><Orders /></SuspenseRoute>} />
        <Route path="orders/:id" element={<SuspenseRoute><OrderDetail /></SuspenseRoute>} />
        <Route path="profile" element={<SuspenseRoute><Profile /></SuspenseRoute>} />
        <Route path="wishlist" element={<SuspenseRoute><Wishlist /></SuspenseRoute>} />
        <Route path="emi-calculator" element={<SuspenseRoute><EMICalculator /></SuspenseRoute>} />
        <Route path="exchange-calculator" element={<SuspenseRoute><ExchangeCalculator /></SuspenseRoute>} />
      </Route>

      <Route path="/employee" element={<ProtectedRoute roles={['employee', 'admin']}><SuspenseRoute><EmployeeLayout /></SuspenseRoute></ProtectedRoute>}>
        <Route index element={<SuspenseRoute><EmployeeDashboard /></SuspenseRoute>} />
        <Route path="inventory" element={<SuspenseRoute><EmployeeInventory /></SuspenseRoute>} />
        <Route path="orders" element={<SuspenseRoute><EmployeeOrders /></SuspenseRoute>} />
      </Route>

      <Route path="/delivery" element={<ProtectedRoute roles={['delivery', 'admin']}><SuspenseRoute><DeliveryLayout /></SuspenseRoute></ProtectedRoute>}>
        <Route index element={<SuspenseRoute><DeliveryOrders /></SuspenseRoute>} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><SuspenseRoute><AdminLayout /></SuspenseRoute></ProtectedRoute>}>
        <Route index element={<SuspenseRoute><AdminDashboard /></SuspenseRoute>} />
        <Route path="products" element={<SuspenseRoute><AdminProducts /></SuspenseRoute>} />
        <Route path="banners" element={<SuspenseRoute><AdminBanners /></SuspenseRoute>} />
        <Route path="orders" element={<SuspenseRoute><AdminOrders /></SuspenseRoute>} />
        <Route path="employees" element={<SuspenseRoute><AdminEmployees /></SuspenseRoute>} />
        <Route path="customers" element={<SuspenseRoute><AdminCustomers /></SuspenseRoute>} />
        <Route path="analytics" element={<SuspenseRoute><AdminAnalytics /></SuspenseRoute>} />
        <Route path="coupons" element={<SuspenseRoute><AdminCoupons /></SuspenseRoute>} />
        <Route path="delivery-zones" element={<SuspenseRoute><AdminDeliveryZones /></SuspenseRoute>} />
        <Route path="leads" element={<SuspenseRoute><AdminLeads /></SuspenseRoute>} />
      </Route>

      <Route path="*" element={<Navigate to={getHomeRoute()} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <LanguageProvider>
              <Toaster position="top-right" />
              <AppRoutes />
            </LanguageProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
