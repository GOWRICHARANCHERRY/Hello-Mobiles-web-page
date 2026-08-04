import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { auth, roleAuth } from '../middleware/auth.js';
import { sendOrderWhatsApp } from '../utils/whatsapp.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    const orders = await Order.find(query).populate('customer', 'name phone email').populate('assignedDelivery', 'name phone').populate('items.product', 'name images').sort({ createdAt: -1 });
    res.json(orders);
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
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin/Employee: assign or unassign an order to a delivery boy
router.put('/:id/assign', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const { deliveryId } = req.body;
    if (deliveryId) {
      const delivery = await User.findOne({ _id: deliveryId, role: 'delivery' });
      if (!delivery) return res.status(400).json({ message: 'Delivery staff not found' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { assignedDelivery: deliveryId || null, deliveryStatus: deliveryId ? 'assigned' : 'unassigned' },
      { new: true }
    ).populate('assignedDelivery', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delivery boy: update delivery progress
router.put('/:id/delivery-status', auth, roleAuth('delivery', 'admin', 'employee'), async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    if (!['assigned', 'out_for_delivery', 'delivered', 'cancelled'].includes(deliveryStatus)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }
    const update = { deliveryStatus };
    if (deliveryStatus === 'delivered') {
      update.deliveredAt = new Date();
      update.orderStatus = 'delivered';
      update.paymentStatus = 'paid';
    }
    if (deliveryStatus === 'cancelled') {
      update.orderStatus = 'cancelled';
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
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
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, emiDetails, exchangeDetails, couponCode } = req.body;
    let subtotal = 0;
    const orderItems = [];

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
        variant: item.variant || undefined,
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
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      emiDetails,
      exchangeDetails,
      subtotal,
      deliveryCharge,
      couponCode: appliedCoupon?.code,
      couponDiscount,
      total,
    });

    await order.save();

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
    const update = { orderStatus };
    if (trackingId) update.trackingId = trackingId;
    if (orderStatus === 'delivered') {
      update.deliveredAt = new Date();
      update.deliveryStatus = 'delivered';
    }
    if (orderStatus === 'cancelled') update.deliveryStatus = 'cancelled';
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/payment', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: req.body.paymentStatus }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
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
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      if (item.variant?.variantId) {
        const variant = product.variants.id(item.variant.variantId);
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
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.deliveryStatus = 'cancelled';
    if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
    await order.save();
    res.json(order);
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
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
