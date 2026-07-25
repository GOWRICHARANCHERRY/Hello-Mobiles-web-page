import express from 'express';
import Product from '../models/Product.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, brand, minPrice, maxPrice, ram, storage, screenSize, color, sortBy, featured, newArrival, onOffer } = req.query;
    let query = { isActive: true };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { brand: regex },
        { category: regex },
        { description: regex },
        { tags: regex },
      ];
    }
    if (category) query.category = category;
    if (brand) query.brand = { $in: brand.split(',') };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    const specFilters = [];
    if (ram) specFilters.push({ $or: [{ 'specifications.ram': ram }, { 'specifications.RAM': ram }] });
    if (storage) specFilters.push({ $or: [{ 'specifications.storage': storage }, { 'specifications.Storage': storage }] });
    if (screenSize) specFilters.push({ $or: [{ 'specifications.screenSize': screenSize }, { 'specifications.Screen Size': screenSize }] });
    if (color) specFilters.push({ $or: [{ 'specifications.color': color }, { 'specifications.Color': color }] });
    if (specFilters.length > 0) query.$and = specFilters;
    if (featured === 'true') query.isFeatured = true;
    if (newArrival === 'true') query.isNewArrival = true;
    if (onOffer === 'true') query.isOnOffer = true;

    let sort = { createdAt: -1 };
    if (sortBy === 'price_low') sort = { price: 1 };
    else if (sortBy === 'price_high') sort = { price: -1 };
    else if (sortBy === 'name') sort = { name: 1 };
    else if (sortBy === 'rating') sort = { ratings: -1 };

    const products = await Product.find(query).sort(sort);

    // Attach lowest variant price for products with variants
    const enriched = products.map(p => {
      const obj = p.toObject();
      if (obj.variants && obj.variants.length > 0) {
        const lowestPrice = Math.min(...obj.variants.map(v => v.price));
        const lowestMrp = Math.min(...obj.variants.map(v => v.mrp));
        const totalVariantStock = obj.variants.reduce((sum, v) => {
          return sum + (v.colors?.reduce((cs, c) => cs + (c.stock || 0), 0) || 0);
        }, 0);
        obj.lowestVariantPrice = lowestPrice;
        obj.lowestVariantMrp = lowestMrp;
        obj.totalVariantStock = totalVariantStock;
      }
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/names', async (req, res) => {
  try {
    const names = await Product.distinct('name', { isActive: true });
    res.json(names);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/autocomplete', async (req, res) => {
  try {
    const { field, q } = req.query;
    if (!field || !q) return res.json([]);
    const regex = new RegExp(q, 'i');
    let results;
    if (field === 'name') results = await Product.distinct('name', { name: regex, isActive: true });
    else if (field === 'brand') results = await Product.distinct('brand', { brand: regex, isActive: true });
    else if (field === 'category') results = await Product.distinct('category', { category: regex, isActive: true });
    else return res.json([]);
    res.json(results.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ products: [], brands: [], categories: [] });
    const regex = new RegExp(q, 'i');

    const products = await Product.find({ isActive: true, $or: [{ name: regex }, { brand: regex }] })
      .select('name brand category price mrp images variants')
      .limit(8)
      .lean();

    const enriched = products.map(p => {
      const obj = { ...p };
      if (obj.variants && obj.variants.length > 0) {
        obj.lowestVariantPrice = Math.min(...obj.variants.map(v => v.price));
      }
      return obj;
    });

    const brands = await Product.distinct('brand', { isActive: true, brand: regex });
    const categories = await Product.distinct('category', { isActive: true, category: regex });

    res.json({ products: enriched, brands: brands.slice(0, 5), categories: categories.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, roleAuth('admin', 'employee'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
