import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const fallbackSlides = [
  {
    _id: '1',
    title: 'iPhone 15 Pro Max',
    subtitle: 'Titanium. So strong. So light. So Pro.',
    offer: 'Exchange Offer Upto ₹65,000',
    bg: 'from-gray-900 via-gray-800 to-black',
    accent: 'from-gold-400 to-gold-600',
    cta: 'Shop Now',
    link: '/products',
  },
  {
    _id: '2',
    title: 'Samsung Galaxy S24 Ultra',
    subtitle: 'Galaxy AI is here',
    offer: 'Flat ₹20,000 Off + Free Galaxy Buds',
    bg: 'from-blue-900 via-blue-800 to-indigo-900',
    accent: 'from-blue-400 to-cyan-400',
    cta: 'Buy Now',
    link: '/products?brand=Samsung',
  },
  {
    _id: '3',
    title: 'Festival Sale Bonanza',
    subtitle: 'Up to 40% OFF on All Electronics',
    offer: 'No Cost EMI + 0% Down Payment',
    bg: 'from-red-900 via-rose-800 to-pink-900',
    accent: 'from-red-400 to-orange-400',
    cta: 'Explore Deals',
    link: '/products?onOffer=true',
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [banners, setBanners] = useState([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/banners')
      .then(r => {
        const hero = r.data.filter(b => (b.type || 'hero') === 'hero');
        if (hero.length > 0) setBanners(hero);
      })
      .catch(() => {});
  }, []);

  const translatedFallbackSlides = [
    {
      _id: '1',
      title: 'iPhone 15 Pro Max',
      subtitle: t('comp.slide1Subtitle'),
      offer: t('comp.slide1Offer'),
      bg: 'from-gray-900 via-gray-800 to-black',
      accent: 'from-gold-400 to-gold-600',
      cta: t('comp.shopNow'),
      link: '/products',
    },
    {
      _id: '2',
      title: 'Samsung Galaxy S24 Ultra',
      subtitle: t('comp.slide2Subtitle'),
      offer: t('comp.slide2Offer'),
      bg: 'from-blue-900 via-blue-800 to-indigo-900',
      accent: 'from-blue-400 to-cyan-400',
      cta: t('comp.buyNow'),
      link: '/products?brand=Samsung',
    },
    {
      _id: '3',
      title: t('comp.slide3Title'),
      subtitle: t('comp.slide3Subtitle'),
      offer: t('comp.slide3Offer'),
      bg: 'from-red-900 via-rose-800 to-pink-900',
      accent: 'from-red-400 to-orange-400',
      cta: t('comp.exploreDeals'),
      link: '/products?onOffer=true',
    },
  ];

  const slides = banners.length > 0
    ? banners.map(b => ({
        ...b,
        title: b.bigText,
        subtitle: b.smallText,
        offer: b.highlightedText,
        link: b.link || (b.product ? `/products/${b.product._id}` : '#'),
      }))
    : translatedFallbackSlides;

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

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

  const isDynamic = banners.length > 0;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}>

      {/* Dynamic Banners */}
      {isDynamic ? (
        <div key={slide._id || slide.bigText || slide.title}
          className="relative min-h-[260px] sm:min-h-[300px] md:min-h-[420px] flex items-center hero-slide overflow-hidden"
          style={{ backgroundColor: slide.bgColor || '#1a1a2e' }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine"></div>
          </div>
          {!slide.image && (
            <>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>
            </>
          )}

          <div className="relative z-10 flex-1 p-5 sm:p-8 md:p-12 md:pl-20 lg:pl-28 min-w-0" style={{ color: slide.textColor || '#ffffff' }}>
            {slide.highlightedText && (
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 opacity-80 animate-slide-up">{slide.highlightedText}</p>
            )}
            {slide.bigText && (
              <h2 className="text-xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 animate-slide-up hero-text-glow max-w-2xl leading-tight">{slide.bigText}</h2>
            )}
            {slide.smallText && (
              <p className="text-xs sm:text-lg md:text-xl opacity-75 mb-3 sm:mb-6 animate-slide-up max-w-2xl" style={{ animationDelay: '0.15s' }}>{slide.smallText}</p>
            )}
            {(slide.product || slide.link) && (
              <button onClick={() => navigate(slide.link || `/products/${slide.product._id}`)}
                className="inline-block animate-slide-up bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-xl text-sm sm:text-lg shadow-lg hover:shadow-[0_0_30px_rgba(212,160,23,0.5)] hover:scale-105 transition-all duration-300"
                style={{ animationDelay: '0.3s' }}>
                {slide.buttonText || (slide.product ? t('comp.viewProduct') : t('comp.shopNow'))} →
              </button>
            )}
          </div>

          {slide.image && (
            <div className="w-1/4 sm:w-1/3 md:w-2/5 self-center flex-shrink-0 flex items-center justify-center p-2 sm:p-4 md:p-8 animate-float">
              <img src={slide.image} alt="" className="animate-zoom-in max-h-24 sm:max-h-36 md:max-h-72 w-auto max-w-full object-contain rounded-xl shadow-2xl"
                style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.45), 0 0 40px rgba(212,160,23,0.25)' }} />
            </div>
          )}
        </div>
      ) : (
        /* Fallback Slides */
        <div className={`bg-gradient-to-br ${slide.bg || 'from-gray-900 to-black'} relative min-h-[260px] sm:min-h-[300px] md:min-h-[420px] flex items-center hero-slide`}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>

          <div className="relative z-10 p-5 sm:p-8 md:p-12 max-w-2xl">
            {slide.offer && (
              <div className={`inline-block bg-gradient-to-r ${slide.accent || 'from-gold-400 to-gold-600'} text-white text-xs font-bold px-4 py-1.5 rounded-full mb-3 sm:mb-4`}>
                {slide.offer}
              </div>
            )}
            <h2 className="text-xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3 animate-slide-up leading-tight">{slide.title}</h2>
            <p className="text-sm sm:text-lg md:text-xl text-gray-300 mb-3 sm:mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>{slide.subtitle}</p>
            <Link to={slide.link || '/products'}
              className={`inline-block bg-gradient-to-r ${slide.accent || 'from-gold-400 to-gold-600'} text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-xl text-sm sm:text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
              {t('comp.shopNow')} →
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous slide"
            className="absolute z-20 left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-all duration-300 hover:scale-110">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} aria-label="Next slide"
            className="absolute z-20 right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-all duration-300 hover:scale-110">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute z-20 bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full p-1 ${i === current ? 'w-10 h-5 bg-gold-400' : 'w-4 h-4 bg-white/40 hover:bg-white/60'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
