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
const DEMO_MANAGER = {
  name: 'Demo Manager',
  email: 'manager@demo.com',
  password: 'demo123',
  role: 'manager',
  language: 'en'
};

const DEMO_FARMER = {
  name: 'Demo Farmer',
  email: 'farmer@demo.com',
  password: 'demo123',
  role: 'farmer',
  language: 'en'
};

async function seedDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing demo data
    console.log('Cleaning up existing demo data...');
    await User.deleteOne({ email: DEMO_MANAGER.email });
    await User.deleteOne({ email: DEMO_FARMER.email });
    await InventoryItem.deleteMany({ foodName: { $in: ['Tomatoes', 'Carrots', 'Apples', 'Milk', 'Bread', 'Chicken'] } });
    await Batch.deleteMany({ batchName: { $in: ['Harvest Batch 1', 'Harvest Batch 2', 'Harvest Batch 3'] } });
    await WasteLog.deleteMany({ foodName: { $in: ['Tomatoes', 'Carrots', 'Apples'] } });

    // Create demo manager
    console.log('Creating demo manager...');
    const managerBusinessId = new mongoose.Types.ObjectId();
    const managerPasswordHash = await bcrypt.hash(DEMO_MANAGER.password, 10);
    
    const demoManager = await User.create({
      name: DEMO_MANAGER.name,
      email: DEMO_MANAGER.email,
      passwordHash: managerPasswordHash,
      role: DEMO_MANAGER.role,
      language: DEMO_MANAGER.language,
      businessId: managerBusinessId,
      teamId: managerBusinessId,
      isActive: true,
      lastLogin: new Date(),
      notificationPrefs: {
        expiryReminders: true,
        pushEnabled: true,
        reminderDays: 2
      }
    });
    console.log('Demo manager created:', demoManager.email);

    // Create inventory items for manager
    console.log('Creating inventory items for manager...');
    const inventoryItems = [
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Tomatoes',
        category: 'vegetable',
        quantity: 50,
        unit: 'kg',
        purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'active',
        location: 'warehouse'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Carrots',
        category: 'vegetable',
        quantity: 30,
        unit: 'kg',
        purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'expiring',
        location: 'warehouse'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Apples',
        category: 'fruit',
        quantity: 25,
        unit: 'kg',
        purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'active',
        location: 'warehouse'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Milk',
        category: 'dairy',
        quantity: 20,
        unit: 'liters',
        purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        status: 'expiring',
        location: 'fridge'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Bread',
        category: 'bakery',
        quantity: 15,
        unit: 'loaves',
        purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'active',
        location: 'warehouse'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Chicken',
        category: 'meat',
        quantity: 10,
        unit: 'kg',
        purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'active',
        location: 'fridge'
      }
    ];

    await InventoryItem.insertMany(inventoryItems);
    console.log('Inventory items created:', inventoryItems.length);

    // Create waste logs for manager
    console.log('Creating waste logs for manager...');
    const wasteLogs = [
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Tomatoes',
        quantity: 5,
        unit: 'kg',
        estimatedCost: 15,
        currency: 'USD',
        reason: 'Spoiled during storage'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Carrots',
        quantity: 3,
        unit: 'kg',
        estimatedCost: 9,
        currency: 'USD',
        reason: 'Expired'
      },
      {
        ownerId: managerBusinessId,
        ownerType: 'business',
        userId: demoManager._id,
        foodName: 'Apples',
        quantity: 2,
        unit: 'kg',
        estimatedCost: 8,
        currency: 'USD',
        reason: 'Transport damage'
      }
    ];

    await WasteLog.insertMany(wasteLogs);
    console.log('Waste logs created:', wasteLogs.length);

    // Create demo farmer
    console.log('Creating demo farmer...');
    const farmerFarmId = new mongoose.Types.ObjectId();
    const farmerPasswordHash = await bcrypt.hash(DEMO_FARMER.password, 10);
    
    const demoFarmer = await User.create({
      name: DEMO_FARMER.name,
      email: DEMO_FARMER.email,
      passwordHash: farmerPasswordHash,
      role: DEMO_FARMER.role,
      language: DEMO_FARMER.language,
      farmId: farmerFarmId,
      isActive: true,
      lastLogin: new Date(),
      notificationPrefs: {
        expiryReminders: true,
        pushEnabled: true,
        reminderDays: 2
      }
    });
    console.log('Demo farmer created:', demoFarmer.email);

    // Create batches for farmer
    console.log('Creating batches for farmer...');
    const batches = [
      {
        farmerId: farmerFarmId,
        batchName: 'Harvest Batch 1',
        foodType: 'Tomatoes',
        totalItems: 100,
        freshCount: 85,
        borderlineCount: 10,
        spoiledCount: 5,
        qualityScore: 90,
        estimatedValue: 500,
        currency: 'USD'
      },
      {
        farmerId: farmerFarmId,
        batchName: 'Harvest Batch 2',
        foodType: 'Carrots',
        totalItems: 80,
        freshCount: 60,
        borderlineCount: 15,
        spoiledCount: 5,
        qualityScore: 75,
        estimatedValue: 320,
        currency: 'USD'
      },
      {
        farmerId: farmerFarmId,
        batchName: 'Harvest Batch 3',
        foodType: 'Apples',
        totalItems: 120,
        freshCount: 100,
        borderlineCount: 15,
        spoiledCount: 5,
        qualityScore: 87,
        estimatedValue: 600,
        currency: 'USD'
      }
    ];

    await Batch.insertMany(batches);
    console.log('Batches created:', batches.length);

    console.log('\n=== DEMO DATA SUCCESSFULLY CREATED ===\n');
    console.log('MANAGER LOGIN CREDENTIALS:');
    console.log('Email:', DEMO_MANAGER.email);
    console.log('Password:', DEMO_MANAGER.password);
    console.log('Business ID:', managerBusinessId.toString());
    console.log('\nFARMER LOGIN CREDENTIALS:');
    console.log('Email:', DEMO_FARMER.email);
    console.log('Password:', DEMO_FARMER.password);
    console.log('Farm ID:', farmerFarmId.toString());
    console.log('\n=====================================\n');

  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDemoData();
