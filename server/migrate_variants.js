import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const ramOptions = ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'];
const storageOptions = ['64 GB', '128 GB', '256 GB', '512 GB'];
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

function getVariantCombos(existingRam, existingStorage) {
  const combos = [];
  const baseRamIdx = ramOptions.indexOf(existingRam);
  const baseStorageIdx = storageOptions.indexOf(existingStorage);
  const startRam = Math.max(0, (baseRamIdx >= 0 ? baseRamIdx : 1) - 1);
  const startStorage = Math.max(0, (baseStorageIdx >= 0 ? baseStorageIdx : 1) - 1);
  const numVariants = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numVariants && (startRam + i) < ramOptions.length; i++) {
    for (let j = 0; j < 2 && (startStorage + j) < storageOptions.length; j++) {
      combos.push({ ram: ramOptions[startRam + i], storage: storageOptions[startStorage + j] });
    }
    if (combos.length >= numVariants) break;
  }
  return combos.slice(0, numVariants);
}

function getPriceOffset(ramStr, storageStr) {
  let offset = 0;
  const r = parseInt(ramStr) || 4;
  const s = parseInt(storageStr) || 64;
  offset += (r - 4) * 1500;
  offset += (s - 64) * 20;
  if (s >= 256) offset += 3000;
  if (s >= 512) offset += 5000;
  return offset;
}

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hello_mobiles');
    console.log('Connected to MongoDB');

    const mobiles = await Product.find({ category: 'Mobiles' });
    console.log(`Found ${mobiles.length} Mobiles products`);

    let updated = 0;
    let outOfStock = 0;

    for (const product of mobiles) {
      const existingRam = product.specifications?.get?.('RAM') || product.specifications?.RAM || '8 GB';
      const existingStorage = product.specifications?.get?.('Storage') || product.specifications?.Storage || '128 GB';
      const basePrice = product.price;
      const baseMrp = product.mrp;

      const isOutOfStock = Math.random() < 0.15;
      if (isOutOfStock) outOfStock++;

      const combos = getVariantCombos(existingRam, existingStorage);
      const variants = combos.map((combo, vi) => {
        const priceOffset = getPriceOffset(combo.ram, combo.storage);
        const vPrice = basePrice + priceOffset;
        const vMrp = baseMrp + priceOffset + Math.floor(Math.random() * 3000);
        const brandCode = product.brand.slice(0, 3).toUpperCase();
        const sku = `HM-${brandCode}-${combo.ram.split(' ')[0]}-${combo.storage.split(' ')[0]}`;
        const numColors = 1 + Math.floor(Math.random() * 3);
        const shuffledColors = [...colorNames].sort(() => Math.random() - 0.5).slice(0, numColors);

        const colors = shuffledColors.map(colorName => {
          if (isOutOfStock) {
            return { name: colorName, stock: 0, image: product.images?.[0] || '', imei: [] };
          }
          const stock = 3 + Math.floor(Math.random() * 8);
          const imeis = [];
          for (let k = 0; k < stock; k++) {
            imeis.push({
              number: randomImei(),
              addedAt: randomDate(30),
              status: 'in_stock',
            });
          }
          return { name: colorName, stock, image: product.images?.[0] || '', imei: imeis };
        });

        return { ram: combo.ram, storage: combo.storage, price: vPrice, mrp: vMrp, sku, colors };
      });

      const totalStock = variants.reduce((sum, v) => sum + v.colors.reduce((cs, c) => cs + c.stock, 0), 0);

      product.variants = variants;
      product.stock = totalStock;
      await product.save();
      updated++;
      console.log(`[${updated}/${mobiles.length}] ${product.name} — ${variants.length} variants, ${totalStock} total stock${isOutOfStock ? ' (OUT OF STOCK)' : ''}`);
    }

    console.log(`\nDone! Updated ${updated} products (${outOfStock} out-of-stock)`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
