import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Banner from '../models/Banner.js';
import { auth, roleAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `banner-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// Public - get active banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 }).populate('product', 'name price images');
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - get all banners
router.get('/admin', auth, roleAuth('admin'), async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 }).populate('product', 'name price images');
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - create banner
router.post('/', auth, roleAuth('admin'), upload.single('image'), async (req, res) => {
  try {
    const { type, product, highlightedText, bigText, smallText, bgColor, textColor, order, isActive } = req.body;
    const bannerType = type === 'text' ? 'text' : 'hero';
    const image = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || req.body.image || '');

    if (bannerType === 'hero' && !image) return res.status(400).json({ message: 'Image is required for Banner 1 (image banner)' });

    const banner = new Banner({
      type: bannerType,
      image,
      product: product || undefined,
      highlightedText: highlightedText || '',
      bigText: bigText || '',
      smallText: smallText || '',
      bgColor: bgColor || '#000000',
      textColor: textColor || '#FFFFFF',
      order: Number(order) || 0,
      isActive: isActive !== 'false',
    });
    await banner.save();
    const populated = await banner.populate('product', 'name price images');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - reorder
router.put('/reorder/batch', auth, roleAuth('admin'), async (req, res) => {
  try {
    const { order } = req.body;
    for (const { id, order: o } of order) {
      await Banner.findByIdAndUpdate(id, { order: o });
    }
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - update banner
router.put('/:id', auth, roleAuth('admin'), upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;
    if (updateData.product === '' || updateData.product === 'none') updateData.product = null;
    if (updateData.order) updateData.order = Number(updateData.order);

    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('product', 'name price images');
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin - delete banner
router.delete('/:id', auth, roleAuth('admin'), async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
