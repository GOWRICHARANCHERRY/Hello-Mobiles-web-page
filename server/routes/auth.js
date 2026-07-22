import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    let user = await User.findOne({ phone });
    if (user) return res.status(400).json({ message: 'Phone number already registered' });
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ message: 'Email already registered' });
    }
    user = new User({ name, phone, email, password, role: 'customer' });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, address: user.address, loyaltyPoints: user.loyaltyPoints } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('wishlist');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/wishlist/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const index = user.wishlist.indexOf(req.params.productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(req.params.productId);
    }
    await user.save();
    const populated = await user.populate('wishlist');
    res.json(populated.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
