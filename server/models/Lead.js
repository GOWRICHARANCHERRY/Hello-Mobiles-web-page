import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  message: { type: String, default: '' },
  source: { type: String, default: 'newsletter' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);
