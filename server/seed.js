import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';

dotenv.config();

const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max', brand: 'Apple', category: 'Mobiles', price: 159900, mrp: 179900,
    description: 'The most powerful iPhone ever with A17 Pro chip, titanium design, and 48MP camera system.',
    specifications: { RAM: '8 GB', Storage: '256 GB', 'Screen Size': '6.7 inch', Color: 'Natural Titanium', Battery: '4441 mAh', Processor: 'A17 Pro', Camera: '48 MP', OS: 'iOS 17', Weight: '221 g', Warranty: '1 Year' },
    stock: 25, isFeatured: true, isNewArrival: true, emiAvailable: true, emiStarting: 13325, exchangeAvailable: true,
    images: ['https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg'],
    ratings: 4.8, reviewCount: 245,
  },
  {
    name: 'iPhone 15', brand: 'Apple', category: 'Mobiles', price: 79900, mrp: 89900,
    description: 'Dynamic Island. 48MP camera. USB-C. Colorful new design.',
    specifications: { RAM: '6 GB', Storage: '128 GB', 'Screen Size': '6.1 inch', Color: 'Blue', Battery: '3349 mAh', Processor: 'A16 Bionic', Camera: '48 MP', OS: 'iOS 17', Weight: '171 g', Warranty: '1 Year' },
    stock: 40, isFeatured: true, emiAvailable: true, emiStarting: 6658, exchangeAvailable: true,
    images: ['https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg'],
    ratings: 4.6, reviewCount: 189,
  },
  {
    name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Mobiles', price: 129999, mrp: 149999,
    description: 'Galaxy AI is here. Search like never before. Circle to Search.',
    specifications: { RAM: '12 GB', Storage: '256 GB', 'Screen Size': '6.8 inch', Color: 'Titanium Gray', Battery: '5000 mAh', Processor: 'Snapdragon 8 Gen 3', Camera: '200 MP', OS: 'Android 14', Weight: '232 g', Warranty: '1 Year' },
    stock: 30, isFeatured: true, isNewArrival: true, isOnOffer: true, offerLabel: 'Galaxy AI Special', emiAvailable: true, emiStarting: 10833, exchangeAvailable: true,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6570/6570299_sd.jpg'],
    ratings: 4.7, reviewCount: 156,
  },
  {
    name: 'Samsung Galaxy S24+', brand: 'Samsung', category: 'Mobiles', price: 84999, mrp: 99999,
    description: 'Galaxy AI-powered smartphone with stunning display.',
    specifications: { RAM: '12 GB', Storage: '256 GB', 'Screen Size': '6.7 inch', Color: 'Cobalt Violet', Battery: '4900 mAh', Processor: 'Exynos 2400', Camera: '50 MP', OS: 'Android 14', Weight: '196 g', Warranty: '1 Year' },
    stock: 35, isOnOffer: true, offerLabel: 'Flat ₹15,000 Off', emiAvailable: true, emiStarting: 7083, exchangeAvailable: true,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6570/6570303_sd.jpg'],
    ratings: 4.5, reviewCount: 98,
  },
  {
    name: 'Vivo X100 Pro', brand: 'Vivo', category: 'Mobiles', price: 89999, mrp: 99999,
    description: 'ZEISS APO Telephoto. Dimensity 9300. V3 Imaging Chip.',
    specifications: { RAM: '16 GB', Storage: '512 GB', 'Screen Size': '6.78 inch', Color: 'Asteroid Black', Battery: '5400 mAh', Processor: 'Dimensity 9300', Camera: '50 MP ZEISS', OS: 'Android 14', Weight: '225 g', Warranty: '1 Year' },
    stock: 20, isNewArrival: true, emiAvailable: true, emiStarting: 7500, exchangeAvailable: true,
    images: ['https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg'],
    ratings: 4.4, reviewCount: 67,
  },
  {
    name: 'Oppo Reno 11 Pro', brand: 'Oppo', category: 'Mobiles', price: 39999, mrp: 44999,
    description: 'Portrait Expert. Sony IMX890 sensor. 50MP telephoto.',
    specifications: { RAM: '12 GB', Storage: '256 GB', 'Screen Size': '6.7 inch', Color: 'Rock Grey', Battery: '4600 mAh', Processor: 'Dimensity 8200', Camera: '50 MP', OS: 'Android 14', Weight: '181 g', Warranty: '1 Year' },
    stock: 28, emiAvailable: true, emiStarting: 3333, exchangeAvailable: true,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6534/6534285_sd.jpg'],
    ratings: 4.3, reviewCount: 45,
  },
  {
    name: 'Realme GT 5 Pro', brand: 'Realme', category: 'Mobiles', price: 32999, mrp: 37999,
    description: 'Flagship Killer. Snapdragon 8 Gen 3. 50MP Sony IMX890.',
    specifications: { RAM: '12 GB', Storage: '256 GB', 'Screen Size': '6.78 inch', Color: 'Bright Red', Battery: '5400 mAh', Processor: 'Snapdragon 8 Gen 3', Camera: '50 MP', OS: 'Android 14', Weight: '218 g', Warranty: '1 Year' },
    stock: 22, isNewArrival: true, emiAvailable: true, emiStarting: 2750, exchangeAvailable: true,
    images: ['https://fdn2.gsmarena.com/vv/bigpic/realme-gt5-pro.jpg'],
    ratings: 4.4, reviewCount: 89,
  },
  {
    name: 'Redmi Note 13 Pro', brand: 'Redmi', category: 'Mobiles', price: 23999, mrp: 27999,
    description: '200MP camera. Snapdragon 7s Gen 2. 120Hz AMOLED.',
    specifications: { RAM: '8 GB', Storage: '256 GB', 'Screen Size': '6.67 inch', Color: 'Fusion Purple', Battery: '5100 mAh', Processor: 'Snapdragon 7s Gen 2', Camera: '200 MP', OS: 'Android 13', Weight: '187 g', Warranty: '1 Year' },
    stock: 45, isOnOffer: true, offerLabel: 'Best Seller', emiAvailable: true, emiStarting: 2000, exchangeAvailable: true,
    images: ['https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg'],
    ratings: 4.3, reviewCount: 312,
  },
  {
    name: 'Samsung 55" Crystal 4K Smart TV', brand: 'Samsung', category: 'TVs', price: 44990, mrp: 59900,
    description: 'Crystal 4K UHD Smart TV with PurColor and Crystal Processor 4K.',
    specifications: { 'Screen Size': '55 inch', Color: 'Black', OS: 'Tizen', Warranty: '1 Year', Resolution: '4K UHD', HDR: 'HDR10+', 'Smart TV': 'Yes' },
    stock: 12, isFeatured: true, emiAvailable: true, emiStarting: 3749, exchangeAvailable: true,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6538/6538483_sd.jpg'],
    ratings: 4.5, reviewCount: 178,
  },
  {
    name: 'Sony 65" BRAVIA XR 4K OLED TV', brand: 'Sony', category: 'TVs', price: 199900, mrp: 249900,
    description: 'Cognitive Processor XR. OLED. Dolby Vision & Atmos.',
    specifications: { 'Screen Size': '65 inch', Color: 'Black', OS: 'Google TV', Warranty: '1 Year', Resolution: '4K OLED', HDR: 'Dolby Vision', 'Smart TV': 'Yes' },
    stock: 5, emiAvailable: true, emiStarting: 16658, exchangeAvailable: true,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6543/6543908_sd.jpg'],
    ratings: 4.8, reviewCount: 56,
  },
  {
    name: 'Apple AirPods Pro 2nd Gen', brand: 'Apple', category: 'Earbuds', price: 24900, mrp: 27900,
    description: 'Active Noise Cancellation. Adaptive Transparency. Personalized Spatial Audio.',
    specifications: { Battery: '6 hrs (30 hrs with case)', Color: 'White', ANC: 'Yes', Waterproof: 'IP54' },
    stock: 50, isFeatured: true, isOnOffer: true, offerLabel: '₹3,000 Off', emiAvailable: true, emiStarting: 2075, exchangeAvailable: false,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4900/4900964_sd.jpg'],
    ratings: 4.7, reviewCount: 445,
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic', brand: 'Samsung', category: 'Smart Watches', price: 37999, mrp: 42999,
    description: 'Iconic rotating bezel. Advanced health monitoring. Sapphire crystal.',
    specifications: { Color: 'Black', Display: '1.47" Super AMOLED', Waterproof: '5ATM', Battery: '425 mAh' },
    stock: 18, emiAvailable: true, emiStarting: 3167, exchangeAvailable: false,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6546/6546695cv11d.jpg'],
    ratings: 4.5, reviewCount: 89,
  },
  {
    name: 'HP Pavilion 15 Laptop', brand: 'HP', category: 'Laptops', price: 64999, mrp: 74999,
    description: 'Intel Core i7 13th Gen. 16GB RAM. 512GB SSD. 15.6" FHD.',
    specifications: { RAM: '16 GB', Storage: '512 GB', 'Screen Size': '15.6 inch', Color: 'Natural Silver', Processor: 'Intel Core i7-1355U', OS: 'Windows 11', Battery: '41 Wh', Warranty: '1 Year', Graphics: 'Intel Iris Xe' },
    stock: 10, emiAvailable: true, emiStarting: 5417, exchangeAvailable: true,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6505/6505061_sd.jpg'],
    ratings: 4.4, reviewCount: 123,
  },
  {
    name: 'LG 1.5 Ton 5 Star Inverter AC', brand: 'LG', category: 'Home Appliances', price: 48990, mrp: 62990,
    description: 'Dual Inverter Compressor. AI Convertible 6-in-1. Low Noise.',
    specifications: { Color: 'White', Capacity: '1.5 Ton', Rating: '5 Star', Type: 'Split AC', Refrigerant: 'R32' },
    stock: 8, isOnOffer: true, offerLabel: 'Monsoon Special', emiAvailable: true, emiStarting: 4083, exchangeAvailable: false,
    images: ['https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6569/6569664_sd.jpg'],
    ratings: 4.6, reviewCount: 201,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Product.deleteMany({});

    const admin = await User.create({
      name: 'Admin', phone: '9999999999', email: 'admin@hellomobiles.com',
      password: 'admin123', role: 'admin',
    });

    const employee = await User.create({
      name: 'Rahul Sharma', phone: '8888888888', email: 'rahul@hellomobiles.com',
      password: 'emp123', role: 'employee',
    });

    const customer = await User.create({
      name: 'Priya Patel', phone: '7777777777', email: 'priya@email.com',
      password: 'cust123', role: 'customer',
      address: { street: '45 MG Road', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
    });

    await Product.insertMany(sampleProducts);

    console.log('Seed data created successfully!');
    console.log('Admin: 9999999999 / admin123');
    console.log('Employee: 8888888888 / emp123');
    console.log('Customer: 7777777777 / cust123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
