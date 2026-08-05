import DeliveryZone from '../models/DeliveryZone.js';

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function getDeliveryConfig() {
  let cfg = await DeliveryZone.findOne();
  if (!cfg) cfg = await DeliveryZone.create({ enabled: false, zones: [] });
  return cfg;
}

export function findDeliverableZone(lat, lng, zones) {
  let best = null;
  for (const z of zones || []) {
    if (z.isActive === false) continue;
    const distanceKm = haversineKm(lat, lng, z.centerLat, z.centerLng);
    if (!best || distanceKm < best.distanceKm) {
      best = { name: z.name, distanceKm, radiusKm: z.radiusKm };
    }
  }
  if (!best) return null;
  return { ...best, deliverable: best.distanceKm <= best.radiusKm };
}
