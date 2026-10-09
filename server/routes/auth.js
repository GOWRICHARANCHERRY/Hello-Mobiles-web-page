import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { verifyFirebaseToken, isFirebaseConfigured } from '../config/firebase.js';
import { sendOTP, generateOTP } from '../utils/otp.js';
import { sendOtpWhatsApp } from '../utils/whatsapp.js';

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
router.post('/firebase-auth', limit(20), async (req, res) => {
  try {
    const { idToken, name, email } = req.body;

    // Verify Firebase token
    let firebaseUser = null;
    let verifyFailed = false;
    try {
      firebaseUser = await verifyFirebaseToken(idToken);
    } catch (err) {
      verifyFailed = true;
    }

    // SECURITY: when Firebase is configured (production), a failed/invalid
    // token must be rejected outright. Falling back to the client-supplied
    // phone would let anyone log in as any user (including admin) with a
    // bogus token. The unverified fallback is dev-only (no Firebase keys).
    if (verifyFailed && isFirebaseConfigured()) {
      return res.status(401).json({ message: 'Invalid login token' });
    }
    if (!firebaseUser && isFirebaseConfigured()) {
      return res.status(401).json({ message: 'Invalid login token' });
    }

    // Dev mode only (Firebase not configured): accept phone from request body
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

    // New user - create account (honor client-supplied signup details when valid)
    const password = (typeof req.body.password === 'string' && req.body.password.length >= 6)
      ? req.body.password
      : Math.random().toString(36).slice(-8);
    const displayName = (typeof req.body.name === 'string' && req.body.name.trim())
      ? req.body.name.trim().slice(0, 100)
      : (name || 'Customer');
    user = new User({
      name: displayName,
      phone,
      email: req.body.email || email || undefined,
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
    // Store only a hash — a DB leak must not expose usable OTPs.
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    let user = await User.findOne({ phone });
    if (user) {
      user.otp = otpHash;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = new User({
        name: 'Temp',
        phone,
        password: Math.random().toString(36).slice(-8),
        otp: otpHash,
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
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    if (user.otp !== otpHash) return res.status(400).json({ message: 'Invalid OTP' });

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
router.post('/complete-signup', limit(20), async (req, res) => {
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

    // OTP-first signup: default anything the client didn't supply so a
    // verified phone always ends up with a usable account.
    user.name = (typeof name === 'string' && name.trim() ? name.trim().slice(0, 100) : (user.name !== 'Temp' ? user.name : 'Customer'));
    user.email = email || undefined;
    user.password = (typeof password === 'string' && password.length >= 6)
      ? password
      : Math.random().toString(36).slice(-10);
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

// Google Login
router.post('/google', loginLimiter, async (req, res) => {
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

    if (user?.isActive === false) {
      return res.status(403).json({ message: 'Account deactivated' });
    }
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

// Send login OTP over WhatsApp (from the store's WhatsApp Business number).
// NOTE (test mode): Meta only delivers to verified test recipients. Any other
// number gets a clear 502 until the store migrates its own production number.
router.post('/send-whatsapp-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Invalid phone number' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    let user = await User.findOne({ phone });
    if (user) {
      user.otp = otpHash;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = new User({
        name: 'Temp',
        phone,
        password: Math.random().toString(36).slice(-8),
        otp: otpHash,
        otpExpiry,
      });
      await user.save();
    }

    const result = await sendOtpWhatsApp(phone, otp);
    if (!result.sent) {
      // Translate Meta's technical errors into something customers understand.
      const reason = result.reason || '';
      let message = 'WhatsApp message failed, please try again later.';
      if (/not a valid whatsapp user|not in allowed list|131030/i.test(reason)) {
        message = 'This number is not on WhatsApp. Please check the number and try again.';
      } else if (/re-engagement|131047|template/i.test(reason)) {
        message = 'WhatsApp login is rolling out gradually. Please use password login or contact the store for help.';
      } else if (/not configured/i.test(reason)) {
        message = 'WhatsApp login is not enabled yet. Please use password login.';
      }
      return res.status(502).json({ message });
    }
    res.json({ message: 'OTP sent on WhatsApp' });
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Send login OTP over SMS via 2factor.in (cheap fallback when the customer
// has no WhatsApp). Costs ~₹0.20/OTP — far cheaper than Firebase SMS (~₹6).
router.post('/send-sms-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Invalid phone number' });
    if (!process.env.FAST2SMS_API_KEY && !process.env.TWOFACTOR_API_KEY) {
      return res.status(503).json({ message: 'SMS service is not configured yet' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    let user = await User.findOne({ phone });
    if (user) {
      user.otp = otpHash;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      user = new User({
        name: 'Temp',
        phone,
        password: Math.random().toString(36).slice(-8),
        otp: otpHash,
        otpExpiry,
      });
      await user.save();
    }

    const ok = await sendOTP(phone, otp);
    if (!ok) return res.status(502).json({ message: 'Failed to send SMS. Please try again.' });
    res.json({ message: 'OTP sent via SMS' });
  } catch (error) {
    console.error('Send SMS OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});
// Phone.Email free SMS quota tracker: 1000/month for the first 6 months.
// Everything after that (or past quota) falls through to paid SMS.
const PE_MONTHLY_QUOTA = 1000;
const PE_FREE_MONTHS = 6;

async function getPhoneEmailStatus() {
  const clientId = process.env.PHONEEMAIL_CLIENT_ID || '';
  if (!clientId) return { enabled: false, remaining: 0, clientId: '' };
  try {
    const monthKey = new Date().toISOString().slice(0, 7);
    const Setting = (await import('../models/Setting.js')).default;
    const [monthDoc, startDoc] = await Promise.all([
      Setting.findOne({ key: 'PE_MONTH' }),
      Setting.findOne({ key: 'PE_START' }),
    ]);
    if (!startDoc?.value) return { enabled: true, remaining: PE_MONTHLY_QUOTA, clientId, fresh: true };
    const startMonth = startDoc.value;
    const monthsUsed = (Number(monthKey.slice(0, 4)) - Number(startMonth.slice(0, 4))) * 12
      + (Number(monthKey.slice(5, 7)) - Number(startMonth.slice(5, 7)));
    if (monthsUsed >= PE_FREE_MONTHS) return { enabled: false, remaining: 0, clientId: '' };
    const usedThisMonth = monthDoc?.key === undefined || monthDoc?.value !== monthKey
      ? 0
      : Number((await Setting.findOne({ key: 'PE_COUNT' }))?.value || 0);
    return { enabled: usedThisMonth < PE_MONTHLY_QUOTA, remaining: Math.max(0, PE_MONTHLY_QUOTA - usedThisMonth), clientId };
  } catch {
    return { enabled: !!clientId, remaining: PE_MONTHLY_QUOTA, clientId };
  }
}

async function bumpPhoneEmailUsage() {
  try {
    const Setting = (await import('../models/Setting.js')).default;
    const monthKey = new Date().toISOString().slice(0, 7);
    await Setting.findOneAndUpdate({ key: 'PE_START' }, { $setOnInsert: { key: 'PE_START', value: monthKey } }, { upsert: true });
    const monthDoc = await Setting.findOne({ key: 'PE_MONTH' });
    if (!monthDoc || monthDoc.value !== monthKey) {
      await Setting.findOneAndUpdate({ key: 'PE_MONTH' }, { key: 'PE_MONTH', value: monthKey }, { upsert: true });
      await Setting.findOneAndUpdate({ key: 'PE_COUNT' }, { key: 'PE_COUNT', value: '1' }, { upsert: true });
    } else {
      await Setting.findOneAndUpdate({ key: 'PE_COUNT' }, [{ $set: { value: { $toString: { $add: [{ $toLong: '$value' }, 1] } } } }], { upsert: true });
    }
  } catch { /* usage tracking must never break login */ }
}

// Phone.Email redirect flow: the client sends the user to phone.email's
// hosted login; Meta-style, phone.email redirects back with ?access_token=.
// The SERVER exchanges it for the verified phone (never trust client claims).
router.post('/phone-email-token', limit(20), async (req, res) => {
  try {
    const clientId = process.env.PHONEEMAIL_CLIENT_ID || '';
    if (!clientId) return res.status(503).json({ message: 'Phone verification is not configured yet' });
    const accessToken = String(req.body?.access_token || '');
    if (!accessToken || accessToken.length > 500) return res.status(400).json({ message: 'Invalid verification data' });
    const pe = await getPhoneEmailStatus();
    if (!pe.enabled) return res.status(400).json({ message: 'Free SMS quota exhausted. Please use another login option.' });
    let data;
    try {
      const resp = await fetch('https://eapi.phone.email/getuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, client_id: clientId }),
      });
      data = await resp.json();
    } catch {
      return res.status(502).json({ message: 'Verification service unreachable. Try again.' });
    }
    if (data?.status !== 200) return res.status(401).json({ message: 'Phone verification failed' });
    const cc = String(data?.country_code || '').replace(/\D/g, '');
    const national = String(data?.phone_no || '').replace(/\D/g, '');
    const phone = cc === '91' ? national : (national.length === 10 ? national : '');
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Phone number verification failed' });

    let user = await User.findOne({ phone });
    if (user?.isActive === false) return res.status(403).json({ message: 'Account deactivated' });
    if (!user) {
      user = new User({
        name: 'Customer',
        phone,
        password: Math.random().toString(36).slice(-12),
        role: 'customer',
        phoneVerified: true,
      });
      await user.save();
    } else if (!user.phoneVerified) {
      user.phoneVerified = true;
      await user.save();
    }
    await bumpPhoneEmailUsage();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Phone.Email token verify error:', error.message);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});
// Public: which OTP channels are currently available (drives UI options).
router.get('/otp-options', async (req, res) => {
  try {
    const pe = await getPhoneEmailStatus();
    res.json({
      phoneEmail: pe.enabled,
      phoneEmailClientId: pe.clientId,
      phoneEmailRemaining: pe.remaining,
      sms: !!(process.env.FAST2SMS_API_KEY || process.env.TWOFACTOR_API_KEY),
      whatsapp: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    });
  } catch {
    res.json({ phoneEmail: false, phoneEmailClientId: '', phoneEmailRemaining: 0, sms: false, whatsapp: false });
  }
});

// Verify a Phone.Email sign-in: client hands over the user_json_url from the
// widget callback; the SERVER fetches it (never trust the browser's word for
// the phone number) and issues our JWT on match.
router.post('/phone-email-verify', limit(20), async (req, res) => {
  try {
    const { user_json_url } = req.body;
    let url;
    try {
      url = new URL(String(user_json_url || ''));
    } catch {
      return res.status(400).json({ message: 'Invalid verification data' });
    }
    // SSRF guard: only Phone.Email's own JSON host is ever fetched.
    if (url.protocol !== 'https:' || url.hostname !== 'user.phone.email') {
      return res.status(400).json({ message: 'Invalid verification data' });
    }
    const pe = await getPhoneEmailStatus();
    if (!pe.enabled) return res.status(400).json({ message: 'Free SMS quota exhausted. Please use another login option.' });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let data;
    try {
      const resp = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timer);
      data = await resp.json();
    } catch {
      clearTimeout(timer);
      return res.status(502).json({ message: 'Verification service unreachable. Try again.' });
    }
    const cc = String(data?.user_country_code || '').replace(/\D/g, '');
    const national = String(data?.user_phone_number || '').replace(/\D/g, '');
    const phone = cc === '91' ? national : (national.length === 10 ? national : '');
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Phone number verification failed' });

    let user = await User.findOne({ phone });
    if (user?.isActive === false) return res.status(403).json({ message: 'Account deactivated' });
    if (!user) {
      const first = String(data?.user_first_name || '').slice(0, 50);
      const last = String(data?.user_last_name || '').slice(0, 50);
      user = new User({
        name: [first, last].filter(Boolean).join(' ') || 'Customer',
        phone,
        password: Math.random().toString(36).slice(-12),
        role: 'customer',
        phoneVerified: true,
      });
      await user.save();
    } else if (!user.phoneVerified) {
      user.phoneVerified = true;
      await user.save();
    }
    await bumpPhoneEmailUsage();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Phone.Email verify error:', error.message);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});
// Phone + Password Registration (used by the header signup form)
router.post('/register', limit(10), async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!isValidPhone(phone)) return res.status(400).json({ message: 'Invalid phone number' });
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ phone });
    if (existing && existing.name !== 'Temp') {
      return res.status(400).json({ message: 'Phone number already registered. Please login.' });
    }
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: existing?._id } });
      if (existingEmail) return res.status(400).json({ message: 'Email already registered' });
    }
    let user = existing;
    if (user) {
      user.name = name.trim().slice(0, 100);
      if (email) user.email = email;
      user.password = password;
      user.phoneVerified = true;
      await user.save();
    } else {
      user = new User({ name: name.trim().slice(0, 100), phone, email: email || undefined, password, role: 'customer', phoneVerified: true });
      await user.save();
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error?.code === 11000) return res.status(400).json({ message: 'Phone or email already registered' });
    res.status(500).json({ message: 'Signup failed. Please try again.' });
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
    if (!user || user.name === 'Temp' || user.isActive === false) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
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
    // Whitelist: never allow privilege/security fields from the client
    // (role, password, phoneVerified, loyaltyPoints, otp, ...).
    const { name, email, address, language, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).slice(0, 100);
    if (email !== undefined) updates.email = email ? String(email).slice(0, 120) : undefined;
    if (address !== undefined) updates.address = address;
    if (language !== undefined && ['en', 'hi', 'te'].includes(language)) updates.language = language;
    if (avatar !== undefined) updates.avatar = String(avatar).slice(0, 500);
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
