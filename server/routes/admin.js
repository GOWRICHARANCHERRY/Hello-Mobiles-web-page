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
    const employees = await User.find({ role: { $in: ['employee', 'delivery'] } }).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/employees', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { name, phone, email, password, role = 'employee' } = req.body;
    if (!['employee', 'delivery'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const employee = new User({ name, phone, email, password, role });
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

router.put('/employees/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (!['employee', 'delivery'].includes(employee.role)) return res.status(400).json({ message: 'Not an employee account' });
    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (email !== undefined) employee.email = email;
    if (password) employee.password = password;
    if (role && ['employee', 'delivery'].includes(role)) employee.role = role;
    await employee.save();
    res.json({ id: employee._id, name: employee.name, phone: employee.phone, email: employee.email, role: employee.role });
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

// ---------- Coupons ----------
router.get('/coupons', auth, roleAuth('admin'), async (req, res) => {
  try {
    const Coupon = (await import('../models/Coupon.js')).default;
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/coupons', auth, roleAuth('admin'), async (req, res) => {
  try {
    const Coupon = (await import('../models/Coupon.js')).default;
    const { code, discountType, value, minOrder, maxDiscount, validFrom, validTo, maxUses, isActive, appliesTo, applicableProductIds } = req.body;
    if (!code || !value) return res.status(400).json({ message: 'Code and value are required' });
    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      value,
      minOrder: Number(minOrder) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      maxUses: Number(maxUses) || 0,
      isActive: isActive !== false,
      appliesTo: appliesTo === 'selected' ? 'selected' : 'all',
      applicableProductIds: appliesTo === 'selected' ? (applicableProductIds || []) : [],
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/coupons/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const Coupon = (await import('../models/Coupon.js')).default;
    const updateData = { ...req.body };
    if (updateData.code) updateData.code = updateData.code.toUpperCase().trim();
    if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
    if (updateData.validTo) updateData.validTo = new Date(updateData.validTo);
    if (updateData.appliesTo !== 'selected') {
      updateData.appliesTo = 'all';
      updateData.applicableProductIds = [];
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/coupons/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const Coupon = (await import('../models/Coupon.js')).default;
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Leads ----------
router.get('/leads', auth, roleAuth('admin'), async (req, res) => {
  try {
    const Lead = (await import('../models/Lead.js')).default;
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/leads/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    const Lead = (await import('../models/Lead.js')).default;
    const lead = await Lead.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Bulk Stock Import ----------
router.post('/bulk-stock', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items provided' });

    const results = { updated: [], notFound: [], errors: [] };
    for (const row of items) {
      const name = (row.name || '').trim();
      const stock = Number(row.stock);
      if (!name) { results.errors.push({ name, message: 'Missing name' }); continue; }
      if (isNaN(stock) || stock < 0) { results.errors.push({ name, message: 'Invalid stock value' }); continue; }

      const product = await Product.findOne({ name, isActive: true });
      if (!product) {
        const fuzzy = await Product.findOne({ name: { $regex: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, isActive: true });
        if (fuzzy) {
          fuzzy.stock = stock;
          await fuzzy.save();
          results.updated.push({ name: fuzzy.name, stock: fuzzy.stock });
        } else {
          results.notFound.push(name);
        }
        continue;
      }
      product.stock = stock;
      await product.save();
      results.updated.push({ name: product.name, stock: product.stock });
    }

    res.json({ updated: results.updated.length, notFound: results.notFound, errors: results.errors, details: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
