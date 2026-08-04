const GRAPH_VERSION = 'v19.0';
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TO_NUMBER = process.env.WHATSAPP_TO || '918886888128';

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

export async function sendOrderWhatsApp(order, customer) {
  if (!TOKEN || !PHONE_NUMBER_ID) {
    console.log('[WhatsApp] not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing) — skipping');
    return { sent: false, reason: 'not-configured' };
  }
  try {
    const body = buildOrderMessage(order, customer);
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: TO_NUMBER,
        type: 'text',
        text: { body },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
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
