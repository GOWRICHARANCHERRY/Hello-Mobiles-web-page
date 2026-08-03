import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value: { type: Number, required: true },
  minOrder: { type: Number, default: 0 },
  maxDiscount: Number,
  validFrom: Date,
  validTo: Date,
  maxUses: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  appliesTo: { type: String, enum: ['all', 'selected'], default: 'all' },
  applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
