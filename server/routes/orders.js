import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    }
    const orders = await Order.find(query).populate('customer', 'name phone email').populate('items.product', 'name images').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name phone email address').populate('items.product', 'name images brand');
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
    const { items, shippingAddress, paymentMethod, emiDetails, exchangeDetails } = req.body;
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
    const total = subtotal + deliveryCharge - (exchangeDetails?.exchangeValue || 0);

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
      total,
    });

    await order.save();

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
    if (orderStatus === 'delivered') update.deliveredAt = new Date();
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

export default router;
