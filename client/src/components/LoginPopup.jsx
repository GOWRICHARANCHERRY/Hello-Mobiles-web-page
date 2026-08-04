import { useState, useRef, useLayoutEffect } from 'react';
import { X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { sendFirebaseOTP } from '../utils/firebase';

export default function LoginPopup({ onClose }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const googleWrapRef = useRef(null);
  const [googleWidth, setGoogleWidth] = useState(0);

  useLayoutEffect(() => {
    if (googleWrapRef.current) {
      setGoogleWidth(googleWrapRef.current.clientWidth);
    }
  }, [mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(phone, password);
      toast.success(t('comp.loggedIn'));
      if (user?.role === 'admin') { onClose(); navigate('/admin'); }
      else if (user?.role === 'employee') { onClose(); navigate('/employee'); }
      else onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || t('comp.loginFailed'));
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { name, phone, password, role: 'customer' });
      await login(phone, password);
      toast.success(t('comp.accountCreatedLoggedIn'));
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || t('comp.signupFailed'));
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.reload();
      } else {
        toast.error(res.data.message || t('comp.googleLoginFailed'));
      }
    } catch {
      toast.error(t('comp.googleLoginFailed'));
    }
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) return toast.error(t('comp.invalidPhone'));
    setOtpLoading(true);
    try {
      const result = await sendFirebaseOTP(phone);
      setConfirmation(result);
      setOtpSent(true);
      toast.success(t('comp.otpSent'));
    } catch (error) {
      console.error('Firebase OTP error:', error);
      if (error.code === 'auth/quota-exceeded') toast.error(t('comp.smsQuotaExceeded'));
      else toast.error(t('comp.sendOtpFailed', { error: error.message || t('comp.tryAgain') }));
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return toast.error(t('comp.invalidOtp'));
    setOtpLoading(true);
    try {
      const userCred = await confirmation.confirm(otp);
      const idToken = await userCred.user.getIdToken();
      const res = await api.post('/auth/firebase-auth', { idToken, phone });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(t('comp.loggedIn'));
      if (res.data.user?.role === 'admin') { onClose(); navigate('/admin'); }
      else if (res.data.user?.role === 'employee') { onClose(); navigate('/employee'); }
      else onClose();
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || t('comp.invalidOtpTryAgain'));
    }
    setOtpLoading(false);
  };

  const switchMode = (m) => { setMode(m); setOtpSent(false); setOtp(''); };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close login popup"
          className="absolute top-3 right-3 z-50 bg-white/90 backdrop-blur-sm text-gray-500 hover:text-gray-800 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer">
          <X size={18} />
        </button>

        <div className="gold-gradient p-5 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-center mb-2">
              <img src="/logo.png" alt="Hello Mobiles" width="48" height="48" className="w-12 h-12 rounded-xl shadow-lg object-contain bg-white/20 p-1" />
            </div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h2>
            <p className="text-gold-100 text-xs mt-1">{mode === 'login' ? t('comp.signInToContinue') : t('comp.createAccount')}</p>
          </div>
        </div>

        <div className="p-5">
          {mode === 'login' && (
            <>
              <div className="mb-4" ref={googleWrapRef}>
                <GoogleLogin
                  clientId="851466331590-mg31lbo8k58gp9l7hhu793bu1r2dj0jg.apps.googleusercontent.com"
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error(t('comp.googleLoginFailed'))}
                  theme="outline"
                  size="large"
                  width={googleWidth || 340}
                  text="continue_with"
                  shape="rectangular"
                  ux_mode="popup"
                />
              </div>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t border-gold-200"></div>
                <span className="text-xs text-gray-400">{t('comp.orSignInWithPhone')}</span>
                <div className="flex-1 border-t border-gold-200"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('comp.phoneNumber')}
                  className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('comp.password')}
                  className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
                <button type="submit" disabled={loading}
                  className="w-full btn-gold text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                  {loading ? t('comp.signingIn') : t('comp.signIn')}
                </button>
              </form>

              <button type="button" onClick={() => switchMode('otp')}
                className="w-full mt-2 border-2 border-gold-300 text-gold-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-gold-50">
                {t('comp.loginWithOtp')}
              </button>

              <div className="mt-3 text-center">
                <p className="text-gray-500 text-xs">{t('comp.newHere')}{' '}
                  <button onClick={() => setMode('signup')} className="text-gold-700 font-semibold hover:underline">{t('comp.createAccount')}</button>
                </p>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('comp.fullName')}
                className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('comp.phoneNumber')}
                className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('comp.password')}
                className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
              <button type="submit" disabled={loading}
                className="w-full btn-gold text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                {loading ? t('comp.creatingAccount') : t('comp.createAccount')}
              </button>

              <p className="text-center text-gray-500 text-xs">{t('comp.alreadyHaveAccount')}{' '}
                <button type="button" onClick={() => setMode('login')} className="text-gold-700 font-semibold hover:underline">{t('comp.signIn')}</button>
              </p>
            </form>
          )}

          {mode === 'otp' && (
            <div className="space-y-3">
              {!otpSent ? (
                <>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('comp.phoneNumber')}
                    className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                  <button type="button" onClick={handleSendOtp} disabled={otpLoading}
                    className="w-full btn-gold text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                    {otpLoading ? t('comp.sendingOtp') : t('comp.sendOtp')}
                  </button>
                  <p className="text-center text-xs text-gray-400">{t('comp.otpWillBeSent', { phone: phone || t('comp.yourNumber') })}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-center text-gray-600">{t('comp.enterOtpSentTo')} <b>+91 {phone}</b></p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} placeholder={t('comp.otpPlaceholder')}
                    className="w-full px-3 py-2.5 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50 text-center tracking-widest text-lg" />
                  <button type="button" onClick={handleVerifyOtp} disabled={otpLoading}
                    className="w-full btn-gold text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50">
                    {otpLoading ? t('comp.verifying') : t('comp.verifyLogin')}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="w-full text-xs text-gray-500 hover:text-gold-700">{t('comp.changeNumberResend')}</button>
                </>
              )}
              <p className="text-center text-gray-500 text-xs">
                {t('comp.backTo')}{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-gold-700 font-semibold hover:underline">{t('comp.signIn')}</button>
              </p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gold-100 text-center">
            <button onClick={onClose} className="text-gray-400 text-xs hover:text-gray-600">
              {t('comp.continueWithoutLogin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
