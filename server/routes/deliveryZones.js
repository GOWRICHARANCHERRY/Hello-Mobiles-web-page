import express from 'express';
import { auth, roleAuth } from '../middleware/auth.js';
import { getDeliveryConfig, findDeliverableZone } from '../utils/delivery.js';

const router = express.Router();

function publicZones(cfg) {
  return (cfg.zones || [])
    .filter((z) => z.isActive)
    .map((z) => ({
      name: z.name,
      centerLat: z.centerLat,
      centerLng: z.centerLng,
      radiusKm: z.radiusKm,
    }));
}

// Public: is delivery restriction on, and which zones exist?
router.get('/', async (req, res) => {
  try {
    const cfg = await getDeliveryConfig();
    res.json({ enabled: cfg.enabled, zones: publicZones(cfg) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public: check a lat/lng against all zones
router.post('/check', async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    const cfg = await getDeliveryConfig();
    const hasActiveZone = (cfg.zones || []).some((z) => z.isActive);
    if (!cfg.enabled || !hasActiveZone) return res.json({ restricted: false, deliverable: true });
    const zone = findDeliverableZone(latitude, longitude, cfg.zones);
    if (!zone) return res.json({ restricted: true, deliverable: false });
    res.json({
      restricted: true,
      deliverable: zone.deliverable,
      zoneName: zone.name,
      distanceKm: Math.round(zone.distanceKm * 10) / 10,
      radiusKm: zone.radiusKm,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Staff: full config (incl. enabled flag + inactive zones)
router.get('/config', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const cfg = await getDeliveryConfig();
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: save full config
router.put('/config', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { enabled, zones } = req.body || {};
    const clean = (Array.isArray(zones) ? zones : [])
      .map((z) => ({
        name: String(z.name || '').trim(),
        centerLat: Number(z.centerLat),
        centerLng: Number(z.centerLng),
        radiusKm: Number(z.radiusKm),
        isActive: z.isActive !== false,
      }))
      .filter(
        (z) =>
          z.name &&
          Number.isFinite(z.centerLat) &&
          Number.isFinite(z.centerLng) &&
          Number.isFinite(z.radiusKm) &&
          z.radiusKm > 0
      );
    const cfg = await getDeliveryConfig();
    cfg.enabled = !!enabled;
    cfg.zones = clean;
    await cfg.save();
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
