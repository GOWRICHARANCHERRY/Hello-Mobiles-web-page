import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

export default function PhoneCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [error, setError] = useState('');

  useEffect(() => {
    // When opened as the phone.email popup, the opener window completes the
    // login itself — stay quiet to avoid double verification (double quota).
    if (window.opener) return;
    const accessToken = searchParams.get('access_token');
    if (!accessToken) {
      setError(t('comp.verificationFailed'));
      return;
    }
    api.post('/auth/phone-email-token', { access_token: accessToken })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/', { replace: true });
        window.location.reload();
      })
      .catch((err) => {
        setError(err.response?.data?.message || t('comp.verificationFailed'));
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gold-50/50 p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">{t('comp.verifying')}</p>
          </>
        ) : (
          <>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button onClick={() => navigate('/login')}
              className="bg-gold-600 hover:bg-gold-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
              {t('comp.signIn')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
