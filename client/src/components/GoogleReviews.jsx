import { useState, useEffect } from 'react';
import loadGoogleMaps from '../utils/loadGoogleMaps';
import { useLanguage } from '../context/LanguageContext';
import { Star, ExternalLink, MapPin } from 'lucide-react';

const PLACE_QUERIES = [
  'Hello Mobiles Allur',
  'Hello Mobiles Buchireddypalem',
  'Hello Mobiles Electronics Allur',
];

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={14} className={`${s <= Math.round(rating) ? 'fill-gold-500 text-gold-500' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function GoogleReviews() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const maps = await loadGoogleMaps();
        if (!maps?.places) { setError(true); return; }
        const service = new maps.places.PlacesService(document.createElement('div'));

        const findPlace = (query) => new Promise((resolve) => {
          service.findPlaceFromQuery(
            { query, fields: ['place_id', 'name', 'rating', 'user_ratings_total', 'formatted_address'] },
            (results, status) => {
              if (status === 'OK' && results && results.length > 0) resolve(results[0]);
              else resolve(null);
            }
          );
        });

        for (const query of PLACE_QUERIES) {
          const place = await findPlace(query);
          if (!place?.place_id) continue;
          const details = await new Promise((resolve) => {
            service.getDetails(
              { placeId: place.place_id, fields: ['name', 'rating', 'user_ratings_total', 'reviews'] },
              (result, status) => {
                if (status === 'OK' && result) resolve(result);
                else resolve(null);
              }
            );
          });
          if (details?.reviews?.length) {
            if (!cancelled) setData({ name: details.name || place.name, rating: details.rating || 0, total: details.user_ratings_total || 0, reviews: details.reviews.slice(0, 6) });
            return;
          }
        }
        if (!cancelled) setError(true);
      } catch (e) {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!data && !error) return null;
  if (error) return null;
  if (!data) return null;

  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm gold-border">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('comp.googleReviewsTitle')}</h2>
          <p className="text-gray-500 text-sm mt-1">{data.name}</p>
        </div>
        <div className="flex items-center gap-3 bg-gold-50 border border-gold-200 rounded-xl px-5 py-3">
          <span className="text-3xl font-bold text-gray-800">{data.rating}</span>
          <div>
            <Stars rating={data.rating} />
            <p className="text-xs text-gray-500 mt-0.5">{t('comp.googleReviewsCount', { count: data.total })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.reviews.map((review, i) => (
          <div key={i} className="bg-gold-50/50 rounded-xl p-4 border border-gold-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-gold-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {(review.author_name || 'G').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{review.author_name}</p>
                <div className="flex items-center gap-1.5">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-gray-400">{new Date(review.time * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{review.text}</p>
          </div>
        ))}
      </div>

      <a href="https://www.google.com/maps/search/Hello+Mobiles+Nellore+district" target="_blank" rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-gold-700 font-semibold text-sm hover:text-gold-800 transition group">
        <MapPin size={15} /> {t('comp.googleReviewsSeeMore')}
        <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
      </a>
    </section>
  );
}
