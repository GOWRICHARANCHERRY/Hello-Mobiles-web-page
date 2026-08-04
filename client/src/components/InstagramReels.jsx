import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { Play, Instagram } from 'lucide-react';

export default function InstagramReels() {
  const { t } = useLanguage();
  const [reels, setReels] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/instagram/reels')
      .then((r) => {
        if (!cancelled) setReels(Array.isArray(r.data?.reels) ? r.data.reels : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  if (loaded && reels.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="section-title">{t('cust.reelsTitle')}</h2>
          <p className="text-gray-600 text-sm mt-1">{t('cust.reelsText')}</p>
        </div>
        <a href="https://www.instagram.com/hellomobilesandelectronics" target="_blank" rel="noopener noreferrer"
          className="text-sm text-gold-700 font-semibold hover:underline inline-flex items-center gap-1.5">
          <Instagram size={16} /> {t('cust.viewAllReels')} →
        </a>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {reels.map((r) => (
          <a key={r.id} href={r.permalink} target="_blank" rel="noopener noreferrer" aria-label={r.caption || 'Instagram Reel'}
            className="group relative rounded-xl overflow-hidden aspect-[9/16] bg-black block card-hover">
            <img src={r.thumbnail} alt={r.caption || 'Instagram Reel'} loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                <Play size={22} className="text-white fill-white" />
              </span>
            </div>
            {r.caption && (
              <p className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] leading-tight line-clamp-2">
                {r.caption}
              </p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
