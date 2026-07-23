import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  highlightedText: { type: String, default: '' },
  bigText: { type: String, default: '' },
  smallText: { type: String, default: '' },
  bgColor: { type: String, default: '#000000' },
  textColor: { type: String, default: '#FFFFFF' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);
