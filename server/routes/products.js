import express from 'express';
import Product from '../models/Product.js';
import { auth, roleAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, brand, minPrice, maxPrice, ram, storage, screenSize, color, sortBy, featured, newArrival, onOffer } = req.query;
    let query = { isActive: true };
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (brand) query.brand = { $in: brand.split(',') };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (ram) query['specifications.ram'] = ram;
    if (storage) query['specifications.storage'] = storage;
    if (screenSize) query['specifications.screenSize'] = screenSize;
    if (color) query['specifications.color'] = color;
    if (featured === 'true') query.isFeatured = true;
    if (newArrival === 'true') query.isNewArrival = true;
    if (onOffer === 'true') query.isOnOffer = true;

    let sort = { createdAt: -1 };
    if (sortBy === 'price_low') sort = { price: 1 };
    else if (sortBy === 'price_high') sort = { price: -1 };
    else if (sortBy === 'name') sort = { name: 1 };
    else if (sortBy === 'rating') sort = { ratings: -1 };

    const products = await Product.find(query).sort(sort);
    res.json(products);
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
