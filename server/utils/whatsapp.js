const GRAPH_VERSION = 'v19.0';
// Read env LAZILY on every call: ESM imports hoist above dotenv.config() in
// server.js, so module-scope reads would capture empty values locally.
// (Render sets real env vars before the process starts, which is why prod
// worked while local dev silently did not.)
function cfg() {
  return {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    toNumber: process.env.WHATSAPP_TO || '918886888128',
  };
}

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function buildOrderMessage(order, customer) {
  const customerName = order.shippingAddress?.name || customer?.name || 'Customer';
  const customerPhone = order.shippingAddress?.phone || customer?.phone || '';
  const altPhoneLine = order.shippingAddress?.altPhone ? `\nAlt Phone: ${order.shippingAddress.altPhone}` : '';
  const landmarkLine = order.shippingAddress?.landmark ? `\nLandmark: ${order.shippingAddress.landmark}` : '';
  const itemsSummary = order.items
    .slice(0, 3)
    .map(i => `• ${i.name} × ${i.quantity}`)
    .join('\n');
  const more = order.items.length > 3 ? `\n• +${order.items.length - 3} more` : '';
  const mapLine = order.shippingAddress?.latitude && order.shippingAddress?.longitude
    ? `\n📍 Map: https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
    : '';

  return `🔔 NEW ORDER — Hello Mobiles

Order: ${order.orderNumber}
Total: ${formatINR(order.total)}
Payment: ${order.paymentMethod.toUpperCase()}
Status: ${order.orderStatus.toUpperCase()}

Customer: ${customerName}
Phone: ${customerPhone}${altPhoneLine}${landmarkLine}

Items:
${itemsSummary}${more}
${mapLine}
Ordered at: ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}`;
}

function useTemplates() {
  return process.env.WHATSAPP_USE_TEMPLATES === '1';
}

async function postMessage(TOKEN, PHONE_NUMBER_ID, payload) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function sendOrderWhatsApp(order, customer) {
  const { token: TOKEN, phoneNumberId: PHONE_NUMBER_ID, toNumber: TO_NUMBER } = cfg();
  if (!TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing) — skipping');
    return { sent: false, reason: 'not-configured' };
  }
  try {
    if (useTemplates()) {
      const customerName = order.shippingAddress?.name || customer?.name || 'Customer';
      const customerPhone = order.shippingAddress?.phone || customer?.phone || '';
      const itemsSummary = order.items.slice(0, 2).map(i => `${i.name} x ${i.quantity}`).join(', ').slice(0, 120);
      const { ok, data } = await postMessage(TOKEN, PHONE_NUMBER_ID, {
        to: TO_NUMBER,
        type: 'template',
        template: {
          name: 'hello_mobiles_order_alert',
          language: { code: 'en_US' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: String(order.orderNumber || '') },
              { type: 'text', text: `${formatINR(order.total)} via ${(order.paymentMethod || '').toUpperCase()}` },
              { type: 'text', text: `${customerName} on +91${customerPhone}`.slice(0, 60) },
              { type: 'text', text: itemsSummary || 'items' },
            ],
          }],
        },
      });
      if (ok) {
        console.log(`[WhatsApp] order alert (template) sent to ${TO_NUMBER}`);
        return { sent: true };
      }
      console.error('[WhatsApp] template alert error:', data?.error?.message || data);
      return { sent: false, reason: data?.error?.message || 'api-error' };
    }
    const body = buildOrderMessage(order, customer);
    const { ok, data } = await postMessage(TOKEN, PHONE_NUMBER_ID, {
      to: TO_NUMBER,
      type: 'text',
      text: { body },
    });
    if (!ok) {
      console.error('[WhatsApp] API error:', data?.error?.message || data);
      return { sent: false, reason: data?.error?.message || 'api-error' };
    }
    console.log(`[WhatsApp] order alert sent to ${TO_NUMBER}`);
    return { sent: true };
  } catch (error) {
    console.error('[WhatsApp] error:', error.message);
    return { sent: false, reason: error.message };
  }
}

export function buildDeliveryAssignedMessage(order, deliveryPerson, otp) {
  const customerName = order.shippingAddress?.name || 'Customer';
  const boyName = deliveryPerson?.name || 'Delivery boy';
  const boyPhone = deliveryPerson?.phone || '';
  return `🚚 DELIVERY ASSIGNED — Hello Mobiles

Order: ${order.orderNumber}
Total: ${formatINR(order.total)}

Your delivery boy: ${boyName}
Phone: ${boyPhone}

Delivery OTP: ${otp}
Share this OTP with your delivery boy to confirm delivery.

Track order: https://hello-mobiles.com/orders/${order._id}`;
}

export async function sendDeliveryAssignedWhatsApp(customerPhone, order, deliveryPerson, otp) {
  const { token: TOKEN, phoneNumberId: PHONE_NUMBER_ID, toNumber: TO_NUMBER } = cfg();
  if (!TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] not configured — skipping delivery-assignment alert');
    return { sent: false, reason: 'not-configured' };
  }
  const to = customerPhone || TO_NUMBER;
  try {
    if (useTemplates()) {
      // Compliant split: the OTP travels in the approved Authentication
      // template, boy details in the approved Utility template.
      const boyName = deliveryPerson?.name || 'Delivery boy';
      const boyPhone = deliveryPerson?.phone || '';
      const otpRes = await postMessage(TOKEN, PHONE_NUMBER_ID, {
        to,
        type: 'template',
        template: {
          name: 'hello_mobiles_otp',
          language: { code: 'en_US' },
          components: [{
            type: 'button', sub_type: 'url', index: '0',
            parameters: [{ type: 'text', text: String(otp) }],
          }],
        },
      });
      const infoRes = await postMessage(TOKEN, PHONE_NUMBER_ID, {
        to,
        type: 'template',
        template: {
          name: 'hello_mobiles_delivery_update',
          language: { code: 'en_US' },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: String(order.orderNumber || '') },
              { type: 'text', text: boyName.slice(0, 40) },
              { type: 'text', text: boyPhone.slice(0, 20) },
              { type: 'text', text: `https://hello-mobiles.com/orders/${order._id}` },
            ],
          }],
        },
      });
      if (otpRes.ok && infoRes.ok) {
        console.log(`[WhatsApp] delivery-assignment (templates) sent to ${to}`);
        return { sent: true };
      }
      const reason = (!otpRes.ok && otpRes.data?.error?.message) || (!infoRes.ok && infoRes.data?.error?.message) || 'api-error';
      console.error('[WhatsApp] delivery-assignment template error:', reason);
      return { sent: false, reason };
    }
    const body = buildDeliveryAssignedMessage(order, deliveryPerson, otp);
    const { ok, data } = await postMessage(TOKEN, PHONE_NUMBER_ID, {
      to,
      type: 'text',
      text: { body },
    });
    if (!ok) {
      console.error('[WhatsApp] delivery-assignment error:', data?.error?.message || data);
      return { sent: false, reason: data?.error?.message || 'api-error' };
    }
    console.log(`[WhatsApp] delivery-assignment alert sent to ${to}`);
    return { sent: true };
  } catch (error) {
    console.error('[WhatsApp] delivery-assignment error:', error.message);
    return { sent: false, reason: error.message };
  }
}

export function buildOtpMessage(otp) {
  return `🔐 Your Hello Mobiles login OTP is: ${otp}\nValid for 5 minutes. Do not share it with anyone.`;
}

// Login OTP to an arbitrary customer number (NOT the store's own number).
// In Cloud API test mode Meta only delivers to verified test recipients —
// anything else returns Meta's error, which we surface so the UI can explain.
export async function sendOtpWhatsApp(phone, otp) {
  const { token: TOKEN, phoneNumberId: PHONE_NUMBER_ID } = cfg();
  if (!TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] not configured — skipping OTP send');
    return { sent: false, reason: 'WhatsApp service is not configured yet' };
  }
  const digits = String(phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) return { sent: false, reason: 'Invalid phone number' };
  const to = `91${digits}`;
  try {
    if (useTemplates()) {
      const { ok, data } = await postMessage(TOKEN, PHONE_NUMBER_ID, {
        to,
        type: 'template',
        template: {
          name: 'hello_mobiles_otp',
          language: { code: 'en_US' },
          components: [{
            type: 'button', sub_type: 'url', index: '0',
            parameters: [{ type: 'text', text: String(otp) }],
          }],
        },
      });
      if (ok) {
        console.log(`[WhatsApp] login OTP (template) sent to ${to}`);
        return { sent: true };
      }
      const msg = data?.error?.message || 'api-error';
      console.error('[WhatsApp] OTP template error:', msg);
      return { sent: false, reason: msg };
    }
    const { ok, data } = await postMessage(TOKEN, PHONE_NUMBER_ID, {
      to,
      type: 'text',
      text: { body: buildOtpMessage(otp) },
    });
    if (!ok) {
      const msg = data?.error?.message || 'api-error';
      console.error('[WhatsApp] OTP send error:', msg);
      return { sent: false, reason: msg };
    }
    console.log(`[WhatsApp] login OTP sent to ${to}`);
    return { sent: true };
  } catch (error) {
    console.error('[WhatsApp] OTP send error:', error.message);
    return { sent: false, reason: error.message };
  }
}

export function buildAbandonedCartMessage(items, subtotal) {
  const itemLines = items
    .slice(0, 5)
    .map(i => `• ${i.name} × ${i.quantity}`)
    .join('\n');
  const more = items.length > 5 ? `\n• +${items.length - 5} more` : '';
  return `🛒 You left items in your cart!

${itemLines}${more}

Subtotal: ${formatINR(subtotal)}

Complete your order before the offers expire:
https://hello-mobiles.com/cart
https://wa.me/918886888128

— Hello Mobiles & Electronics`;
}

export async function sendAbandonedCartWhatsApp(phone, items, subtotal) {
  const { token: TOKEN, phoneNumberId: PHONE_NUMBER_ID, toNumber: TO_NUMBER } = cfg();
  if (!TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] not configured — skipping abandoned-cart reminder');
    return { sent: false, reason: 'not-configured' };
  }
  const to = phone || TO_NUMBER;
  try {
    const body = buildAbandonedCartMessage(items, subtotal);
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[WhatsApp] abandoned-cart error:', data?.error?.message || data);
      return { sent: false, reason: data?.error?.message || 'api-error' };
    }
    console.log(`[WhatsApp] abandoned-cart reminder sent to ${to}`);
    return { sent: true };
  } catch (error) {
    console.error('[WhatsApp] abandoned-cart error:', error.message);
    return { sent: false, reason: error.message };
  }
}

