import { Router } from 'express';
import Setting from '../models/Setting.js';

const router = Router();

const APP_ID = '1610077390497812';
const OAUTH_SCOPES = 'instagram_basic,pages_show_list';

const TTL = 15 * 60 * 1000;
let cache = { data: null, ts: 0 };

// Hand-picked latest reels (used when no API token is configured).
// Thumbnails are resolved via Meta oEmbed (needs META_APP_SECRET) and cached.
const CURATED_REELS = [
  // { permalink: 'https://www.instagram.com/reel/<shortcode>/', caption: '...' },
];

async function getStored(key, envFallback = '') {
  try {
    const doc = await Setting.findOne({ key });
    if (doc?.value) return doc.value;
  } catch { /* DB unavailable — fall back to env */ }
  return process.env[key] || envFallback;
}

async function getStoredToken() {
  return getStored('INSTAGRAM_ACCESS_TOKEN');
}

async function refreshTokenIfNeeded() {
  try {
    const doc = await Setting.findOne({ key: 'INSTAGRAM_ACCESS_TOKEN' });
    if (!doc?.value) return;
    const exp = await Setting.findOne({ key: 'INSTAGRAM_TOKEN_EXPIRY' });
    // Refresh when under 7 days of life left (long-lived tokens last ~60 days)
    if (exp?.value && Date.now() < Number(exp.value) - 7 * 24 * 3600 * 1000) return;
    const resp = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${doc.value}`
    );
    const data = await resp.json();
    if (data?.access_token) {
      doc.value = data.access_token;
      await doc.save();
      await Setting.findOneAndUpdate(
        { key: 'INSTAGRAM_TOKEN_EXPIRY' },
        { key: 'INSTAGRAM_TOKEN_EXPIRY', value: String(Date.now() + (data.expires_in || 5184000) * 1000), updatedAt: new Date() },
        { upsert: true }
      );
      cache = { data: null, ts: 0 };
      console.log('[Instagram] access token auto-refreshed');
    }
  } catch (err) {
    console.error('[Instagram] refresh error:', err.message);
  }
}

// Step 1 of Instagram connect: redirect the store owner to Meta to authorize.
router.get('/connect', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const redirect = `${host}/api/instagram/callback`;
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(OAUTH_SCOPES)}&response_type=code`;
  res.redirect(url);
});

// Step 2: Meta redirects back here with ?code= — exchange it (server-side) for a
// long-lived (~60 day) token and store it in the DB. Auto-refreshed thereafter.
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing authorization code. Please try connecting again.');
  const secret = process.env.META_APP_SECRET;
  if (!secret) return res.status(500).send('META_APP_SECRET is not configured on the server.');
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const redirect = `${host}/api/instagram/callback`;
    const shortResp = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirect)}&client_secret=${secret}&code=${code}`
    );
    const shortData = await shortResp.json();
    if (!shortData?.access_token) throw new Error(shortData?.error?.message || 'Code exchange failed');
    const longResp = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${secret}&fb_exchange_token=${shortData.access_token}`
    );
    const longData = await longResp.json();
    if (!longData?.access_token) throw new Error(longData?.error?.message || 'Long-lived token exchange failed');
    await Setting.findOneAndUpdate(
      { key: 'INSTAGRAM_ACCESS_TOKEN' },
      { key: 'INSTAGRAM_ACCESS_TOKEN', value: longData.access_token, updatedAt: new Date() },
      { upsert: true }
    );
    await Setting.findOneAndUpdate(
      { key: 'INSTAGRAM_TOKEN_EXPIRY' },
      { key: 'INSTAGRAM_TOKEN_EXPIRY', value: String(Date.now() + (longData.expires_in || 5184000) * 1000), updatedAt: new Date() },
      { upsert: true }
    );
    cache = { data: null, ts: 0 };
    res.send('<h2 style="font-family:sans-serif">Instagram connected — latest reels will now appear on the homepage automatically.</h2><p style="font-family:sans-serif">You can close this tab.</p>');
  } catch (err) {
    console.error('[Instagram] connect error:', err.message);
    res.status(500).send('Instagram connection failed: ' + err.message);
  }
});

// Fallback thumbnail resolver (see CURATED_REELS above).
async function resolveViaOEmbed(items) {
  const appId = '1610077390497812';
  const secret = process.env.META_APP_SECRET;
  if (!secret) return [];
  const out = [];
  for (const item of items) {
    try {
      const u = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(item.permalink)}&access_token=${appId}|${secret}`;
      const resp = await fetch(u);
      const data = await resp.json();
      if (!data?.thumbnail_url) continue;
      const shortcode = (item.permalink.match(/\/reel\/([^/]+)/) || [])[1] || item.permalink;
      out.push({
        id: shortcode,
        caption: (item.caption || data.title || '').slice(0, 120),
        thumbnail: data.thumbnail_url,
        permalink: item.permalink,
        username: 'hellomobilesandelectronics',
        timestamp: null,
      });
    } catch (err) {
      console.error('[Instagram] oEmbed error:', item.permalink, err.message);
    }
  }
  return out;
}

router.get('/reels', async (req, res) => {
  if (cache.data && Date.now() - cache.ts < TTL) {
    return res.json({ success: true, reels: cache.data, cached: true, configured: true });
  }

  const token = await getStoredToken();
  if (!token) {
    if (CURATED_REELS.length > 0) {
      const reels = await resolveViaOEmbed(CURATED_REELS);
      if (reels.length > 0) {
        cache = { data: reels, ts: Date.now() };
        return res.json({ success: true, reels, configured: true, cached: false, source: 'curated' });
      }
    }
    return res.json({ success: true, reels: [], configured: false });
  }

  try {
    // Resolve the Instagram business/creator account: explicit IG ID first,
    // else via linked Facebook Page, else the token owner's own account.
    let igId = await getStored('INSTAGRAM_USER_ID');
    if (!igId) {
      const pageId = await getStored('INSTAGRAM_PAGE_ID');
      if (pageId) {
        const pageResp = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`
        );
        const pageData = await pageResp.json();
        igId = pageData?.instagram_business_account?.id || '';
        if (igId) {
          await Setting.findOneAndUpdate(
            { key: 'INSTAGRAM_USER_ID' },
            { key: 'INSTAGRAM_USER_ID', value: igId, updatedAt: new Date() },
            { upsert: true }
          ).catch(() => {});
        }
      }
    }
    const mediaUrl = igId
      ? `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=50&access_token=${token}`
      : `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=50&access_token=${token}`;
    const resp = await fetch(mediaUrl);
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
        video: m.media_url || null,
        permalink: m.permalink,
        username: m.username,
        timestamp: m.timestamp,
      }));

    cache = { data: reels, ts: Date.now() };
    res.json({ success: true, reels, configured: true, cached: false });
    refreshTokenIfNeeded().catch(() => {});
  } catch (err) {
    console.error('[Instagram] fetch error:', err.message);
    res.json({ success: false, reels: cache.data || [], configured: true, error: err.message });
  }
});

export default router;
