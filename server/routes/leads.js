import express from 'express';
import rateLimit from 'express-rate-limit';
import Lead from '../models/Lead.js';

const router = express.Router();

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many submissions, please try again later.' },
});

router.post('/', leadLimiter, async (req, res) => {
  try {
    const { name, email, phone, message, source } = req.body;
    if (!email && !phone) return res.status(400).json({ message: 'Email or phone is required' });
    const lead = await Lead.create({ name, email, phone, message, source: source || 'newsletter' });
    res.status(201).json({ message: 'Thank you! We will get back to you soon.', id: lead._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
