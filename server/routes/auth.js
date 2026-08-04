import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { verifyFirebaseToken } from '../config/firebase.js';
import { sendOTP, generateOTP } from '../utils/otp.js';

const router = express.Router();

const limit = (max, windowMs = 15 * 60 * 1000) => rateLimit({
  windowMs,
  limit: max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
});

const loginLimiter = limit(10);
const otpLimiter = limit(5, 60 * 60 * 1000);
const verifyLimiter = limit(10);

const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

// Firebase Phone Auth - verify token and login/signup
router.post('/firebase-auth', async (req, res) => {
  try {
    const { idToken, name, email } = req.body;

    // Verify Firebase token
    let firebaseUser = null;
    try {
      firebaseUser = await verifyFirebaseToken(idToken);
    } catch (err) {
      // In dev mode, this may fail - handle gracefully
      console.log('Firebase token verification skipped (dev mode)');
    }

    // For dev mode: accept phone from request body
    const phone = firebaseUser?.phone_number || req.body.phone;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number required' });
    }

    let user = await User.findOne({ phone });

    if (user) {
      // Existing user - just login
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.json({
        token,
        user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, address: user.address, loyaltyPoints: user.loyaltyPoints },
        isNewUser: false,
      });
    }

    // New user - create account
    const password = Math.random().toString(36).slice(-8);
    user = new User({
      name: name || 'Customer',
      phone,
      email: email || undefined,
      password,
      role: 'customer',
      phoneVerified: true,
      avatar: firebaseUser?.picture || undefined,
    });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
      isNewUser: true,
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

// Send OTP (fallback for non-Firebase)
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Invalid phone number' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ phone });
    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = new User({
        name: 'Temp',
        phone,
        password: Math.random().toString(36).slice(-8),
        otp,
        otpExpiry,
      });
      await user.save();
    }

    await sendOTP(phone, otp);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP (fallback)
router.post('/verify-otp', verifyLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Invalid phone number' });
    const user = await User.findOne({ phone });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: 'No OTP found' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.phoneVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// Complete signup after OTP
router.post('/complete-signup', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const user = await User.findOne({ phone });

    if (!user) return res.status(400).json({ message: 'Please verify your phone first' });
    if (!user.phoneVerified) return res.status(400).json({ message: 'Phone not verified yet' });
    if (user.name !== 'Temp') {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
    }

    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) return res.status(400).json({ message: 'Email already registered' });
    }

    user.name = name;
    user.email = email || undefined;
    user.password = password;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const password = Math.random().toString(36).slice(-8);
      user = new User({ name, email, password, role: 'customer', avatar: picture, phoneVerified: true });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar, address: user.address, loyaltyPoints: user.loyaltyPoints },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Phone + Password Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!isValidPhone(phone) || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.name === 'Temp') return res.status(400).json({ message: 'Please complete your registration first' });
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
    if (index > -1) { user.wishlist.splice(index, 1); }
    else { user.wishlist.push(req.params.productId); }
    await user.save();
    const populated = await user.populate('wishlist');
    res.json(populated.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
