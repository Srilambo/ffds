require('dotenv').config();
const dns  = require('dns');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');

// Set DNS servers to Google public DNS to bypass local/ISP DNS issues with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const app = require('./app');
const { syncAllUsersExpiryNotifications } = require('./services/expiryNotificationService');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ffds';

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/ffds';

function startServer() {
  // Wrap express in an HTTP server so Socket.io can attach
  const httpServer = http.createServer(app);

  // Configure Socket.io
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach io to app so controllers can emit via req.app.get('io')
  app.set('io', io);

  io.on('connection', (socket) => {
    // Manager joins their shop room to receive new-order events
    socket.on('join_shop', (shopId) => {
      socket.join(`shop:${shopId}`);
      console.log(`Socket ${socket.id} joined shop:${shopId}`);
    });

    // Consumer joins their order room to receive status updates
    socket.on('join_order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('leave_shop',  (shopId)  => socket.leave(`shop:${shopId}`));
    socket.on('leave_order', (orderId) => socket.leave(`order:${orderId}`));

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Core API + Socket.io running on port ${PORT}`);
  });

  // Check inventory expiry every 30 minutes and create alerts
  const EXPIRY_CHECK_MS = 30 * 60 * 1000;
  setInterval(async () => {
    try {
      const count = await syncAllUsersExpiryNotifications();
      if (count > 0) console.log(`Expiry notifications synced for ${count} item(s)`);
    } catch (err) {
      console.warn('Expiry notification sync failed:', err.message);
    }
  }, EXPIRY_CHECK_MS);

  // Run once on startup
  syncAllUsersExpiryNotifications().catch(() => {});

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env`);
      console.error(`Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
      process.exit(1);
    }
    throw err;
  });
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas connected');
    startServer();
  })
  .catch((err) => {
    console.warn('MongoDB Atlas connection failed. Trying local fallback...');
    console.warn('Atlas error:', err.message);
    mongoose
      .connect(LOCAL_MONGODB_URI)
      .then(() => {
        console.log('MongoDB Local connected (fallback)');
        startServer();
      })
      .catch((fallbackErr) => {
        console.error('MongoDB connection error (Atlas & Local both failed):', fallbackErr);
        process.exit(1);
      });
  });
