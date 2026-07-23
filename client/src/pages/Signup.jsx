import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { auth, sendFirebaseOTP } from '../utils/firebase';
import { ArrowLeft, Check, Smartphone, Shield, RefreshCw } from 'lucide-react';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [otpTimer, setOtpTimer] = useState(0);

  const startTimer = () => {
    setOtpTimer(60);
    const interval = setInterval(() => {
      setOtpTimer(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) return toast.error('Enter valid 10-digit phone number');
    setLoading(true);
    try {
      const result = await sendFirebaseOTP(phone);
      setConfirmation(result);
      toast.success('OTP sent to your phone!');
      setStep(2);
      startTimer();
    } catch (error) {
      console.error('Firebase OTP error:', error);
      if (error.code === 'auth/quota-exceeded') toast.error('SMS quota exceeded. Add billing to Firebase.');
      else toast.error(`Failed: ${error.message || 'Try again'}`);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return toast.error('Enter valid 6-digit OTP');
    setLoading(true);
    try {
      await confirmation.confirm(otp);
      toast.success('Phone verified!');
      setStep(3);
    } catch (error) {
      toast.error('Invalid OTP. Try again.');
    }
    setLoading(false);
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const { data } = await api.post('/auth/firebase-auth', { idToken, phone, name: form.name, email: form.email, password: form.password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Account created successfully!');
      window.location.href = '/';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-100 via-amber-50 to-gold-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-300/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold-400/15 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up relative z-10 gold-border">
        <div className="gold-gradient p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILES</h1>
            <p className="text-gold-100 text-sm mt-1">Create Your Account</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4 bg-gold-50">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'gold-gradient text-white shadow-md' : 'bg-gold-100 text-gold-400'}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              <span className={`ml-1 text-xs ${step >= s ? 'text-gold-600 font-semibold' : 'text-gray-400'}`}>
                {s === 1 ? 'Phone' : s === 2 ? 'OTP' : 'Details'}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${step > s ? 'bg-gold-500' : 'bg-gold-200'}`}></div>}
            </div>
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="bg-gold-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 animate-float">
                  <Smartphone size={28} className="text-gold-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Enter Your Phone Number</h2>
                <p className="text-sm text-gray-500 mt-1">We'll send a verification code via SMS</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex">
                  <span className="bg-gold-100 border-2 border-r-0 border-gold-200 rounded-l-lg px-3 py-3 text-sm text-gold-700 font-semibold">+91</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit number"
                    className="w-full border-2 border-gold-200 rounded-r-lg px-4 py-3 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>
              <div id="recaptcha-container" className="flex justify-center"></div>
              <button onClick={handleSendOTP} disabled={loading || phone.length !== 10}
                className="w-full btn-gold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Sending OTP...</> : 'Send OTP'}
              </button>
              <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                <Shield size={14} /> Secured by Firebase
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <button onClick={() => setStep(1)} className="text-gold-500 hover:text-gold-700 mb-2 inline-flex items-center gap-1 text-sm font-medium">
                  <ArrowLeft size={16} /> Change Number
                </button>
                <h2 className="text-lg font-semibold text-gray-800">Enter Verification Code</h2>
                <p className="text-sm text-gray-500 mt-1">OTP sent to +91 {phone}</p>
                <p className="text-xs text-gold-600 mt-1 font-medium">Test mode: Use code 897852</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter OTP" maxLength={6}
                  className="w-full border-2 border-gold-200 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
              </div>
              {otpTimer > 0 ? (
                <p className="text-sm text-gray-500 text-center">Resend OTP in {otpTimer}s</p>
              ) : (
                <button onClick={handleSendOTP} disabled={loading} className="text-gold-600 text-sm font-medium hover:underline w-full text-center">
                  Resend OTP
                </button>
              )}
              <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                className="w-full btn-gold rounded-lg disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-in">
                  <Check size={28} className="text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Phone Verified!</h2>
                <p className="text-sm text-gray-500 mt-1">Complete your profile</p>
              </div>
              <form onSubmit={handleCompleteSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name"
                    className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters"
                    className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="Re-enter password"
                    className="w-full px-4 py-3 border-2 border-gold-200 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full btn-gold rounded-lg disabled:opacity-50">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">Already have an account?{' '}
              <Link to="/login" className="text-gold-600 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
