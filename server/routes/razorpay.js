import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

let rzpInstance = null;
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw Object.assign(new Error('Razorpay is not configured'), { notConfigured: true });
  if (!rzpInstance) rzpInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return rzpInstance;
}

// Create a Razorpay order for an existing (pending) app order. The server computes
// the amount from the order's total so the client can never influence it.
router.post('/create-order', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'Order ID is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'customer' && String(order.customer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (order.paymentMethod !== 'razorpay') {
      return res.status(400).json({ message: 'Order is not a Razorpay payment' });
    }
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Order already paid' });
    if (order.orderStatus === 'cancelled') return res.status(400).json({ message: 'Order is cancelled' });

    const razorpay = getRazorpay();
    const amount = Math.max(100, Math.round(order.total * 100));
    const rzpOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `HM_${order.orderNumber}`,
      notes: { orderId: String(order._id), orderNumber: order.orderNumber },
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    res.json({ order_id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, receipt: rzpOrder.receipt });
  } catch (error) {
    if (error.notConfigured) return res.status(503).json({ message: 'Payment gateway is not configured yet' });
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify the payment signature returned by the Razorpay checkout. Only when the
// HMAC matches do we mark the app order as paid.
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw Object.assign(new Error('Razorpay is not configured'), { notConfigured: true });

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'customer' && String(order.customer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cross-check the charged amount against the order total.
    try {
      const rzpOrder = await getRazorpay().orders.fetch(razorpay_order_id);
      if (Math.round(order.total * 100) !== rzpOrder.amount) {
        return res.status(400).json({ message: 'Payment amount mismatch' });
      }
    } catch (error) {
      // If the fetch fails we still trust the verified signature, but log it.
      console.error('Razorpay order fetch error (signature already valid):', error);
    }

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    res.json({ success: true, orderId: order._id, paymentStatus: order.paymentStatus });
  } catch (error) {
    if (error.notConfigured) return res.status(503).json({ message: 'Payment gateway is not configured yet' });
    console.error('Razorpay verify error:', error);
    res.status(500).json({ message: error.message });
  }
});

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  // Razorpay sends either the legacy signature or "t=<ts>,v1=<sig>".
  const legacyMatch = signatureHeader.match(/^[a-f0-9]{64}$/);
  if (legacyMatch) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signatureHeader;
  }
  const fields = {};
  signatureHeader.replace(/,/g, '&').split('&').forEach((pair) => {
    const [k, ...v] = pair.split('=');
    fields[k] = v.join('=');
  });
  if (!fields.v1) return false;
  const signedPayload = `${fields.t}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return expected === fields.v1;
}

// Webhook endpoint registered in server.js with a RAW body parser (before
// express.json) so the HMAC can be verified over the exact bytes Razorpay sent.
// Auto-marks orders paid when Razorpay confirms payment.captured — covers the
// case where the customer's browser closes before the client-side verify call.
export async function razorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(503).json({ message: 'Webhook not configured' });
    }
    const signature = req.get('x-razorpay-signature');
    if (!verifyWebhookSignature(req.body, signature, secret)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    const entity = event?.payload?.payment?.entity;
    const eventName = event?.event;

    if (eventName === 'payment.captured' && entity) {
      const order = await Order.findOne({
        $or: [{ razorpayPaymentId: entity.id }, { razorpayOrderId: entity.order_id }],
      });
      if (order && order.paymentStatus !== 'paid' && order.orderStatus !== 'cancelled') {
        // Cross-check the charged amount against the order total.
        if (Math.round(order.total * 100) === Number(entity.amount)) {
          order.paymentStatus = 'paid';
          order.razorpayPaymentId = entity.id;
          order.razorpayOrderId = order.razorpayOrderId || entity.order_id;
          order.razorpaySignature = order.razorpaySignature || signature;
          await order.save();
          console.log(`[webhook] order ${order.orderNumber} marked paid (${entity.id})`);
        } else {
          console.error(`[webhook] amount mismatch for order ${order.orderNumber}: ${entity.amount} vs ${order.total * 100}`);
        }
      }
    } else if (eventName === 'payment.failed' && entity) {
      const order = await Order.findOne({ razorpayPaymentId: entity.id });
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed';
        await order.save();
        console.log(`[webhook] order ${order.orderNumber} marked failed`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ message: error.message });
  }
}

export default router;
