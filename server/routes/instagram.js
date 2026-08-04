import { Router } from 'express';

const router = Router();

const TTL = 15 * 60 * 1000;
let cache = { data: null, ts: 0 };

router.get('/reels', async (req, res) => {
  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.json({ success: true, reels: cache.data, cached: true, configured: true });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return res.json({ success: true, reels: [], configured: false });
  }

  try {
    const url = `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=50&access_token=${token}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !Array.isArray(data.data)) {
      throw new Error(data?.error?.message || 'Instagram API returned no data');
    }

    const reels = data.data
      .filter((m) => m.media_type === 'REELS' || (m.media_type === 'VIDEO' && m.permalink?.includes('/reel/')))
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        caption: (m.caption || '').slice(0, 120),
        thumbnail: m.thumbnail_url || m.media_url,
        permalink: m.permalink,
        username: m.username,
        timestamp: m.timestamp,
      }));

    cache = { data: reels, ts: Date.now() };
    res.json({ success: true, reels, configured: true, cached: false });
  } catch (err) {
    console.error('[Instagram] fetch error:', err.message);
    res.json({ success: false, reels: cache.data || [], configured: true, error: err.message });
  }
});

export default router;
