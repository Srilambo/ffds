const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const scansRoutes = require('./routes/scans');
const chatRoutes = require('./routes/chat');
const inventoryRoutes = require('./routes/inventory');
const notificationRoutes = require('./routes/notifications');
const managerRoutes = require('./routes/manager');
const farmerRoutes = require('./routes/farmer');
const adminRoutes  = require('./routes/admin');
const shopRoutes   = require('./routes/shops');
const orderRoutes  = require('./routes/orders');
const driverRoutes = require('./routes/driver');
const reviewRoutes = require('./routes/reviews');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Dynamic CORS configuration for production deployment
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'];

// Allow all origins in production if CORS_ORIGIN is set to '*'
const allowAllOrigins = allowedOrigins.includes('*');

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const host = req.header('Host');
  
  let isSameOrigin = false;
  if (origin && host) {
    try {
      isSameOrigin = new URL(origin).host === host;
    } catch (e) {}
  }
  
  const isAllowed = !origin || isSameOrigin || allowAllOrigins || allowedOrigins.indexOf(origin) !== -1;
  
  callback(null, {
    origin: isAllowed ? origin : false,
    credentials: true
  });
};

app.use(cors(corsOptionsDelegate));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  next();
});

app.use(express.json());

const staticHeaderMiddleware = (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
};

app.use('/uploads', staticHeaderMiddleware, express.static(path.join(__dirname, '../uploads')));
app.use('/assets/images', staticHeaderMiddleware, express.static(path.join(__dirname, '../assets/images')));

app.get('/health', (req, res) => res.json({ status: 'ok', message: 'Core API + Socket.io running', timestamp: new Date() }));

app.use('/auth', authRoutes);
app.use('/scan', scanRoutes);
app.use('/scans', scansRoutes);
app.use('/chat', chatRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/notifications', notificationRoutes);
app.use('/manager', managerRoutes);
app.use('/farmer',  farmerRoutes);
app.use('/admin',   adminRoutes);
app.use('/shops',   shopRoutes);
app.use('/orders',  orderRoutes);
app.use('/driver',  driverRoutes);
app.use('/reviews', reviewRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
