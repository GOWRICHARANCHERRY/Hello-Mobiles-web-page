import express from 'express';
import Coupon from '../models/Coupon.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', auth, async (req, res) => {
  try {
    const { code, subtotal, items } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });
    if (!subtotal || subtotal <= 0) return res.status(400).json({ message: 'Invalid order amount' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon || !coupon.isActive) return res.status(404).json({ message: 'Invalid coupon code' });

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) return res.status(400).json({ message: 'Coupon is not active yet' });
    if (coupon.validTo && now > coupon.validTo) return res.status(400).json({ message: 'Coupon has expired' });

    let eligibleSubtotal = subtotal;
    if (coupon.appliesTo === 'selected') {
      const allowed = coupon.applicableProductIds.map(id => String(id));
      const cartItems = Array.isArray(items) ? items : [];
      eligibleSubtotal = cartItems
        .filter(i => allowed.includes(String(i.product)))
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      if (eligibleSubtotal <= 0) return res.status(400).json({ message: 'This coupon is not valid for the products in your cart' });
    }
    if (eligibleSubtotal < coupon.minOrder) return res.status(400).json({ message: `Minimum order of ₹${coupon.minOrder.toLocaleString()} required` });
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ message: 'Coupon usage limit reached' });

    let discount = coupon.discountType === 'percent'
      ? Math.round((eligibleSubtotal * coupon.value) / 100)
      : Math.min(coupon.value, eligibleSubtotal);
    if (coupon.discountType === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.round(discount);

    res.json({ code: coupon.code, discountType: coupon.discountType, value: coupon.value, discount, minOrder: coupon.minOrder, appliesTo: coupon.appliesTo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
