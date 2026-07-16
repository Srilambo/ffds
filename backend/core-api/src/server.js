require('dotenv').config();
const dns = require('dns');
// Set DNS servers to Google public DNS to bypass local/ISP DNS issues with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const app = require('./app');
const { syncAllUsersExpiryNotifications } = require('./services/expiryNotificationService');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ffds';

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/ffds';

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Core API running on port ${PORT}`);
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

  server.on('error', (err) => {
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
