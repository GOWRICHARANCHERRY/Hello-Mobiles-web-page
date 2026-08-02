import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const colorNames = ['Black', 'White', 'Blue', 'Green', 'Gold', 'Silver', 'Purple', 'Gray', 'Pink', 'Navy', 'Teal', 'Red'];
const imeiPrefixes = ['354', '861', '862', '358', '356', '449', '450', '863', '864', '357', '865', '866'];

function randomImei() {
  const prefix = imeiPrefixes[Math.floor(Math.random() * imeiPrefixes.length)];
  let rest = '';
  for (let i = 0; i < 12; i++) rest += Math.floor(Math.random() * 10);
  return prefix + rest;
}

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hello_mobiles');
    console.log('Connected to MongoDB');

    const mobiles = await Product.find({ category: 'Mobiles' });
    console.log(`Found ${mobiles.length} Mobiles products`);

    let fixed = 0;

    for (const product of mobiles) {
      const mainImage = product.images?.[0] || '';
      let totalStock = 0;

      for (const v of (product.variants || [])) {
        for (const c of (v.colors || [])) {
          // Ensure every color has an image
          if (!c.image) c.image = mainImage;

          // If product is out of stock, add stock + IMEI
          if (c.stock === 0 || (c.imei || []).length !== c.stock) {
            const newStock = 3 + Math.floor(Math.random() * 6);
            c.stock = newStock;
            c.imei = [];
            for (let k = 0; k < newStock; k++) {
              c.imei.push({
                number: randomImei(),
                addedAt: randomDate(30),
                status: 'in_stock',
              });
            }
          }
          totalStock += c.stock;
        }
      }

      // If still no variants, create minimal ones
      if ((product.variants || []).length === 0) {
        const stock = 6 + Math.floor(Math.random() * 4);
        product.variants = [{
          ram: '8 GB', storage: '128 GB', price: product.price, mrp: product.mrp,
          sku: `HM-${product.brand.slice(0, 3).toUpperCase()}-8-128`,
          colors: [{
            name: colorNames[Math.floor(Math.random() * colorNames.length)],
            stock,
            image: mainImage,
            imei: Array.from({ length: stock }, () => ({ number: randomImei(), addedAt: randomDate(30), status: 'in_stock' })),
          }],
        }];
        totalStock = stock;
      }

      product.stock = totalStock;
      await product.save();
      fixed++;
      console.log(`[${fixed}/${mobiles.length}] ${product.name} — ${product.variants.length} variants, ${totalStock} stock`);
    }

    console.log('\nDone! All products now have stock + IMEI + images.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

fix();
