import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import uploadRoutes from './routes/upload.js';
import bannerRoutes from './routes/banners.js';
import couponRoutes from './routes/coupons.js';
import leadRoutes from './routes/leads.js';
import { initFirebase } from './config/firebase.js';

dotenv.config();
initFirebase();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://hello-mobiles.com',
  'https://www.hello-mobiles.com',
  'https://hello-mobiles.onrender.com',
];
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
}));

app.use(helmet({
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://maps.googleapis.com',
        'https://www.google.com',
        'https://www.gstatic.com',
        'https://*.firebaseapp.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://www.gstatic.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: [
        "'self'", 'data:', 'blob:',
        'https://images.unsplash.com',
        'https://fdn2.gsmarena.com',
        'https://*.googleusercontent.com',
        'https://lh3.googleusercontent.com',
        'https://www.gstatic.com',
        'https://cdn.simpleicons.org',
        'https://upload.wikimedia.org',
      ],
      connectSrc: [
        "'self'",
        'https://maps.googleapis.com',
        'https://nominatim.openstreetmap.org',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://www.googleapis.com',
        'https://oauth2.googleapis.com',
        'https://*.firebaseio.com',
        'wss://*.firebaseio.com',
      ],
      frameSrc: ["'self'", 'https://accounts.google.com', 'https://www.google.com'],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(mongoSanitize());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/leads', leadRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
