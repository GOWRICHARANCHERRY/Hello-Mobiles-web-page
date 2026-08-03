import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  type: { type: String, enum: ['hero', 'text'], default: 'hero' },
  image: { type: String, default: '' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  highlightedText: { type: String, default: '' },
  bigText: { type: String, default: '' },
  smallText: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  link: { type: String, default: '' },
  bgColor: { type: String, default: '#000000' },
  textColor: { type: String, default: '#FFFFFF' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Banner', bannerSchema);
