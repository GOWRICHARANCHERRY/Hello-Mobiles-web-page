import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { Play, Instagram, X, ExternalLink } from 'lucide-react';

export default function InstagramReels() {
  const { t } = useLanguage();
  const [reels, setReels] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/instagram/reels')
      .then((r) => {
        if (!cancelled) setReels(Array.isArray(r.data?.reels) ? r.data.reels.slice(0, 3) : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  useEffect(() => {
    if (!active || active.video) return;
    const loadEmbed = () => {
      if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
      else {
        const s = document.createElement('script');
        s.src = 'https://www.instagram.com/embed.js';
        s.async = true;
        s.onload = () => window.instgrm?.Embeds?.process();
        document.body.appendChild(s);
      }
    };
    const t = setTimeout(loadEmbed, 50);
    return () => clearTimeout(t);
  }, [active]);

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
      <div className="grid grid-cols-3 gap-3">
        {reels.map((r) => (
          <button key={r.id} onClick={() => setActive(r)} aria-label={r.caption || 'Play Instagram Reel'}
            className="group relative rounded-xl overflow-hidden aspect-[9/16] bg-black block card-hover text-left">
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
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80" onClick={() => setActive(null)}>
          <div className="relative bg-black rounded-2xl overflow-hidden w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActive(null)} aria-label="Close video"
              className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition">
              <X size={18} />
            </button>
            {active.video ? (
              <video key={active.id} src={active.video} poster={active.thumbnail} controls autoPlay playsInline
                className="w-full aspect-[9/16] max-h-[75vh] bg-black" />
            ) : (
              <div className="w-full max-h-[75vh] overflow-y-auto bg-white p-2">
                <blockquote key={active.id} className="instagram-media" data-instgrm-permalink={active.permalink}
                  data-instgrm-version="14" style={{ margin: 0 }}>
                  <a href={active.permalink} target="_blank" rel="noopener noreferrer">View this reel on Instagram</a>
                </blockquote>
              </div>
            )}
            <div className="p-3 bg-neutral-900 flex items-center justify-between gap-2">
              <p className="text-white text-xs leading-snug line-clamp-2 flex-1">{active.caption || 'Instagram Reel'}</p>
              <a href={active.permalink} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gold-400 hover:text-gold-300">
                <Instagram size={14} /> Instagram <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
