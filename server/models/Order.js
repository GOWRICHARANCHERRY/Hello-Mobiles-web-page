import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 },
  image: String,
  variant: {
    variantId: String,
    color: String,
    ram: String,
    storage: String,
    sku: String,
  },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    phone: String,
    altPhone: String,
    street: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    mapLabel: String,
  },
  paymentMethod: { type: String, enum: ['online', 'cod', 'store_pickup'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  orderStatus: {
    type: String,
    enum: ['confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed',
  },
  subtotal: Number,
  deliveryCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
  total: Number,
  cancelReason: String,
  cancelledAt: Date,
  returnRequested: { type: Boolean, default: false },
  returnReason: String,
  returnStatus: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
  emiDetails: {
    tenure: Number,
    monthlyEmi: Number,
    downPayment: { type: Number, default: 0 },
  },
  exchangeDetails: {
    oldPhoneModel: String,
    exchangeValue: { type: Number, default: 0 },
  },
  trackingId: String,
  assignedDelivery: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryStatus: {
    type: String,
    enum: ['unassigned', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'unassigned',
  },
  deliveredAt: Date,
  invoiceUrl: String,
  notes: String,
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `HM${1001 + count}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
