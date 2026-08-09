import { useEffect, useRef, useState } from 'react';
import loadGoogleMaps from '../utils/loadGoogleMaps';

export default function LiveTrackingMap({ lat, lng, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
        });
        const marker = new maps.Marker({ position: { lat, lng }, map, title: label || 'Delivery boy' });
        mapRef.current = { map, marker };
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    const pos = { lat, lng };
    mapRef.current.marker.setPosition(pos);
    mapRef.current.map.panTo(pos);
  }, [lat, lng]);

  if (status === 'loading') {
    return (
      <div className="h-48 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
        {label || 'Loading map...'}
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="h-48 rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-sm text-gray-500">
        <p>{label || 'Live location'}</p>
        {lat && lng && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank" rel="noreferrer"
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Open in Google Maps
          </a>
        )}
      </div>
    );
  }
  return <div ref={containerRef} className="h-48 rounded-xl overflow-hidden" />;
}
