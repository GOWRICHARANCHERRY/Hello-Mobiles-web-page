import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import Product from './models/Product.js';

dotenv.config();

const models = JSON.parse(readFileSync('/var/folders/g_/z8bpf4911js6g28p8g7nz7480000gn/T/opencode/broken_images.json', 'utf8'));
const resolved = JSON.parse(readFileSync('/var/folders/g_/z8bpf4911js6g28p8g7nz7480000gn/T/opencode/resolved_images.json', 'utf8'));

const norm = s => (s || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9+ ]/g, '').replace(/\s+/g, ' ').trim();

function findModel(name) {
  const n = norm(name);
  let best = null;
  for (const m of models) {
    if (!resolved[m.model]) continue;
    let mk = norm(m.model);
    const candidates = new Set([mk]);
    if (mk.endsWith(' 5g')) candidates.add(mk.replace(/ 5g$/, ''));
    if (mk.endsWith(' 4g')) candidates.add(mk.replace(/ 4g$/, ''));
    for (const c of candidates) {
      if (c && (n.includes(c) || n === c)) {
        if (!best || c.length > norm(best.model).length) best = m;
      }
    }
  }
  return best ? resolved[best.model] : null;
}

function placeholder(name) {
  const clean = name.replace(/[^a-zA-Z0-9+ ]/g, '').replace(/\s+/g, ' ').trim();
  return `https://placehold.co/600x600/111827/d4af37?text=${encodeURIComponent(clean)}`;
}

async function apply() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hello_mobiles');
  console.log('Connected');

  const mobiles = await Product.find({ category: 'Mobiles' });
  let updated = 0, real = 0, ph = 0;

  for (const p of mobiles) {
    const newUrl = findModel(p.name);
    let changed = false;

    if (newUrl) {
      if (p.images?.[0] !== newUrl) { p.images = [newUrl]; changed = true; }
      for (const v of (p.variants || [])) for (const c of (v.colors || [])) if (c.image !== newUrl) { c.image = newUrl; changed = true; }
      real++;
    } else {
      const pl = placeholder(p.name);
      if (p.images?.[0] !== pl) { p.images = [pl]; changed = true; }
      for (const v of (p.variants || [])) for (const c of (v.colors || [])) if (c.image !== pl) { c.image = pl; changed = true; }
      ph++;
    }

    if (changed) { await p.save(); updated++; console.log(`[${updated}] ${p.name} -> ${newUrl ? newUrl.split('/').pop() : 'PLACEHOLDER'}`); }
  }

  console.log(`\nDone. ${real} real images, ${ph} placeholders, ${updated} products updated.`);
  process.exit(0);
}

apply().catch(e => { console.error(e); process.exit(1); });
