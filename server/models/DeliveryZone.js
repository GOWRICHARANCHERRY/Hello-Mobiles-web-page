import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  centerLat: { type: Number, required: true },
  centerLng: { type: Number, required: true },
  radiusKm: { type: Number, required: true, min: 1 },
  isActive: { type: Boolean, default: true },
});

const deliveryZoneSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    zones: [zoneSchema],
  },
  { timestamps: true }
);

export default mongoose.model('DeliveryZone', deliveryZoneSchema);
