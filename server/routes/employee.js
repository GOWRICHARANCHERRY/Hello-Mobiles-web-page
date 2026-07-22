import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', auth, roleAuth('employee'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['confirmed', 'processing'] } });
    const lowStockProducts = await Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, isActive: true }).select('name stock brand');
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

    res.json({
      todaySales: todaySales[0]?.total || 0,
      pendingOrders,
      lowStockProducts,
      todayOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/inventory', auth, roleAuth('employee'), async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select('name brand stock lowStockThreshold category price images').sort({ stock: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/inventory/:id', auth, roleAuth('employee'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { stock: req.body.stock }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
