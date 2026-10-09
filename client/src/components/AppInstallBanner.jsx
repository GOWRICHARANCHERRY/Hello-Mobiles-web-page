import { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AppInstallBanner() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('hm_app_banner_dismissed') === '1'; } catch { return false; }
  });
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('hm_app_banner_dismissed', '1'); } catch { /* ignore */ }
  };

  if (dismissed || installed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div className="gold-gradient rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
      <button onClick={dismiss} aria-label="Dismiss"
        className="absolute top-3 right-3 text-white/70 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition">
        <X size={16} />
      </button>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="bg-white/15 rounded-2xl p-4 flex-shrink-0">
          <Smartphone size={40} className="text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold">{t('cust.installAppTitle')}</h2>
          <p className="text-gold-100 text-sm mt-1">{t('cust.installAppText')}</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 justify-center sm:justify-start">
            {deferredPrompt && (
              <button onClick={handleInstall}
                className="bg-white text-gold-700 px-6 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition inline-flex items-center gap-2">
                <Smartphone size={16} /> {t('cust.installAppBtn')}
              </button>
            )}
            <a href="/app/hello-mobiles-v1.apk" download
              className="border-2 border-white/60 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-white/10 transition inline-flex items-center gap-2">
              <Download size={16} /> {t('cust.downloadApkBtn')}
            </a>
          </div>
          <p className="text-white/70 text-[11px] mt-2">{t('cust.apkNote')}</p>
        </div>
      </div>
    </div>
  );
}
