import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from './models/Banner.js';

dotenv.config();

const U = id => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

const TV = '6a65e43b1cf325bd4264cbee';
const MACBOOK = '6a65e43b1cf325bd4264cbf2';
const PS5 = '6a65e43b1cf325bd4264cc16';

const banners = [
  {
    type: 'hero',
    image: U('photo-1593359677879-a4bb92f829d1'),
    product: TV,
    highlightedText: 'BIG SCREEN SALE',
    bigText: 'Samsung 55" Crystal 4K TV',
    smallText: 'Cinematic viewing with Tizen smart TV. Just ₹46,990 with No Cost EMI',
    bgColor: '#052e16',
    textColor: '#ffffff',
    order: 4,
  },
  {
    type: 'hero',
    image: U('photo-1496181133206-80ce9b88a853'),
    product: MACBOOK,
    highlightedText: 'PRODUCTIVITY PICK',
    bigText: 'MacBook Air M2',
    smallText: 'All-day battery. Liquid Retina display. From ₹99,900',
    bgColor: '#1e1b4b',
    textColor: '#ffffff',
    order: 5,
  },
  {
    type: 'text',
    image: '',
    highlightedText: 'EASY PAYMENTS',
    bigText: 'No Cost EMI on Everything',
    smallText: 'Split any order into 3–12 months. 0% interest on Mobiles, Electronics & more',
    bgColor: '#0e7490',
    textColor: '#ffffff',
    order: 6,
  },
  {
    type: 'hero',
    image: U('photo-1486401899868-0e435ed85128'),
    product: PS5,
    highlightedText: 'GAMING ZONE',
    bigText: 'PlayStation 5 Slim',
    smallText: 'Play Has No Limits. 1TB console at ₹54,990',
    bgColor: '#1f2937',
    textColor: '#ffffff',
    order: 7,
  },
  {
    type: 'text',
    image: '',
    highlightedText: 'AUDIO WEEK',
    bigText: 'Headphones & Earbuds from ₹1,499',
    smallText: 'boAt, Sony, Samsung, JBL & more — top brands at the lowest prices',
    bgColor: '#831843',
    textColor: '#ffffff',
    order: 8,
  },
];

await mongoose.connect(process.env.MONGODB_URI);
await Banner.insertMany(banners);
console.log(`Added ${banners.length} banners (orders 4-8)`);
const all = await Banner.find().sort('order').select('type bigText order');
all.forEach(b => console.log(`  [${b.order}] ${b.type}: ${b.bigText}`));
await mongoose.disconnect();
