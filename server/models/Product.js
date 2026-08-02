import mongoose from 'mongoose';

const imeiEntrySchema = new mongoose.Schema({
  number: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['in_stock', 'sold', 'returned'], default: 'in_stock' },
  soldAt: Date,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderNumber: String,
  soldTo: String,
  soldPrice: Number,
}, { _id: true });

const colorStockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, default: 0 },
  image: { type: String, default: '' },
  imei: { type: [imeiEntrySchema], default: [] },
}, { _id: true });

const variantSchema = new mongoose.Schema({
  ram: { type: String, default: '' },
  storage: { type: String, default: '' },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  sku: { type: String, default: '' },
  colors: { type: [colorStockSchema], default: [] },
}, { _id: true });

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
  variants: { type: [variantSchema], default: [] },
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

export default mongoose.model('Product', productSchema);
