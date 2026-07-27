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

const Shop = require('./src/models/Shop');

// Demo credentials
const DEMO_ACCOUNTS = [
  { name: 'Admin',         email: 'admin@ffds.com',        password: 'admin123',    role: 'admin',   language: 'en' },
  { name: 'Manager Main',  email: 'maneger@gmail.com',     password: '123456',      role: 'manager', language: 'en' },
  { name: 'Manager Alt',   email: 'manager@gmail.com',     password: '123456',      role: 'manager', language: 'en' },
  { name: 'Farmer',        email: 'farmer@example.com',   password: 'password123', role: 'farmer',  language: 'en' },
  { name: 'Consumer',      email: 'consumer@example.com',  password: 'password123', role: 'consumer', language: 'en' },
];

const MANAGER_SHOPS_30 = [
  // JAFFNA DISTRICT (Tellippalai, Chunnakam, Jaffna Town, Kokkuvil, Manipay, etc.)
  { mgrEmail: 'manager1@ffds.com', mgrName: 'Sivakumaran Perumal', shopName: 'Tellippalai Fresh Mart', address: '142 Kankesanthurai Road, Tellippalai, Jaffna', phone: '+94 21 222 1001', category: 'supermarket', hours: '6:30am – 10:00pm', isVerified: true, lng: 80.0167, lat: 9.7833, rating: 4.9 },
  { mgrEmail: 'manager2@ffds.com', mgrName: 'Thirunavukkarasu K.', shopName: 'Chunnakam Organic Pantry', address: '88 Station Road, Chunnakam, Jaffna', phone: '+94 21 222 1002', category: 'organic', hours: '7:00am – 9:30pm', isVerified: true, lng: 80.0380, lat: 9.7430, rating: 4.8 },
  { mgrEmail: 'manager3@ffds.com', mgrName: 'Kanthasamy V.', shopName: 'Jaffna City Super Express', address: '25 Hospital Road, Jaffna Town', phone: '+94 21 222 1003', category: 'grocery', hours: '24/7 Open', isVerified: true, lng: 80.0255, lat: 9.6615, rating: 4.7 },
  { mgrEmail: 'manager4@ffds.com', mgrName: 'Gajendran S.', shopName: 'Kokkuvil Green Grocery', address: '12 Palaly Road, Kokkuvil, Jaffna', phone: '+94 21 222 1004', category: 'produce', hours: '7:00am – 9:00pm', isVerified: true, lng: 80.0220, lat: 9.6950, rating: 4.9 },
  { mgrEmail: 'manager5@ffds.com', mgrName: 'Ramanathan M.', shopName: 'Kondavil Fresh Market', address: '45 Point Pedro Road, Kondavil', phone: '+94 21 222 1005', category: 'supermarket', hours: '6:30am – 9:30pm', isVerified: true, lng: 80.0310, lat: 9.7080, rating: 4.6 },
  { mgrEmail: 'manager6@ffds.com', mgrName: 'Sivagnanam K.', shopName: 'Manipay Produce Hub', address: '78 Manipay Road, Manipay', phone: '+94 21 222 1006', category: 'produce', hours: '7:00am – 8:30pm', isVerified: true, lng: 79.9880, lat: 9.6980, rating: 4.8 },
  { mgrEmail: 'manager7@ffds.com', mgrName: 'Balasubramaniam P.', shopName: 'Inuvil Farmers Express', address: '33 Main Street, Inuvil', phone: '+94 21 222 1007', category: 'organic', hours: '7:30am – 9:00pm', isVerified: true, lng: 80.0250, lat: 9.7210, rating: 4.9 },
  { mgrEmail: 'manager8@ffds.com', mgrName: 'Tharmalingam R.', shopName: 'Vaddukoddai Eco Pantry', address: '99 College Road, Vaddukoddai', phone: '+94 21 222 1008', category: 'convenience', hours: '7:00am – 9:00pm', isVerified: true, lng: 79.9380, lat: 9.7150, rating: 4.7 },
  { mgrEmail: 'manager9@ffds.com', mgrName: 'Surenthar N.', shopName: 'Point Pedro Coastal Super', address: '12 Harbor Road, Point Pedro', phone: '+94 21 222 1009', category: 'supermarket', hours: '6:00am – 10:00pm', isVerified: true, lng: 80.2333, lat: 9.8250, rating: 4.9 },
  { mgrEmail: 'manager10@ffds.com', mgrName: 'Ketheeswaran M.', shopName: 'Chavakachcheri Town Mart', address: '50 Market Street, Chavakachcheri', phone: '+94 21 222 1010', category: 'grocery', hours: '7:00am – 9:30pm', isVerified: true, lng: 80.1650, lat: 9.6550, rating: 4.6 },

  // NORTHERN PROVINCE (Kilinochchi, Vavuniya, Mannar, Mullaitivu)
  { mgrEmail: 'manager11@ffds.com', mgrName: 'Sellathurai T.', shopName: 'Kilinochchi Central Super', address: '10 A9 Highway, Kilinochchi', phone: '+94 21 222 1011', category: 'supermarket', hours: '7:00am – 9:30pm', isVerified: true, lng: 80.3992, lat: 9.3803, rating: 4.8 },
  { mgrEmail: 'manager12@ffds.com', mgrName: 'Vigneswaran P.', shopName: 'Vavuniya Grand Produce', address: '88 Station Road, Vavuniya', phone: '+94 24 222 1012', category: 'produce', hours: '6:30am – 9:00pm', isVerified: true, lng: 80.4971, lat: 8.7514, rating: 4.7 },
  { mgrEmail: 'manager13@ffds.com', mgrName: 'Jeyarajah S.', shopName: 'Mannar Coastal Fresh', address: '15 Main Bazaar, Mannar Town', phone: '+94 23 222 1013', category: 'grocery', hours: '7:00am – 9:00pm', isVerified: true, lng: 79.9044, lat: 8.9780, rating: 4.6 },
  { mgrEmail: 'manager14@ffds.com', mgrName: 'Pathmanathan K.', shopName: 'Mullaitivu Green Market', address: '42 Beach Road, Mullaitivu', phone: '+94 21 222 1014', category: 'organic', hours: '7:00am – 8:30pm', isVerified: true, lng: 80.8143, lat: 9.2671, rating: 4.8 },

  // EASTERN PROVINCE (Trincomalee, Batticaloa, Ampara)
  { mgrEmail: 'manager15@ffds.com', mgrName: 'Mohamed Razi', shopName: 'Trincomalee Harbor Mart', address: '105 Inner Harbor Road, Trincomalee', phone: '+94 26 222 1015', category: 'supermarket', hours: '7:00am – 10:00pm', isVerified: true, lng: 81.2335, lat: 8.5874, rating: 4.9 },
  { mgrEmail: 'manager16@ffds.com', mgrName: 'Abdul Latheef', shopName: 'Batticaloa Lagoon Pantry', address: '22 Main Street, Batticaloa', phone: '+94 65 222 1016', category: 'grocery', hours: '7:00am – 9:30pm', isVerified: true, lng: 81.6924, lat: 7.7170, rating: 4.7 },
  { mgrEmail: 'manager17@ffds.com', mgrName: 'Sivananthan G.', shopName: 'Ampara Farmers Cooperative', address: '18 Clock Tower Junction, Ampara', phone: '+94 63 222 1017', category: 'produce', hours: '6:30am – 9:00pm', isVerified: true, lng: 81.6747, lat: 7.2885, rating: 4.8 },

  // WESTERN PROVINCE (Colombo, Negombo, Gampaha)
  { mgrEmail: 'manager18@ffds.com', mgrName: 'Nalin Bandara', shopName: 'Colombo City Central Fresh', address: '142 Galle Road, Colombo 03', phone: '+94 11 222 1018', category: 'supermarket', hours: '7:00am – 10:30pm', isVerified: true, lng: 79.8612, lat: 6.9271, rating: 4.9 },
  { mgrEmail: 'manager19@ffds.com', mgrName: 'Sunil Perera', shopName: 'Duplication Organic Hub', address: '88 Duplication Road, Colombo 04', phone: '+94 11 222 1019', category: 'organic', hours: '8:00am – 9:30pm', isVerified: true, lng: 79.8650, lat: 6.9150, rating: 4.9 },
  { mgrEmail: 'manager20@ffds.com', mgrName: 'Kamal Fernando', shopName: 'Havelock Express Grocery', address: '25 Havelock Road, Colombo 05', phone: '+94 11 222 1020', category: 'convenience', hours: '24/7 Open', isVerified: true, lng: 79.8700, lat: 6.9010, rating: 4.7 },
  { mgrEmail: 'manager21@ffds.com', mgrName: 'Dinesh Jayawardena', shopName: 'Kynsey Green Super', address: '310 Kynsey Road, Colombo 08', phone: '+94 11 222 1021', category: 'supermarket', hours: '7:00am – 10:00pm', isVerified: true, lng: 79.8780, lat: 6.9180, rating: 4.8 },
  { mgrEmail: 'manager22@ffds.com', mgrName: 'Roshan Silva', shopName: 'Negombo Beach Fresh Bazaar', address: '45 Lewis Place, Negombo', phone: '+94 31 222 1022', category: 'produce', hours: '6:30am – 10:00pm', isVerified: true, lng: 79.8358, lat: 7.2083, rating: 4.8 },
  { mgrEmail: 'manager23@ffds.com', mgrName: 'Upul Rathnayake', shopName: 'Gampaha Town Organics', address: '70 Main Street, Gampaha', phone: '+94 33 222 1023', category: 'organic', hours: '7:00am – 9:00pm', isVerified: true, lng: 79.9962, lat: 7.0840, rating: 4.7 },

  // CENTRAL PROVINCE (Kandy, Nuwara Eliya, Matale)
  { mgrEmail: 'manager24@ffds.com', mgrName: 'Anura Wijesinghe', shopName: 'Kandy Lakeview Fresh Mart', address: '12 Dalada Veediya, Kandy', phone: '+94 81 222 1024', category: 'supermarket', hours: '7:00am – 9:30pm', isVerified: true, lng: 80.6337, lat: 7.2906, rating: 4.9 },
  { mgrEmail: 'manager25@ffds.com', mgrName: 'Ruwan Herath', shopName: 'Nuwara Eliya Hillside Farm', address: '5 Park Road, Nuwara Eliya', phone: '+94 52 222 1025', category: 'organic', hours: '7:30am – 8:30pm', isVerified: true, lng: 80.7672, lat: 6.9497, rating: 4.9 },
  { mgrEmail: 'manager26@ffds.com', mgrName: 'Saman Kumara', shopName: 'Matale Spice & Fresh Market', address: '30 Trincomalee Street, Matale', phone: '+94 66 222 1026', category: 'produce', hours: '7:00am – 9:00pm', isVerified: true, lng: 80.6234, lat: 7.4675, rating: 4.7 },

  // SOUTHERN & SABARAGAMUWA (Galle, Matara, Anuradhapura, Ratnapura)
  { mgrEmail: 'manager27@ffds.com', mgrName: 'Pradeep De Silva', shopName: 'Galle Fort Fresh Express', address: '8 Fort Main Street, Galle', phone: '+94 91 222 1027', category: 'supermarket', hours: '7:00am – 10:00pm', isVerified: true, lng: 80.2170, lat: 6.0535, rating: 4.9 },
  { mgrEmail: 'manager28@ffds.com', mgrName: 'Kasun Wickramasinghe', shopName: 'Matara Southern Super', address: '15 Anagarika Dharmapala Mw, Matara', phone: '+94 41 222 1028', category: 'grocery', hours: '7:00am – 9:30pm', isVerified: true, lng: 80.5500, lat: 5.9485, rating: 4.8 },
  { mgrEmail: 'manager29@ffds.com', mgrName: 'Gamini Dissanayake', shopName: 'Anuradhapura Heritage Mart', address: '88 New Town Road, Anuradhapura', phone: '+94 25 222 1029', category: 'produce', hours: '6:30am – 9:30pm', isVerified: true, lng: 80.4037, lat: 8.3114, rating: 4.8 },
  { mgrEmail: 'manager30@ffds.com', mgrName: 'Mahesh Gunawardena', shopName: 'Ratnapura Gem City Organics', address: '22 Main Street, Ratnapura', phone: '+94 45 222 1030', category: 'organic', hours: '7:00am – 9:00pm', isVerified: true, lng: 80.4010, lat: 6.6828, rating: 4.8 },
];

async function seedDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up existing demo accounts & shops
    console.log('Cleaning up existing demo data...');
    await Shop.deleteMany({});
    for (const acc of [...DEMO_ACCOUNTS, ...MANAGER_SHOPS_30.map(s => ({ email: s.mgrEmail }))]) {
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
    }

    // Seed 30 Manager Accounts and 30 Shops in MongoDB
    console.log('Seeding 30 Manager User Accounts & 30 Backend Shops...');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);
    const seededShopsCount = 0;

    for (const shopItem of MANAGER_SHOPS_30) {
      const bId = new mongoose.Types.ObjectId();
      const managerUser = await User.create({
        name: shopItem.mgrName,
        email: shopItem.mgrEmail,
        passwordHash: defaultPasswordHash,
        role: 'manager',
        language: 'en',
        businessId: bId,
        teamId: bId,
        farmId: bId,
        isActive: true,
        lastLogin: new Date(),
      });

      await Shop.create({
        managerId: managerUser._id,
        shopName: shopItem.shopName,
        address: shopItem.address,
        phone: shopItem.phone,
        category: shopItem.category,
        hours: shopItem.hours,
        isVerified: shopItem.isVerified,
        isOpen: true,
        location: {
          type: 'Point',
          coordinates: [shopItem.lng, shopItem.lat], // [lng, lat]
        },
        rating: shopItem.rating,
        totalOrders: Math.floor(50 + Math.random() * 200),
        stockSummary: [
          { name: 'Fresh Milk', category: 'Dairy', inStock: true, price: 2.80 },
          { name: 'Whole Wheat Bread', category: 'Bakery', inStock: true, price: 2.20 },
          { name: 'Red Apples', category: 'Produce', inStock: true, price: 3.50 },
          { name: 'Eggs', category: 'Dairy', inStock: true, price: 3.20 },
          { name: 'Bananas', category: 'Produce', inStock: true, price: 1.80 },
          { name: 'Fresh Tomatoes', category: 'Produce', inStock: true, price: 1.90 },
        ],
      });
    }
    console.log(`Successfully seeded 30 Manager User Accounts (password: 123456) & 30 Shops in MongoDB!`);

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


