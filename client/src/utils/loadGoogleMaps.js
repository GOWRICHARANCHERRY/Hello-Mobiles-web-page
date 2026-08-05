const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
let cachedPromise = null;

export default function loadGoogleMaps() {
  if (!KEY) return Promise.reject(new Error('Google Maps key missing'));
  if (typeof window !== 'undefined' && window.google?.maps) return Promise.resolve(window.google.maps);
  if (cachedPromise) return cachedPromise;
  cachedPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places,geocoding&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      cachedPromise = null;
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return cachedPromise;
}
