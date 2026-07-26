require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Batch = require('./src/models/Batch');
const InventoryItem = require('./src/models/InventoryItem');
const WasteLog = require('./src/models/WasteLog');
const Announcement = require('./src/models/Announcement');
const Scan = require('./src/models/Scan');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ffds';

// Demo credentials
const DEMO_ACCOUNTS = [
  { name: 'Admin',         email: 'admin@ffds.com',        password: 'admin123',    role: 'admin',   language: 'en' },
  { name: 'Manager',       email: 'maneger@gmail.com',     password: '123456',      role: 'manager', language: 'en' },
  { name: 'Manager Alt',   email: 'manager@gmail.com',     password: '123456',      role: 'manager', language: 'en' },
  { name: 'Manager Ex',    email: 'manager@example.com',   password: 'password123', role: 'manager', language: 'en' },
  { name: 'Manager Demo',  email: 'manager@demo.com',      password: 'demo123',     role: 'manager', language: 'en' },
  { name: 'Farmer',        email: 'farmer@example.com',   password: 'password123', role: 'farmer',  language: 'en' },
  { name: 'Consumer',      email: 'consumer@example.com',  password: 'password123', role: 'consumer', language: 'en' },
  { name: 'Consumer Alt',  email: 'consumer@demo.com',     password: 'demo123',     role: 'consumer', language: 'en' },
];

async function seedDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing demo accounts
    console.log('Cleaning up existing demo data...');
    for (const acc of DEMO_ACCOUNTS) {
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        await InventoryItem.deleteMany({ userId: existing._id });
        await WasteLog.deleteMany({ userId: existing._id });
        await Batch.deleteMany({ farmerId: existing._id });
        await User.deleteOne({ _id: existing._id });
      }
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
        farmId: businessId,
        familyId,
        isActive: true,
        lastLogin: new Date(),
        notificationPrefs: { expiryReminders: true, pushEnabled: true, reminderDays: 2 }
      });
      createdUsers.push(user);
      console.log(`Created account: ${user.email} (${user.role}) — password: ${acc.password}`);
    }

    // Seed Consumer Fridge items
    const consumerUsers = createdUsers.filter(u => u.role === 'consumer');
    for (const consumerUser of consumerUsers) {
      const consumerItems = [
        {
          ownerId: consumerUser._id,
          ownerType: 'consumer',
          userId: consumerUser._id,
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
          ownerId: consumerUser._id,
          ownerType: 'consumer',
          userId: consumerUser._id,
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
          ownerId: consumerUser._id,
          ownerType: 'consumer',
          userId: consumerUser._id,
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
          ownerId: consumerUser._id,
          ownerType: 'consumer',
          userId: consumerUser._id,
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
    }
    console.log(`Seeded Consumer Fridge items for ${consumerUsers.length} accounts.`);

    // Seed Manager Inventory items, Waste logs & Batches
    const managerUsers = createdUsers.filter(u => u.role === 'manager' || u.role === 'farmer');
    for (const managerUser of managerUsers) {
      const managerItems = [
        {
          ownerId: managerUser.businessId || managerUser._id,
          ownerType: 'business',
          userId: managerUser._id,
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
          ownerId: managerUser.businessId || managerUser._id,
          ownerType: 'business',
          userId: managerUser._id,
          foodName: 'Carrots Stock',
          category: 'vegetable',
          quantity: 45,
          unit: 'kg',
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 4 * 86400000),
          expiryDate: new Date(Date.now() + 2 * 86400000),
          status: 'active',
        },
        {
          ownerId: managerUser.businessId || managerUser._id,
          ownerType: 'business',
          userId: managerUser._id,
          foodName: 'Organic Apples',
          category: 'fruit',
          quantity: 85,
          unit: 'kg',
          location: 'pantry',
          purchaseDate: new Date(Date.now() - 1 * 86400000),
          expiryDate: new Date(Date.now() + 9 * 86400000),
          status: 'active',
        },
      ];
      await InventoryItem.insertMany(managerItems);

      const managerWaste = [
        {
          ownerId: managerUser.businessId || managerUser._id,
          ownerType: 'business',
          userId: managerUser._id,
          foodName: 'Overripe Tomatoes',
          quantity: 5,
          unit: 'kg',
          estimatedCost: 15,
          currency: 'USD',
          reason: 'Spoiled during storage',
        },
      ];
      await WasteLog.insertMany(managerWaste);

      const managerBatches = [
        {
          farmerId: managerUser._id,
          batchName: 'Tomato Harvest Batch #101',
          foodType: 'Tomato',
          totalItems: 50,
          freshCount: 42,
          borderlineCount: 6,
          spoiledCount: 2,
          qualityScore: 88,
          estimatedValue: 250,
          currency: 'USD',
        },
        {
          farmerId: managerUser._id,
          batchName: 'Organic Strawberry Batch #102',
          foodType: 'Strawberry',
          totalItems: 30,
          freshCount: 28,
          borderlineCount: 2,
          spoiledCount: 0,
          qualityScore: 96,
          estimatedValue: 180,
          currency: 'USD',
        },
      ];
      await Batch.insertMany(managerBatches);
    }
    console.log(`Seeded Manager Inventory, Waste & Batches for ${managerUsers.length} manager accounts.`);

    // Seed Manager Demo Scans (so Scan History page is never empty)
    await Scan.deleteMany({ businessId: { $in: managerUsers.map(u => u.businessId).filter(Boolean) } });
    const DEMO_SCANS = [
      { foodType: 'Tomato',     label: 'Fresh',      confidence: 95.5, nh3: 0.463, h2s: 0.105, ethylene: 0.032 },
      { foodType: 'Banana',     label: 'Fresh',      confidence: 99.3, nh3: 0.476, h2s: 0.148, ethylene: 0.054 },
      { foodType: 'Mango',      label: 'Borderline', confidence: 72.1, nh3: 0.351, h2s: 0.017, ethylene: 0.091 },
      { foodType: 'Carrot',     label: 'Fresh',      confidence: 87.8, nh3: 0.460, h2s: 0.119, ethylene: 0.028 },
      { foodType: 'Strawberry', label: 'Fresh',      confidence: 100,  nh3: 0.469, h2s: 0.051, ethylene: 0.044 },
      { foodType: 'Orange',     label: 'Fresh',      confidence: 96.6, nh3: 0.455, h2s: 0.113, ethylene: 0.039 },
      { foodType: 'Apple',      label: 'Spoiled',    confidence: 88.2, nh3: 0.712, h2s: 0.341, ethylene: 0.198 },
      { foodType: 'Cucumber',   label: 'Borderline', confidence: 81.4, nh3: 0.521, h2s: 0.204, ethylene: 0.067 },
    ];
    for (const managerUser of managerUsers) {
      if (!managerUser.businessId) continue;
      const managerScans = DEMO_SCANS.map((s, i) => ({
        userId: managerUser._id,
        businessId: managerUser.businessId,
        imageUrl: `/assets/images/demo-${s.foodType.toLowerCase()}.jpg`,
        foodType: s.foodType,
        label: s.label,
        confidence: s.confidence,
        gasReadings: { nh3: s.nh3, h2s: s.h2s, ethylene: s.ethylene },
        chatbotExplanation: `${s.foodType} is classified as ${s.label} with ${s.confidence}% confidence based on CNN analysis and gas sensor readings.`,
        expiryDate: new Date(Date.now() + (s.label === 'Fresh' ? 7 : s.label === 'Borderline' ? 3 : 1) * 86400000),
        createdAt: new Date(Date.now() - i * 2 * 3600000), // spread over last 16 hours
      }));
      await Scan.insertMany(managerScans);
    }
    console.log(`Seeded Demo Scans for ${managerUsers.length} manager accounts (${DEMO_SCANS.length} scans each).`);

    // Seed Demo Broadcast Announcements
    await Announcement.deleteMany({});
    const demoAnnouncements = [
      {
        title: '🚀 CNN AI Model v2.1 Released',
        message: 'We have deployed the MobileNetV2 fine-tuned classification model supporting 8 produce types with multi-gas sensor telemetry.',
        targetRole: 'all',
        priority: 'info',
        createdByName: 'System Admin',
      },
      {
        title: '⚠️ Scheduled Server Maintenance',
        message: 'System core API will undergo routine database index optimizations on Sunday at 02:00 UTC.',
        targetRole: 'all',
        priority: 'warning',
        createdByName: 'System Admin',
      },
      {
        title: '📢 Manager Suite Bulk Scan Update',
        message: 'Business managers can now batch upload up to 20 produce images simultaneously via the Manager Suite.',
        targetRole: 'manager',
        priority: 'info',
        createdByName: 'System Admin',
      },
    ];
    await Announcement.insertMany(demoAnnouncements);
    console.log('Seeded Demo Broadcast Announcements.');

    console.log('\n=== DEMO DATA SUCCESSFULLY SEEDED ===\n');
    console.log('Admin Account:        admin@ffds.com / admin123');
    console.log('Manager Account:      maneger@gmail.com / 123456  (Requested)');
    console.log('Manager Account (Alt): manager@gmail.com / 123456');
    console.log('Manager Account (Ex): manager@example.com / password123');
    console.log('Consumer Account:     consumer@example.com / password123');
    console.log('\n=====================================\n');

  } catch (error) {
    console.error('Error seeding demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDemoData();


