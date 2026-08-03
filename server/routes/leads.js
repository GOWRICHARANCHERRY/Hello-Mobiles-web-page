import express from 'express';
import Lead from '../models/Lead.js';

const router = express.Router();

router.post('/', async (req, res) => {
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
