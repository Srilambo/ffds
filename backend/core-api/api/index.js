const app = require('../src/app');
const mongoose = require('mongoose');

let isConnected = false;

async function connectDb() {
  if (isConnected) return;
  
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing');
  }
  
  // Set DNS public servers to Google to resolve MongoDB Atlas SRV records in serverless env
  const dns = require('dns');
  // dns.setServers(['8.8.8.8', '8.8.4.4']);
  
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log('MongoDB Atlas connected (Serverless)');
}

module.exports = async (req, res) => {
  try {
    await connectDb();
    // Pass the request and response to the Express app handler
    app(req, res);
  } catch (err) {
    console.error('Serverless connection error:', err);
    res.status(500).json({ error: 'Serverless backend connection failed' });
  }
};
