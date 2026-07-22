import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Smartphone, Tv, Watch, Headphones, Laptop, Home } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
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
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'employee') navigate('/employee');
      else navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-primary-700 p-6 text-center text-white">
          <div className="flex justify-center gap-3 mb-3">
            <Smartphone size={20} /><Tv size={20} /><Watch size={20} /><Headphones size={20} /><Laptop size={20} /><Home size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">HELLO MOBILES</h1>
          <p className="text-blue-200 text-sm mt-1">Mobiles | TVs | Electronics</p>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-center mb-6 text-gray-800">Welcome Back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">New Customer?{' '}
              <Link to="/signup" className="text-primary-600 font-semibold hover:underline">Sign Up</Link>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-2">Are you an employee?</p>
            <p className="text-xs text-gray-400">Use your employee credentials to login above</p>
          </div>
        </div>
      </div>
    </div>
  );
}
