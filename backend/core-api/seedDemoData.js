require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Batch = require('./src/models/Batch');
const InventoryItem = require('./src/models/InventoryItem');
const WasteLog = require('./src/models/WasteLog');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ffds';

// Demo credentials
const DEMO_ACCOUNTS = [
  { name: 'Demo Admin',   email: 'admin@ffds.com',       password: 'admin123',    role: 'admin',   language: 'en' },
  { name: 'Demo Manager', email: 'manager@example.com', password: 'password123', role: 'manager', language: 'en' },
  { name: 'Demo Manager Alt', email: 'manager@demo.com', password: 'demo123', role: 'manager', language: 'en' },
  { name: 'Demo Farmer',  email: 'farmer@example.com',  password: 'password123', role: 'farmer',  language: 'en' },
  { name: 'Demo Consumer', email: 'consumer@example.com', password: 'password123', role: 'consumer', language: 'en' },
  { name: 'Demo Consumer Alt', email: 'consumer@demo.com', password: 'demo123', role: 'consumer', language: 'en' },
];

async function seedDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing demo accounts
    console.log('Cleaning up existing demo data...');
    for (const acc of DEMO_ACCOUNTS) {
      await User.deleteOne({ email: acc.email });
    }

    const createdUsers = [];
    for (const acc of DEMO_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(acc.password, 10);
      const businessId = (acc.role === 'manager' || acc.role === 'admin' || acc.role === 'farmer') ? new mongoose.Types.ObjectId() : null;
      const familyId = acc.role === 'consumer' ? new mongoose.Types.ObjectId() : null;
      
      const user = await User.create({
        name: acc.name,
        email: acc.email,
        passwordHash,
        role: acc.role,
        language: acc.language,
        businessId,
        teamId: businessId,
        familyId,
        isActive: true,
        lastLogin: new Date(),
        notificationPrefs: { expiryReminders: true, pushEnabled: true, reminderDays: 2 }
      });
      createdUsers.push(user);
      console.log(`Created account: ${user.email} (${user.role}) — password: ${acc.password}`);
    }

    const primaryManager = createdUsers.find(u => u.role === 'manager');
    const primaryConsumer = createdUsers.find(u => u.role === 'consumer');

    // Seed Consumer Fridge items
    if (primaryConsumer) {
      const consumerItems = [
        {
          ownerId: primaryConsumer._id,
          ownerType: 'consumer',
          userId: primaryConsumer._id,
          foodName: 'Fresh Tomatoes',
          category: 'vegetable',
          quantity: 6,
          unit: 'pcs',
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 1 * 86400000),
          expiryDate: new Date(Date.now() + 5 * 86400000),
          status: 'active',
        },
        {
          ownerId: primaryConsumer._id,
          ownerType: 'consumer',
          userId: primaryConsumer._id,
          foodName: 'Organic Milk',
          category: 'dairy',
          quantity: 2,
          unit: 'liters',
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 2 * 86400000),
          expiryDate: new Date(Date.now() + 2 * 86400000),
          status: 'active',
        },
        {
          ownerId: primaryConsumer._id,
          ownerType: 'consumer',
          userId: primaryConsumer._id,
          foodName: 'Fresh Strawberries',
          category: 'fruit',
          quantity: 1,
          unit: 'box',
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 3 * 86400000),
          expiryDate: new Date(Date.now() + 1 * 86400000),
          status: 'active',
        },
        {
          ownerId: primaryConsumer._id,
          ownerType: 'consumer',
          userId: primaryConsumer._id,
          foodName: 'Red Apples',
          category: 'fruit',
          quantity: 4,
          unit: 'pcs',
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 1 * 86400000),
          expiryDate: new Date(Date.now() + 8 * 86400000),
          status: 'active',
        },
      ];
      await InventoryItem.insertMany(consumerItems);
      console.log('Seeded Consumer Fridge items:', consumerItems.length);
    }

    // Seed Manager Inventory items & Waste logs
    if (primaryManager) {
      const managerItems = [
        {
          ownerId: primaryManager.businessId,
          ownerType: 'business',
          userId: primaryManager._id,
          foodName: 'Bulk Tomatoes',
          category: 'vegetable',
          quantity: 120,
          unit: 'kg',
          location: 'warehouse',
          purchaseDate: new Date(Date.now() - 2 * 86400000),
          expiryDate: new Date(Date.now() + 6 * 86400000),
          status: 'active',
        },
        {
          ownerId: primaryManager.businessId,
          ownerType: 'business',
          userId: primaryManager._id,
          foodName: 'Carrots Stock',
          category: 'vegetable',
          quantity: 45,
          unit: 'kg',
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 4 * 86400000),
          expiryDate: new Date(Date.now() + 2 * 86400000),
          status: 'active',
        },
      ];
      await InventoryItem.insertMany(managerItems);

      const managerWaste = [
        {
          ownerId: primaryManager.businessId,
          ownerType: 'business',
          userId: primaryManager._id,
          foodName: 'Overripe Tomatoes',
          quantity: 5,
          unit: 'kg',
          estimatedCost: 15,
          currency: 'USD',
          reason: 'Spoiled during storage',
        },
      ];
      await WasteLog.insertMany(managerWaste);
      console.log('Seeded Manager Inventory & Waste items.');
    }

    console.log('\n=== DEMO DATA SUCCESSFULLY SEEDED ===\n');
    console.log('0. Admin Account:   admin@ffds.com / admin123');
    console.log('1. Manager Account: manager@example.com / password123 OR manager@demo.com / demo123');
    console.log('2. Consumer Account: consumer@example.com / password123 OR consumer@demo.com / demo123');
    console.log('\n=====================================\n');

  } catch (error) {
    console.error('Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDemoData();

