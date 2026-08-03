import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from './models/Banner.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const newBanners = [
  {
    type: 'text', image: '', highlightedText: 'EXCHANGE OFFER',
    bigText: 'Up to ₹3,000 Extra on Exchange',
    smallText: 'Trade in any old phone and boost your savings instantly',
    bgColor: '#78350f', textColor: '#ffffff', order: 7,
  },
  {
    type: 'text', image: '', highlightedText: 'STUDENT SAVERS',
    bigText: '5% Off for Students',
    smallText: 'Verify with your college ID at checkout and save on any laptop or tablet',
    bgColor: '#312e81', textColor: '#ffffff', order: 10,
  },
  {
    type: 'text', image: '', highlightedText: 'GIFT WITH PURCHASE',
    bigText: 'Free Accessories on Every Phone',
    smallText: 'Get a free tempered glass + cover with every mobile purchase',
    bgColor: '#3f6212', textColor: '#ffffff', order: 11,
  },
];

await Banner.insertMany(newBanners);
console.log(`Added ${newBanners.length} text banners`);

const sequence = [
  ['Apple iPhone 15', 1],
  ['Festival Sale Bonanza', 2],
  ['Nothing Phone (2a) Plus', 3],
  ['Samsung 55" Crystal 4K TV', 4],
  ['No Cost EMI on Everything', 5],
  ['MacBook Air M2', 6],
  ['Up to ₹3,000 Extra on Exchange', 7],
  ['PlayStation 5 Slim', 8],
  ['Headphones & Earbuds from ₹1,499', 9],
  ['5% Off for Students', 10],
  ['Free Accessories on Every Phone', 11],
];

for (const [bigText, order] of sequence) {
  await Banner.updateOne({ bigText }, { order });
}

const all = await Banner.find().sort('order').select('type bigText order');
all.forEach(b => console.log(`  [${b.order}] ${b.type}: ${b.bigText}`));
await mongoose.disconnect();
