import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Smartphone, Tv, Watch, Headphones, Laptop, Home as HomeIcon } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPopup({ onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password);
      toast.success('Logged in!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { loginWithGoogle } = await import('../../context/AuthContext');
    } catch {}
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.reload();
        onClose();
      } else {
        toast.error(data.message || 'Google login failed');
      }
    } catch {
      toast.error('Google login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in">
        {/* Close Button */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-gray-800 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="gold-gradient p-5 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-2">
              <img src="/logo.png" alt="Hello Mobiles" className="w-12 h-12 rounded-xl shadow-lg object-contain bg-white/20 p-1" />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h2>
            <p className="text-gold-100 text-xs mt-1">Sign in to continue shopping</p>
          </div>
        </div>

        <div className="p-5">
          {/* Google Login */}
          <div className="mb-4">
            <GoogleLogin
              clientId="851466331590-mg31lbo8k58gp9l7hhu793bu1r2dj0jg.apps.googleusercontent.com"
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 border-t border-gold-200"></div>
            <span className="text-xs text-gray-400">or sign in with phone</span>
            <div className="flex-1 border-t border-gold-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number"
              className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
            <button type="submit" disabled={loading}
              className="w-full btn-gold text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <p className="text-gray-500 text-xs">New here?{' '}
              <Link to="/signup" onClick={onClose} className="text-gold-600 font-semibold hover:underline">Create Account</Link>
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-gold-100 text-center">
            <button onClick={onClose} className="text-gray-400 text-xs hover:text-gray-600">
              Continue without login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
