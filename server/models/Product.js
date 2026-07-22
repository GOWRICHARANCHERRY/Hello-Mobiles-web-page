import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Mobiles', 'TVs', 'Smart Watches', 'Earbuds', 'Laptops', 'Home Appliances', 'Accessories'],
  },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  description: String,
  specifications: {
    ram: String,
    storage: String,
    screenSize: String,
    color: String,
    battery: String,
    processor: String,
    camera: String,
    os: String,
    weight: String,
    warranty: String,
    other: mongoose.Schema.Types.Mixed,
  },
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
