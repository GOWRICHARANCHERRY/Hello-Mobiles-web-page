import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const fallbackBanners = [
  {
    _id: 'fallback-festive',
    type: 'text',
    highlightedText: 'Festive Season Sale',
    bigText: 'Independence Day Special — Up to 40% OFF',
    smallText: 'Extra savings with coupons + No Cost EMI on mobiles, electronics & appliances',
    buttonText: 'Shop Offers',
    link: '/products?onOffer=true',
    bgColor: '#dc2626',
    textColor: '#ffffff',
  },
];

export default function TextBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [banners, setBanners] = useState([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/banners')
      .then(r => {
        const text = r.data.filter(b => b.type === 'text');
        if (text.length > 0) setBanners(text);
      })
      .catch(() => {});
  }, []);

  const translatedFallbackBanners = [
    {
      _id: 'fallback-festive',
      type: 'text',
      highlightedText: t('comp.bannerHighlightedText'),
      bigText: t('comp.bannerBigText'),
      smallText: t('comp.bannerSmallText'),
      buttonText: t('comp.shopOffers'),
      link: '/products?onOffer=true',
      bgColor: '#dc2626',
      textColor: '#ffffff',
    },
  ];

  const slides = banners.length > 0 ? banners : translatedFallbackBanners;

  const next = useCallback(() => setCurrent(prev => (prev + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(prev => (prev - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next, slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  const slide = slides[current];
  if (!slide) return null;

  const bgGradient = slide.bgGradient || '';
  const backgroundColor = slide.bgColor || '#dc2626';

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg animate-fade-in"
      style={{ backgroundColor }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}>
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
      <div className="pointer-events-none absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>

      <div key={slide._id} className="relative flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-10 py-6 md:py-8"
        style={{ background: bgGradient || undefined }}>
        <div className="flex items-center gap-4 flex-1" style={{ color: slide.textColor || '#ffffff' }}>
          <div className="text-4xl hidden sm:block">🎉</div>
          <div>
            {slide.highlightedText && (
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 animate-slide-up">{slide.highlightedText}</p>
            )}
            <h2 className="text-xl md:text-3xl font-bold leading-tight animate-slide-up hero-text-glow">{slide.bigText}</h2>
            {slide.smallText && (
              <p className="text-sm mt-1 opacity-85 animate-slide-up" style={{ animationDelay: '0.15s' }}>{slide.smallText}</p>
            )}
          </div>
        </div>
        <button onClick={() => navigate(slide.link || '/products?onOffer=true')}
          className="flex-shrink-0 animate-slide-up bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-sm px-6 py-3 rounded-xl hover:shadow-[0_0_24px_rgba(212,160,23,0.5)] hover:scale-105 transition-all duration-300 shadow-md md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
          style={{ animationDelay: '0.3s' }}>
          {slide.buttonText || t('comp.shopOffers')} <ChevronRight size={16} className="inline" />
        </button>
      </div>

      {slides.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute z-20 left-2 top-1/2 -translate-y-1/2 bg-black/30 border border-white/20 backdrop-blur-md text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/50 transition-all duration-300 hover:scale-110 md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next}
            className="absolute z-20 right-2 top-1/2 -translate-y-1/2 bg-black/30 border border-white/20 backdrop-blur-md text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/50 transition-all duration-300 hover:scale-110 md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto">
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute z-20 bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto transition-opacity duration-300">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${i === current ? 'w-6 h-2 bg-gold-400' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
