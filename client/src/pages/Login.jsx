import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import { Smartphone, Tv, Watch, Headphones, Laptop, Home as HomeIcon } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Login() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(phone, password);
      toast.success(t('comp.welcomeBack', { name: user.name }));
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'employee') navigate('/employee');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || t('comp.loginFailed'));
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/google', { credential: credentialResponse.credential });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/';
      toast.success(t('comp.welcome', { name: data.user.name }));
    } catch (error) {
      toast.error(t('comp.googleLoginFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-100 via-amber-50 to-gold-200 flex items-center justify-center p-4 relative overflow-hidden">
      <SEO title="Login" description="Sign in to your Hello Mobiles account." path="/login" noindex />
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-300/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold-400/15 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up relative z-10 gold-border">
        <div className="gold-gradient p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-3">
              <img src="/logo.png" alt="Hello Mobiles" className="w-14 h-14 rounded-xl shadow-lg object-contain bg-white/20 p-1" />
            </div>
            <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h1>
            <p className="text-gold-100 text-sm mt-1">{t('comp.headerTagline')}</p>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-center mb-6 text-gray-800">{t('comp.welcomeBackHeading')}</h2>

          <div className="mb-4">
            <GoogleLogin
              clientId="851466331590-mg31lbo8k58gp9l7hhu793bu1r2dj0jg.apps.googleusercontent.com"
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error(t('comp.googleLoginFailed'))}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-gold-200"></div>
            <span className="text-sm text-gray-400">{t('comp.orSignInWithPhone')}</span>
            <div className="flex-1 border-t border-gold-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('comp.phoneNumber')}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('comp.enterPhoneNumber')}
                className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition bg-gold-50/50" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('comp.password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('comp.enterPassword')}
                className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none transition bg-gold-50/50" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-gold text-white font-semibold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? t('comp.signingIn') : t('comp.signIn')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">{t('comp.newCustomer')}{' '}
              <Link to="/signup" className="text-gold-700 font-semibold hover:underline">{t('comp.signUp')}</Link>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gold-200">
            <p className="text-sm font-semibold text-gray-700 mb-2 text-center">{t('comp.employeeAdminLogin')}</p>
            <p className="text-xs text-gray-500 text-center">{t('comp.employeeAdminLoginSub')}</p>
            <div className="mt-3 bg-gold-50 rounded-lg p-3 text-xs text-gray-600">
              <p><strong>{t('comp.adminLabel')}</strong> 9999999999 / admin123</p>
              <p><strong>{t('comp.employeeLabel')}</strong> 8888888888 / emp123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
