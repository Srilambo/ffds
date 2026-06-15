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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/scans', scansRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/manager', managerRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
