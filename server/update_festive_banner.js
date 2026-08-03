import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from './models/Banner.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const res = await Banner.updateOne(
  { bigText: 'Festival Sale Bonanza' },
  {
    $set: {
      type: 'text',
      highlightedText: 'Independence Day Special',
      bigText: 'Up to 40% OFF',
      smallText: 'Extra savings with coupons + No Cost EMI on mobiles, electronics & appliances',
      buttonText: 'Shop Offers',
      link: '/products',
    },
  }
);
console.log('Updated:', res.modifiedCount);

const all = await Banner.find().sort('order').select('type bigText highlightedText buttonText link order');
all.forEach(b => console.log(`  [${b.order}] ${b.type}: ${b.highlightedText ? b.highlightedText + ' — ' : ''}${b.bigText}${b.buttonText ? ` (btn: ${b.buttonText} → ${b.link})` : ''}`));
await mongoose.disconnect();
