import express from 'express';

const router = express.Router();

// Inbound messages land here once the store number lives on Cloud API (the
// phone app is logged out after migration). We send a helpful auto-reply so
// customers are never left on read. Replies are rate-limited per sender.
const lastReplyAt = new Map();
const REPLY_COOLDOWN_MS = 60 * 60 * 1000;

const AUTO_REPLY = `Namaste! Thanks for messaging Hello Mobiles (Allur & Buchireddypalem).

This number now sends automatic order updates. For instant help:
• Call the store: +91 88868 88128
• Visit us in Allur or Buchireddypalem, Nellore district
• Shop online: https://hello-mobiles.com

— Team Hello Mobiles`;

// Meta verifies the webhook with a GET challenge during setup.
// NOTE: query params are read from originalUrl — NOT req.query — because the
// global mongo-sanitize middleware strips keys containing dots, and Meta's
// params are all dotted (hub.mode, hub.verify_token, hub.challenge).
router.get('/webhook', (req, res) => {
  const params = new URL(req.originalUrl, 'http://localhost').searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  const expected = process.env.META_WA_WEBHOOK_TOKEN;
  if (mode === 'subscribe' && expected && token === expected) {
    console.log('[WhatsApp] webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

async function sendText(to, body) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneNumberId || !token) return { sent: false };
  try {
    const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
    const data = await resp.json();
    return resp.ok ? { sent: true, id: data?.messages?.[0]?.id } : { sent: false, reason: data?.error?.message };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

router.post('/webhook', async (req, res) => {
  // Acknowledge immediately — Meta retries if we hang.
  res.sendStatus(200);
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    if (!value?.messages) return; // status updates, not inbound
    for (const msg of value.messages) {
      const from = msg.from;
      if (!from || msg.type === 'reaction') continue;
      // Ignore our own outgoing echoes and non-user traffic.
      if (from === process.env.WHATSAPP_TO) continue;
      const now = Date.now();
      if (now - (lastReplyAt.get(from) || 0) < REPLY_COOLDOWN_MS) continue;
      lastReplyAt.set(from, now);
      const result = await sendText(from, AUTO_REPLY);
      console.log(`[WhatsApp] auto-reply to ${from}:`, result.sent ? 'sent' : result.reason);
    }
  } catch (err) {
    console.error('[WhatsApp] webhook error:', err.message);
  }
});

export default router;
