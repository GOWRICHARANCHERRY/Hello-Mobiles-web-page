import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  description: String,
  specifications: { type: Map, of: String, default: {} },
  images: [String],
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  emiAvailable: { type: Boolean, default: true },
  emiStarting: Number,
  exchangeAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isOnOffer: { type: Boolean, default: false },
  offerLabel: String,
  ratings: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text', category: 'text' });

export default mongoose.model('Product', productSchema);
