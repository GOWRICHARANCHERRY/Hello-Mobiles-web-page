import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { auth, roleAuth } from '../middleware/auth.js';
import { sendOrderWhatsApp, sendAbandonedCartWhatsApp, sendDeliveryAssignedWhatsApp } from '../utils/whatsapp.js';
import { getDeliveryConfig, findDeliverableZone } from '../utils/delivery.js';
import { invalidateCache } from '../utils/cache.js';

const router = express.Router();

// Strip the delivery OTP from any response unless the requester is the customer
// who owns the order (the delivery boy must ASK the customer for the OTP, and
// staff don't need it either).
function orderJson(order, role) {
  const json = order?.toObject ? order.toObject() : order;
  if (json && role !== 'customer') {
    delete json.deliveryOtp;
    delete json.deliveryOtpExpiresAt;
  }
  return json;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const OTP_TTL_MS = 48 * 60 * 60 * 1000;

// Return an order's items back to stock (variant/color stock + IMEI status) when
// an order is cancelled. Shared by admin/employee status change, delivery cancel,
// and customer cancel so stock is never lost on cancellation.
async function restoreOrderStock(order) {
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;
    const variantId = item.variant?.variantId || item.variantId;
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (variant) {
        const colorEntry = item.variant.color ? variant.colors?.find(c => c.name === item.variant.color) : null;
        if (colorEntry) {
          colorEntry.stock += item.quantity;
          for (const imei of (colorEntry.imei || [])) {
            if (typeof imei === 'object' && imei.status === 'sold' && imei.orderId?.toString() === order._id.toString()) {
              imei.status = 'in_stock';
              imei.orderId = undefined;
              imei.orderNumber = undefined;
              imei.soldAt = undefined;
              imei.soldPrice = undefined;
              imei.soldTo = undefined;
            }
          }
        } else {
          for (const c of variant.colors) { c.stock += item.quantity; }
        }
      }
    } else {
      product.stock += item.quantity;
    }
    await product.save();
    invalidateCache('products:');
  }
}

router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    const orders = await Order.find(query).populate('customer', 'name phone email').populate('assignedDelivery', 'name phone').populate('items.product', 'name images').sort({ createdAt: -1 });
    res.json(orders.map(o => orderJson(o, req.user.role)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lightweight endpoint for the new-order alarm (admin/employee)
router.get('/latest', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const order = await Order.findOne({})
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .select('orderNumber total paymentMethod orderStatus shippingAddress customer createdAt');
    res.json(order || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delivery boy: list assigned orders (admin/employee see all with delivery info)
router.get('/delivery', auth, roleAuth('delivery', 'admin', 'employee'), async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'delivery') query.assignedDelivery = req.user.id;
    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('assignedDelivery', 'name phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    res.json(orders.map(o => orderJson(o, req.user.role)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Employee: assign or unassign an order to a delivery boy.
// On assignment we generate the delivery OTP (customer sees it on their order
// page and shares it with the boy) and try to WhatsApp the customer the boy's
// name, phone and the OTP.
router.put('/:id/assign', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const { deliveryId } = req.body;
    let delivery = null;
    if (deliveryId) {
      delivery = await User.findOne({ _id: deliveryId, role: 'delivery' });
      if (!delivery) return res.status(400).json({ message: 'Delivery staff not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.assignedDelivery = deliveryId || null;
    order.deliveryStatus = deliveryId ? 'assigned' : 'unassigned';
    if (deliveryId) {
      order.deliveryOtp = generateOtp();
      order.deliveryOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    } else {
      order.deliveryOtp = undefined;
      order.deliveryOtpExpiresAt = undefined;
    }
    await order.save();

    if (delivery && deliveryId) {
      const populated = await order.populate('customer', 'name phone');
      const customerPhone = order.shippingAddress?.phone || populated.customer?.phone;
      sendDeliveryAssignedWhatsApp(customerPhone, order, delivery, order.deliveryOtp);
    }

    res.json(orderJson(await Order.findById(order._id).populate('assignedDelivery', 'name phone'), req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delivery boy: start delivery (photo of parcel) or mark delivered (photo + customer OTP)
router.post('/:id/delivery/start', auth, roleAuth('delivery', 'admin', 'employee'), async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo || typeof photo !== 'string') {
      return res.status(400).json({ message: 'A parcel photo is required to start delivery' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'delivery' && order.assignedDelivery?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'This order is not assigned to you' });
    }

    // Regenerate the OTP if missing or expired so it is always fresh while the
    // parcel is actually on the road.
    if (!order.deliveryOtp || !order.deliveryOtpExpiresAt || new Date(order.deliveryOtpExpiresAt) < new Date()) {
      order.deliveryOtp = generateOtp();
      order.deliveryOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    }
    order.deliveryStatus = 'out_for_delivery';
    order.startDeliveryPhoto = photo;
    order.startDeliveryAt = new Date();
    await order.save();

    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delivery boy: update delivery progress. Marking delivered requires the
// delivery boy to upload a photo of the delivered parcel AND enter the customer's
// OTP (delivery boy role enforces both; admin/employee may force-deliver).
router.put('/:id/delivery-status', auth, roleAuth('delivery', 'admin', 'employee'), async (req, res) => {
  try {
    const { deliveryStatus, photo, otp } = req.body;
    if (!['assigned', 'out_for_delivery', 'delivered', 'cancelled'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'delivery' && order.assignedDelivery?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'This order is not assigned to you' });
    }

    if (deliveryStatus === 'delivered') {
      if (req.user.role === 'delivery') {
        if (!photo || typeof photo !== 'string') {
          return res.status(400).json({ message: 'A photo of the delivered parcel is required' });
        }
        if (!otp) return res.status(400).json({ message: 'The customer OTP is required to mark delivered' });
        const valid = order.deliveryOtp && String(otp).trim() === order.deliveryOtp
          && order.deliveryOtpExpiresAt && new Date(order.deliveryOtpExpiresAt) > new Date();
        if (!valid) return res.status(400).json({ message: 'Invalid or expired OTP' });
        order.deliveryPhoto = photo;
      }
      order.deliveredAt = new Date();
      order.orderStatus = 'delivered';
      order.paymentStatus = 'paid';
    }
    if (deliveryStatus === 'cancelled') {
      if (order.orderStatus !== 'cancelled') {
        await restoreOrderStock(order);
        if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
      }
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
    }
    order.deliveryStatus = deliveryStatus;
    await order.save();
    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delivery boy: push live GPS location while out for delivery. The customer's
// order page polls the order and shows the latest position on a map.
router.post('/:id/location', auth, roleAuth('delivery'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Invalid location' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.assignedDelivery?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'This order is not assigned to you' });
    }
    order.liveLocation = { lat, lng, updatedAt: new Date() };
    await order.save();
    res.json({ ok: true, updatedAt: order.liveLocation.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer: abandoned-cart reminder — WhatsApp the customer's saved cart items
// when they didn't check out. No auth requirement server-side beyond the token
// (phone comes from the logged-in user when available).
const lastAbandonedSent = new Map();
router.post('/abandoned-cart', auth, async (req, res) => {
  try {
    const { items, subtotal } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const user = await User.findById(req.user.id).select('phone');
    const phone = user?.phone;

    const key = `${req.user.id}:${items.length}:${Math.round(subtotal || 0)}`;
    const now = Date.now();
    const last = lastAbandonedSent.get(key);
    if (last && now - last < 60 * 60 * 1000) {
      return res.json({ sent: false, reason: 'rate-limited' });
    }
    lastAbandonedSent.set(key, now);

    const result = await sendAbandonedCartWhatsApp(phone, items, subtotal || 0);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name phone email address').populate('assignedDelivery', 'name phone').populate('items.product', 'name images brand');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, emiDetails, exchangeDetails, couponCode } = req.body;
    let subtotal = 0;
    const orderItems = [];

    if (paymentMethod !== 'store_pickup') {
      const deliveryCfg = await getDeliveryConfig();
      if (deliveryCfg.enabled && deliveryCfg.zones.some((z) => z.isActive)) {
        const lat = shippingAddress?.latitude;
        const lng = shippingAddress?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          return res.status(400).json({ message: 'Delivery location is required. Please set your delivery pin on the map.' });
        }
        const zone = findDeliverableZone(lat, lng, deliveryCfg.zones);
        if (!zone || !zone.deliverable) {
          return res.status(400).json({ message: 'Delivery is not available at this location.' });
        }
      }
    }

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });

      let itemPrice = product.price;
      let itemImage = product.images?.[0] || '';

      if (item.variantId && product.variants?.length > 0) {
        const variant = product.variants.id(item.variantId);
        if (!variant) return res.status(404).json({ message: `Variant not found for ${product.name}` });
        if (item.variant?.color) {
          const colorEntry = variant.colors?.find(c => c.name === item.variant.color);
          if (!colorEntry) return res.status(404).json({ message: `Color "${item.variant.color}" not found for ${product.name}` });
          if (colorEntry.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name} (${item.variant.color} ${variant.ram}/${variant.storage})` });
          if (product.category === 'Mobiles' && colorEntry.imei?.length > 0) {
            const soldImeis = colorEntry.imei
              .filter(e => (typeof e === 'object' ? e.status : 'in_stock') === 'in_stock')
              .slice(0, item.quantity);
            if (soldImeis.length < item.quantity) return res.status(400).json({ message: `Not enough IMEI units in stock for ${product.name} (${item.variant.color})` });
            for (const imei of soldImeis) {
              if (typeof imei === 'object') {
                imei.status = 'sold';
                imei.soldAt = new Date();
                imei.orderId = null;
                imei.orderNumber = null;
                imei.soldPrice = itemPrice;
                imei.soldTo = req.user.id;
              }
            }
          }
          colorEntry.stock -= item.quantity;
          if (colorEntry.image) itemImage = colorEntry.image;
        } else {
          const totalStock = variant.colors?.reduce((s, c) => s + (c.stock || 0), 0) || 0;
          if (totalStock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name} (${variant.ram}/${variant.storage})` });
          for (const c of variant.colors) { c.stock = Math.max(0, c.stock - item.quantity); }
        }
        itemPrice = variant.price;
      } else if (product.variants?.length > 0) {
        return res.status(400).json({ message: `Please select a variant for ${product.name}` });
      } else {
        if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        product.stock -= item.quantity;
      }

      await product.save();
      subtotal += itemPrice * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: itemImage,
        variant: item.variant ? { ...item.variant, variantId: item.variant.variantId || item.variantId } : undefined,
      });
    }

    const deliveryCharge = paymentMethod === 'store_pickup' ? 0 : (subtotal > 5000 ? 0 : 99);
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const Coupon = (await import('../models/Coupon.js')).default;
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      const now = new Date();
      if (!coupon || !coupon.isActive) return res.status(400).json({ message: 'Invalid coupon code' });
      if (coupon.validFrom && now < coupon.validFrom) return res.status(400).json({ message: 'Coupon is not active yet' });
      if (coupon.validTo && now > coupon.validTo) return res.status(400).json({ message: 'Coupon has expired' });
      if (subtotal < coupon.minOrder) return res.status(400).json({ message: `Minimum order of ₹${coupon.minOrder.toLocaleString()} required for this coupon` });
      if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ message: 'Coupon usage limit reached' });
      let eligibleSubtotal = subtotal;
      if (coupon.appliesTo === 'selected') {
        const allowed = coupon.applicableProductIds.map(id => String(id));
        eligibleSubtotal = orderItems
          .filter(oi => allowed.includes(String(oi.product)))
          .reduce((sum, oi) => sum + oi.price * oi.quantity, 0);
        if (eligibleSubtotal <= 0) return res.status(400).json({ message: 'This coupon is not valid for the products in your cart' });
      }
      if (eligibleSubtotal < coupon.minOrder) return res.status(400).json({ message: `Minimum order of ₹${coupon.minOrder.toLocaleString()} required for this coupon` });
      couponDiscount = coupon.discountType === 'percent'
        ? Math.round((eligibleSubtotal * coupon.value) / 100)
        : Math.min(coupon.value, eligibleSubtotal);
      if (coupon.discountType === 'percent' && coupon.maxDiscount) couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
      couponDiscount = Math.round(couponDiscount);
      appliedCoupon = coupon;
    }

    const total = Math.max(0, subtotal + deliveryCharge - (exchangeDetails?.exchangeValue || 0) - couponDiscount);

    const order = new Order({
      customer: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: ['cod', 'razorpay'].includes(paymentMethod) ? 'pending' : 'paid',
      emiDetails,
      exchangeDetails,
      subtotal,
      deliveryCharge,
      couponCode: appliedCoupon?.code,
      couponDiscount,
      total,
    });

    await order.save();
    invalidateCache('products:');

    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
    }

    if (items.some(i => i.variantId)) {
      for (const item of items) {
        if (!item.variantId) continue;
        const p = await Product.findById(item.product);
        if (!p || p.category !== 'Mobiles') continue;
        const variant = p.variants.id(item.variantId);
        if (!variant) continue;
        const colorEntry = variant.colors?.find(c => c.name === item.variant?.color);
        if (!colorEntry) continue;
        for (const imei of (colorEntry.imei || [])) {
          if (typeof imei === 'object' && imei.status === 'sold' && !imei.orderId) {
            imei.orderId = order._id;
            imei.orderNumber = order.orderNumber;
          }
        }
        await p.save();
      }
    }

    sendOrderWhatsApp(order, req.user);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const { orderStatus, trackingId } = req.body;
    if (!['confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      await restoreOrderStock(order);
      if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
      order.cancelledAt = new Date();
    }
    order.orderStatus = orderStatus;
    if (trackingId) order.trackingId = trackingId;
    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
      order.deliveryStatus = 'delivered';
    }
    if (orderStatus === 'cancelled') {
      order.cancelledAt = new Date();
      order.deliveryStatus = 'cancelled';
    }
    await order.save();
    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/payment', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer: cancel an order (only before shipping)
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!['confirmed', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Order can only be cancelled before it is shipped' });
    }

    // Restore stock and IMEI entries
    await restoreOrderStock(order);

    order.orderStatus = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.deliveryStatus = 'cancelled';
    if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
    await order.save();
    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customer: request a return on a delivered order
router.post('/:id/return', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ message: 'Return can only be requested after delivery' });
    }
    if (order.returnRequested) return res.status(400).json({ message: 'Return already requested for this order' });

    order.returnRequested = true;
    order.returnReason = req.body.reason || 'Customer requested return';
    order.returnStatus = 'requested';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Employee: approve or reject a return request
router.put('/:id/return-status', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const { returnStatus } = req.body;
    if (!['approved', 'rejected'].includes(returnStatus)) return res.status(400).json({ message: 'Invalid return status' });
    const update = { returnStatus };
    if (returnStatus === 'approved') {
      update.paymentStatus = 'refunded';
      update.orderStatus = 'delivered';
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(orderJson(order, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
