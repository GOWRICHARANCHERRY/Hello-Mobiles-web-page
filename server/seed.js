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
    specifications: { ram: '8 GB', storage: '256 GB', screenSize: '6.7 inch', color: 'Natural Titanium', battery: '4441 mAh', processor: 'A17 Pro', camera: '48 MP', os: 'iOS 17', weight: '221 g', warranty: '1 Year' },
    stock: 25, isFeatured: true, isNewArrival: true, emiAvailable: true, emiStarting: 13325, exchangeAvailable: true,
    images: ['https://store.storeimages.cdn-apple.com/49829/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=400&hei=400'],
    ratings: 4.8, reviewCount: 245,
  },
  {
    name: 'iPhone 15', brand: 'Apple', category: 'Mobiles', price: 79900, mrp: 89900,
    description: 'Dynamic Island. 48MP camera. USB-C. Colorful new design.',
    specifications: { ram: '6 GB', storage: '128 GB', screenSize: '6.1 inch', color: 'Blue', battery: '3349 mAh', processor: 'A16 Bionic', camera: '48 MP', os: 'iOS 17', weight: '171 g', warranty: '1 Year' },
    stock: 40, isFeatured: true, emiAvailable: true, emiStarting: 6658, exchangeAvailable: true,
    images: ['https://store.storeimages.cdn-apple.com/49829/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=400&hei=400'],
    ratings: 4.6, reviewCount: 189,
  },
  {
    name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Mobiles', price: 129999, mrp: 149999,
    description: 'Galaxy AI is here. Search like never before. Circle to Search.',
    specifications: { ram: '12 GB', storage: '256 GB', screenSize: '6.8 inch', color: 'Titanium Gray', battery: '5000 mAh', processor: 'Snapdragon 8 Gen 3', camera: '200 MP', os: 'Android 14', weight: '232 g', warranty: '1 Year' },
    stock: 30, isFeatured: true, isNewArrival: true, isOnOffer: true, offerLabel: 'Galaxy AI Special', emiAvailable: true, emiStarting: 10833, exchangeAvailable: true,
    images: ['https://image-us.samsung.com/us/smartphones/galaxy-s24-ultra/all-galaxy-s24-ultra-702.jpg'],
    ratings: 4.7, reviewCount: 156,
  },
  {
    name: 'Samsung Galaxy S24+', brand: 'Samsung', category: 'Mobiles', price: 84999, mrp: 99999,
    description: 'Galaxy AI-powered smartphone with stunning display.',
    specifications: { ram: '12 GB', storage: '256 GB', screenSize: '6.7 inch', color: 'Cobalt Violet', battery: '4900 mAh', processor: 'Exynos 2400', camera: '50 MP', os: 'Android 14', weight: '196 g', warranty: '1 Year' },
    stock: 35, isOnOffer: true, offerLabel: 'Flat ₹15,000 Off', emiAvailable: true, emiStarting: 7083, exchangeAvailable: true,
    ratings: 4.5, reviewCount: 98,
  },
  {
    name: 'Vivo X100 Pro', brand: 'Vivo', category: 'Mobiles', price: 89999, mrp: 99999,
    description: 'ZEISS APO Telephoto. Dimensity 9300. V3 Imaging Chip.',
    specifications: { ram: '16 GB', storage: '512 GB', screenSize: '6.78 inch', color: 'Asteroid Black', battery: '5400 mAh', processor: 'Dimensity 9300', camera: '50 MP ZEISS', os: 'Android 14', weight: '225 g', warranty: '1 Year' },
    stock: 20, isNewArrival: true, emiAvailable: true, emiStarting: 7500, exchangeAvailable: true,
    images: [],
    ratings: 4.4, reviewCount: 67,
  },
  {
    name: 'Oppo Reno 11 Pro', brand: 'Oppo', category: 'Mobiles', price: 39999, mrp: 44999,
    description: 'Portrait Expert. Sony IMX890 sensor. 50MP telephoto.',
    specifications: { ram: '12 GB', storage: '256 GB', screenSize: '6.7 inch', color: 'Rock Grey', battery: '4600 mAh', processor: 'Dimensity 8200', camera: '50 MP', os: 'Android 14', weight: '181 g', warranty: '1 Year' },
    stock: 28, emiAvailable: true, emiStarting: 3333, exchangeAvailable: true,
    ratings: 4.3, reviewCount: 45,
  },
  {
    name: 'Realme GT 5 Pro', brand: 'Realme', category: 'Mobiles', price: 32999, mrp: 37999,
    description: 'Flagship Killer. Snapdragon 8 Gen 3. 50MP Sony IMX890.',
    specifications: { ram: '12 GB', storage: '256 GB', screenSize: '6.78 inch', color: 'Bright Red', battery: '5400 mAh', processor: 'Snapdragon 8 Gen 3', camera: '50 MP', os: 'Android 14', weight: '218 g', warranty: '1 Year' },
    stock: 22, isNewArrival: true, emiAvailable: true, emiStarting: 2750, exchangeAvailable: true,
    ratings: 4.4, reviewCount: 89,
  },
  {
    name: 'Redmi Note 13 Pro', brand: 'Redmi', category: 'Mobiles', price: 23999, mrp: 27999,
    description: '200MP camera. Snapdragon 7s Gen 2. 120Hz AMOLED.',
    specifications: { ram: '8 GB', storage: '256 GB', screenSize: '6.67 inch', color: 'Fusion Purple', battery: '5100 mAh', processor: 'Snapdragon 7s Gen 2', camera: '200 MP', os: 'Android 13', weight: '187 g', warranty: '1 Year' },
    stock: 45, isOnOffer: true, offerLabel: 'Best Seller', emiAvailable: true, emiStarting: 2000, exchangeAvailable: true,
    ratings: 4.3, reviewCount: 312,
  },
  {
    name: 'Samsung 55" Crystal 4K Smart TV', brand: 'Samsung', category: 'TVs', price: 44990, mrp: 59900,
    description: 'Crystal 4K UHD Smart TV with PurColor and Crystal Processor 4K.',
    specifications: { screenSize: '55 inch', color: 'Black', os: 'Tizen', warranty: '1 Year', other: { resolution: '4K UHD', hdr: 'HDR10+', smartTV: 'Yes' } },
    stock: 12, isFeatured: true, emiAvailable: true, emiStarting: 3749, exchangeAvailable: true,
    images: [],
    ratings: 4.5, reviewCount: 178,
  },
  {
    name: 'Sony 65" BRAVIA XR 4K OLED TV', brand: 'Sony', category: 'TVs', price: 199900, mrp: 249900,
    description: 'Cognitive Processor XR. OLED. Dolby Vision & Atmos.',
    specifications: { screenSize: '65 inch', color: 'Black', os: 'Google TV', warranty: '1 Year', other: { resolution: '4K OLED', hdr: 'Dolby Vision', smartTV: 'Yes' } },
    stock: 5, emiAvailable: true, emiStarting: 16658, exchangeAvailable: true,
    ratings: 4.8, reviewCount: 56,
  },
  {
    name: 'Apple AirPods Pro 2nd Gen', brand: 'Apple', category: 'Earbuds', price: 24900, mrp: 27900,
    description: 'Active Noise Cancellation. Adaptive Transparency. Personalized Spatial Audio.',
    specifications: { battery: '6 hrs (30 hrs with case)', color: 'White', other: { anc: 'Yes', waterproof: 'IP54' } },
    stock: 50, isFeatured: true, isOnOffer: true, offerLabel: '₹3,000 Off', emiAvailable: true, emiStarting: 2075, exchangeAvailable: false,
    ratings: 4.7, reviewCount: 445,
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic', brand: 'Samsung', category: 'Smart Watches', price: 37999, mrp: 42999,
    description: 'Iconic rotating bezel. Advanced health monitoring. Sapphire crystal.',
    specifications: { color: 'Black', other: { display: '1.47" Super AMOLED', waterproof: '5ATM', battery: '425 mAh' } },
    stock: 18, emiAvailable: true, emiStarting: 3167, exchangeAvailable: false,
    ratings: 4.5, reviewCount: 89,
  },
  {
    name: 'HP Pavilion 15 Laptop', brand: 'HP', category: 'Laptops', price: 64999, mrp: 74999,
    description: 'Intel Core i7 13th Gen. 16GB RAM. 512GB SSD. 15.6" FHD.',
    specifications: { ram: '16 GB', storage: '512 GB', screenSize: '15.6 inch', color: 'Natural Silver', processor: 'Intel Core i7-1355U', os: 'Windows 11', battery: '41 Wh', warranty: '1 Year', other: { graphics: 'Intel Iris Xe' } },
    stock: 10, emiAvailable: true, emiStarting: 5417, exchangeAvailable: true,
    ratings: 4.4, reviewCount: 123,
  },
  {
    name: 'LG 1.5 Ton 5 Star Inverter AC', brand: 'LG', category: 'Home Appliances', price: 48990, mrp: 62990,
    description: 'Dual Inverter Compressor. AI Convertible 6-in-1. Low Noise.',
    specifications: { color: 'White', other: { capacity: '1.5 Ton', rating: '5 Star', type: 'Split AC', refrigerant: 'R32' } },
    stock: 8, isOnOffer: true, offerLabel: 'Monsoon Special', emiAvailable: true, emiStarting: 4083, exchangeAvailable: false,
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
