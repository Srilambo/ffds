const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const scansRoutes = require('./routes/scans');
const chatRoutes = require('./routes/chat');
const inventoryRoutes = require('./routes/inventory');
const managerRoutes = require('./routes/manager');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());

// Dynamic CORS configuration for production deployment
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'];

// Allow all origins in production if CORS_ORIGIN is set to '*'
const allowAllOrigins = allowedOrigins.includes('*');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowAllOrigins || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.error('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', authRoutes);
app.use('/scan', scanRoutes);
app.use('/scans', scansRoutes);
app.use('/chat', chatRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/manager', managerRoutes);
app.use('/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
