import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', auth, roleAuth('admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const totalOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['confirmed', 'processing'] } });
    const lowStockProducts = await Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    const bestSelling = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const salesByBrand = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: '$productInfo' },
      { $group: { _id: '$productInfo.brand', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
    ]);

    const salesByCategory = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: '$productInfo' },
      { $group: { _id: '$productInfo.category', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
    ]);

    const monthlyTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(today.getFullYear(), 0, 1) }, paymentStatus: 'paid' } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } },
    ]);

    const recentOrders = await Order.find().populate('customer', 'name phone').sort({ createdAt: -1 }).limit(10);

    res.json({
      dailyRevenue: dailyRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      totalProducts,
      totalCustomers,
      totalEmployees,
      bestSelling,
      salesByBrand,
      salesByCategory,
      monthlyTrend,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/employees', auth, roleAuth('admin'), async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/employees', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const employee = new User({ name, phone, email, password, role: 'employee' });
    await employee.save();
    res.status(201).json({ id: employee._id, name: employee.name, phone: employee.phone, email: employee.email, role: employee.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/employees/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/customers', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reports/profit', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { paymentStatus: 'paid' };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

    const revenue = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ summary: revenue[0] || { total: 0, count: 0 }, monthlyRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
