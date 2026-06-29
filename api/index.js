const app = require('../backend/core-api/src/app');
const mongoose = require('../backend/core-api/node_modules/mongoose');

async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing');
  }
  
  // Set DNS servers to resolve MongoDB Atlas SRV records in serverless environments
  const dns = require('dns');
  // dns.setServers(['8.8.8.8', '8.8.4.4']);
  
  // Configure mongoose for serverless environment
  mongoose.set('strictQuery', false);
  
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  
  console.log('MongoDB Atlas connected (Serverless Root)');
}

module.exports = async (req, res) => {
  try {
    await connectDb();
    app(req, res);
  } catch (err) {
    console.error('Serverless connection error:', err);
    res.status(500).json({ error: 'Serverless backend connection failed' });
  }
};
