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
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      product.stock -= item.quantity;
      await product.save();
      subtotal += product.price * item.quantity;
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity, image: product.images[0] });
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
