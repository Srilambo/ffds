require('dotenv').config();
const dns = require('dns');
// Set DNS servers to Google public DNS to bypass local/ISP DNS issues with MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ffds';

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/ffds';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas connected');
    app.listen(PORT, () => {
      console.log(`Core API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('MongoDB Atlas connection failed. Trying local fallback...');
    console.warn('Atlas error:', err.message);
    mongoose
      .connect(LOCAL_MONGODB_URI)
      .then(() => {
        console.log('MongoDB Local connected (fallback)');
        app.listen(PORT, () => {
          console.log(`Core API running on port ${PORT}`);
        });
      })
      .catch((fallbackErr) => {
        console.error('MongoDB connection error (Atlas & Local both failed):', fallbackErr);
        process.exit(1);
      });
  });
