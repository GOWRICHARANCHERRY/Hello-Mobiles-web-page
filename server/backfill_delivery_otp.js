import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.render'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
console.log('Connected to', env.MONGODB_URI.split('@')[1]);
const db = mongoose.connection.db;

function generateOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
const TTL = 48 * 60 * 60 * 1000;

// Find active orders missing (or with expired) OTP
const missing = await db.collection('orders').find({
  deliveryStatus: { $in: ['assigned', 'out_for_delivery'] },
  $or: [
    { deliveryOtp: { $exists: false } },
    { deliveryOtp: null },
    { deliveryOtp: { $exists: true, $ne: null, $type: 'string', $not: /^[0-9]{6}$/ } },
    { deliveryOtpExpiresAt: { $lt: new Date() } },
  ],
}).project({ orderNumber: 1 }).toArray();

console.log('Backfilling OTP for', missing.length, 'order(s):', missing.map(o => o.orderNumber).join(', ') || '(none)');

for (const o of missing) {
  const otp = generateOtp();
  const r = await db.collection('orders').updateOne(
    { _id: o._id },
    { $set: { deliveryOtp: otp, deliveryOtpExpiresAt: new Date(Date.now() + TTL) } }
  );
  console.log(`  ${o.orderNumber}: otp=${otp} modified=${r.modifiedCount}`);
}

// Report
const active = await db.collection('orders').find({ deliveryStatus: { $in: ['assigned', 'out_for_delivery'] } })
  .project({ orderNumber: 1, deliveryStatus: 1, deliveryOtp: 1, deliveryOtpExpiresAt: 1 }).toArray();
for (const o of active) console.log(`  ACTIVE ${o.orderNumber}: ${o.deliveryStatus} otp=${o.deliveryOtp} expires=${o.deliveryOtpExpiresAt?.toISOString()}`);

await mongoose.disconnect();
console.log('Done');
