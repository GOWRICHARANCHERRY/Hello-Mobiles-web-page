import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from './models/Banner.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const newBanners = [
  {
    type: 'text', image: '', highlightedText: 'WEEKEND FLASH SALE',
    bigText: 'Extra 10% Off This Weekend',
    smallText: 'Automatic discount at checkout on mobiles & electronics',
    buttonText: 'Shop Now', link: '/products',
    bgColor: '#7f1d1d', textColor: '#ffffff', order: 4,
  },
  {
    type: 'text', image: '', highlightedText: 'FREE DELIVERY',
    bigText: 'Free Shipping on Orders Over ₹999',
    smallText: 'Delivered to your doorstep anywhere in India in 2-4 days',
    buttonText: 'Shop Now', link: '/products',
    bgColor: '#0c4a6e', textColor: '#ffffff', order: 11,
  },
  {
    type: 'text', image: '', highlightedText: 'EASY EMI',
    bigText: 'EMI from Just ₹999/month',
    smallText: 'No Cost EMI on 6, 9, or 12-month plans. No hidden charges',
    buttonText: 'View Products', link: '/products',
    bgColor: '#581c87', textColor: '#ffffff', order: 13,
  },
  {
    type: 'text', image: '', highlightedText: 'COMBO DEALS',
    bigText: 'Phone + Cover + Charger Combos',
    smallText: 'Save up to ₹1,500 on ready-made combos for top brands',
    buttonText: 'Explore Combos', link: '/products',
    bgColor: '#374151', textColor: '#ffffff', order: 15,
  },
];

await Banner.insertMany(newBanners);
console.log(`Added ${newBanners.length} text banners`);

const sequence = [
  ['Apple iPhone 15', 1],
  ['Up to 40% OFF', 2],
  ['Nothing Phone (2a) Plus', 3],
  ['Extra 10% Off This Weekend', 4],
  ['Samsung 55" Crystal 4K TV', 5],
  ['No Cost EMI on Everything', 6],
  ['MacBook Air M2', 7],
  ['Up to ₹3,000 Extra on Exchange', 8],
  ['PlayStation 5 Slim', 9],
  ['Headphones & Earbuds from ₹1,499', 10],
  ['Free Shipping on Orders Over ₹999', 11],
  ['5% Off for Students', 12],
  ['EMI from Just ₹999/month', 13],
  ['Free Accessories on Every Phone', 14],
  ['Phone + Cover + Charger Combos', 15],
];

for (const [bigText, order] of sequence) {
  await Banner.updateOne({ bigText }, { order });
}

const all = await Banner.find().sort('order').select('type bigText order');
all.forEach(b => console.log(`  [${b.order}] ${b.type}: ${b.bigText}`));
await mongoose.disconnect();
