const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Scan = require('../models/Scan');
const InventoryItem = require('../models/InventoryItem');
const WasteLog = require('../models/WasteLog');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { parse } = require('csv-parse');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function getDashboard(req, res, next) {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Manager has no business assigned' });
    }

    // Get inventory items for this business
    const inventoryItems = await InventoryItem.find({ ownerType: 'business', ownerId: businessId });
    
    // Get waste logs for this business
    const wasteLogs = await WasteLog.find({ ownerType: 'business', ownerId: businessId });
    
    // Get scans for this business
    const scans = await Scan.find({ businessId }).sort({ createdAt: -1 });

    // Stats
    const totalItems = inventoryItems.length;
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = inventoryItems.filter(
      (i) => i.status === 'active' && i.expiryDate && new Date(i.expiryDate) <= twoDaysFromNow
    ).length;

    // Waste cost this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyWasteLogs = wasteLogs.filter(
      (w) => new Date(w.createdAt) >= startOfMonth
    );
    const wasteCostThisMonth = monthlyWasteLogs.reduce((sum, w) => sum + (w.estimatedCost || 0), 0);

    // Recent scans (last 10)
    const recentScans = scans.slice(0, 10).map((s) => ({
      _id: s._id,
      foodType: s.foodType,
      label: s.label,
      confidence: s.confidence,
      createdAt: s.createdAt,
      userId: s.userId,
    }));

    const scansByLabel = { Fresh: 0, Borderline: 0, Spoiled: 0 };
    scans.forEach((s) => {
      if (scansByLabel[s.label] !== undefined) {
        scansByLabel[s.label]++;
      }
    });

    const expiringItems = inventoryItems.filter(
      (i) => i.status === 'active' && i.expiryDate && new Date(i.expiryDate) <= twoDaysFromNow
    );

    return res.status(200).json({
      totalItems,
      totalInventoryItems: totalItems,
      expiringSoon,
      expiringItems,
      wasteCostThisMonth,
      wastedItems: wasteLogs.length,
      wasteRate: totalItems > 0 ? parseFloat(((wasteLogs.length / (totalItems + wasteLogs.length)) * 100).toFixed(1)) : 0,
      recentScans,
      scansByLabel,
      totalScans: scans.length,
    });
  } catch (err) {
    next(err);
  }
}

async function listInventory(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const items = await InventoryItem.find({ ownerType: 'business', ownerId: businessId })
      .sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

async function createInventoryItem(req, res, next) {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Manager has no business assigned' });
    }

    const { foodName, category, quantity, unit, purchaseDate, expiryDate, location } = req.body;
    
    if (!foodName || !category || !quantity || !unit) {
      return res.status(400).json({ error: 'foodName, category, quantity, unit are required' });
    }

    const item = await InventoryItem.create({
      ownerType: 'business',
      ownerId: businessId,
      userId: req.user._id,
      foodName,
      category,
      quantity,
      unit,
      purchaseDate: new Date(purchaseDate),
      expiryDate: new Date(expiryDate),
      location: location || 'warehouse',
      status: 'active',
    });

    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function updateInventoryItem(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, ownerType: 'business', ownerId: businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}

async function deleteInventoryItem(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const item = await InventoryItem.findOneAndDelete({
      _id: req.params.id,
      ownerType: 'business',
      ownerId: businessId,
    });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.status(200).json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

async function importCSV(req, res, next) {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Manager has no business assigned' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const results = { inserted: 0, skipped: 0, errors: [] };
    
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read()) !== null) {
        try {
          const { foodName, category, quantity, unit, purchaseDate, expiryDate, location } = record;
          
          if (!foodName || !category || !quantity || !unit) {
            results.skipped++;
            results.errors.push({ row: record, error: 'Missing required fields' });
            continue;
          }

          await InventoryItem.create({
            ownerType: 'business',
            ownerId: businessId,
            userId: req.user._id,
            foodName,
            category,
            quantity: parseFloat(quantity),
            unit,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            location: location || 'warehouse',
            status: 'active',
          });
          results.inserted++;
        } catch (e) {
          results.skipped++;
          results.errors.push({ row: record, error: e.message });
        }
      }
    });

    parser.on('error', (err) => {
      results.errors.push({ error: err.message });
    });

    parser.on('end', () => {
      return res.status(200).json(results);
    });

    parser.write(req.file.buffer.toString());
    parser.end();
  } catch (err) {
    next(err);
  }
}

async function listScans(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { page = 1, limit = 20, foodType, label, startDate, endDate } = req.query;
    
    const query = { businessId };
    if (foodType) query.foodType = { $regex: foodType, $options: 'i' };
    if (label) query.label = label;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [scans, total] = await Promise.all([
      Scan.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Scan.countDocuments(query),
    ]);

    return res.status(200).json({ scans, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

async function getWasteAnalytics(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { period = 'monthly' } = req.query; // 'weekly' or 'monthly'
    
    const wasteLogs = await WasteLog.find({ ownerType: 'business', ownerId: businessId })
      .sort({ createdAt: 1 });

    // Group by week or month
    const grouped = wasteLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt);
      let key;
      if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!acc[key]) {
        acc[key] = { label: key, totalCost: 0, items: {} };
      }
      acc[key].totalCost += log.estimatedCost || 0;
      const itemName = log.foodName;
      acc[key].items[itemName] = (acc[key].items[itemName] || 0) + (log.estimatedCost || 0);
      return acc;
    }, {});

    const labels = Object.keys(grouped).sort();
    const values = labels.map((k) => grouped[k].totalCost);
    
    // Find most wasted item
    const itemCosts = wasteLogs.reduce((acc, log) => {
      acc[log.foodName] = (acc[log.foodName] || 0) + (log.estimatedCost || 0);
      return acc;
    }, {});
    
    const mostWastedItem = Object.entries(itemCosts).sort((a, b) => b[1] - a[1])[0] || ['None', 0];
    const totalCost = wasteLogs.reduce((sum, w) => sum + (w.estimatedCost || 0), 0);

    return res.status(200).json({
      labels,
      values,
      mostWastedItem: { name: mostWastedItem[0], cost: mostWastedItem[1] },
      totalCost,
      period,
    });
  } catch (err) {
    next(err);
  }
}

async function generateWasteReportPDF(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const wasteLogs = await WasteLog.find({ ownerType: 'business', ownerId: businessId })
      .sort({ createdAt: -1 })
      .limit(100);

    const doc = new PDFDocument({ margin: 50 });
    const filename = `waste-report-${businessId}-${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Waste Cost Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Business ID: ${businessId}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Summary
    const totalCost = wasteLogs.reduce((sum, w) => sum + (w.estimatedCost || 0), 0);
    doc.fontSize(14).font('Helvetica-Bold').text('Summary');
    doc.fontSize(12).font('Helvetica').text(`Total Waste Cost: $${totalCost.toFixed(2)}`);
    doc.text(`Total Waste Entries: ${wasteLogs.length}`);
    doc.moveDown();

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    const colWidths = [80, 80, 60, 60, 100, 100];
    const headers = ['Date', 'Food Item', 'Qty', 'Unit', 'Est. Cost', 'Reason'];
    let x = 50;
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y, { width: colWidths[i], align: 'left' });
      x += colWidths[i];
    });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.font('Helvetica');
    wasteLogs.forEach((log) => {
      if (doc.y > 700) { doc.addPage(); }
      const date = new Date(log.createdAt).toLocaleDateString();
      const row = [
        date,
        log.foodName,
        log.quantity.toString(),
        log.unit,
        `$${(log.estimatedCost || 0).toFixed(2)}`,
        log.reason || 'N/A',
      ];
      x = 50;
      row.forEach((cell, i) => {
        doc.text(cell, x, doc.y, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

function getSmartAdvisorFallback(question, inventory = [], wasteLogs = [], language = 'en') {
  const q = (question || '').toLowerCase();

  const activeItems = inventory.filter((i) => i.status === 'active');
  const now = new Date();
  const expiringSoon = activeItems.filter((i) => {
    if (!i.expiryDate) return false;
    const diffDays = (new Date(i.expiryDate) - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  });

  if (q.includes('high spoilage') || q.includes('spoilage risk') || q.includes('expiring') || q.includes('risk items')) {
    if (expiringSoon.length > 0) {
      const itemList = expiringSoon
        .map((i) => `• **${i.foodName}** (${i.quantity} ${i.unit}, expires ${new Date(i.expiryDate).toLocaleDateString()})`)
        .join('\n');
      return `Based on your live store inventory, the following items require immediate action to avoid spoilage loss:\n\n${itemList}\n\n**Recommended Strategy:**\n1. Apply a 20-30% discount for early clearance.\n2. Move high-ethylene produce away from sensitive items.\n3. Ensure cold storage temperature remains at 2-4°C.`;
    } else if (activeItems.length > 0) {
      const produceItems = activeItems.filter((i) => ['fruit', 'vegetable'].includes(i.category));
      const itemList = (produceItems.length > 0 ? produceItems : activeItems)
        .slice(0, 4)
        .map((i) => `• **${i.foodName}** (${i.quantity} ${i.unit})`)
        .join('\n');
      return `Currently, all stock items have healthy expiration dates! However, your highest-turnover produce items to monitor closely are:\n\n${itemList}\n\n**Best Practices:**\n1. Rotate stock using FIFO (First-In, First-Out).\n2. Keep relative humidity at 85-90% for leafy greens.`;
    } else {
      return `No active inventory items found in your store database. To track high spoilage risks:\n1. Add items via **Stock Control** or upload a CSV.\n2. Run audit scans on incoming produce shipments.\n3. Set automated expiry reminder alerts.`;
    }
  }

  if (q.includes('cold storage') || q.includes('temperature') || q.includes('fridge') || q.includes('climate')) {
    return `**Optimal Storage Temperatures & Climate Standards:**\n\n1. **Fresh Vegetables (Leafy & Root)**: 2°C – 4°C (85-95% humidity)\n2. **Fresh Fruits (Apples, Berries)**: 3°C – 5°C (80-90% humidity)\n3. **Tropical Fruits (Bananas, Mangoes)**: 12°C – 14°C (Do not freeze! Cold causes chilling injury)\n4. **Dairy & Eggs**: 1°C – 3°C\n\n**Tip:** Keep cold room sensors active to detect temperature spikes before spoilage occurs.`;
  }

  if (q.includes('minimize') || q.includes('reduce') || q.includes('spoilage') || q.includes('waste') || q.includes('loss')) {
    return `**Executive Spoilage Reduction Protocol:**\n\n1. **Strict FIFO Rotation**: Ensure newly received produce goes behind existing stock on shelves.\n2. **Ethylene Gas Separation**: Keep high-ethylene emitters (Apples, Bananas, Tomatoes) separated from ethylene-sensitive greens (Carrots, Lettuce, Cucumbers).\n3. **Sanitization**: Disinfect storage bins weekly to eliminate mold spores.\n4. **Dynamic Pricing**: Mark down items 2 days prior to expiration to recover cost value.`;
  }

  return `**Business Advisory Insight:**\n\nTo optimize store profitability and minimize waste for your active inventory:\n\n1. **Stock Audit**: Perform regular visual and sensor audits on high-value shipments.\n2. **Inventory Balancing**: Maintain lean stock levels for highly perishable items.\n3. **Cold-Chain Management**: Ensure produce is refrigerated within 1 hour of delivery arrival.\n\nFeel free to ask about specific produce rotation, storage conditions, or waste reduction strategies!`;
}

async function chat(req, res, next) {
  try {
    const { question, language } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question required' });
    }

    const businessId = req.user.businessId;
    const inventory = await InventoryItem.find({ ownerType: 'business', ownerId: businessId }).limit(50);
    const wasteLogs = await WasteLog.find({ ownerType: 'business', ownerId: businessId })
      .sort({ createdAt: -1 }).limit(20);

    const inventorySummary = inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {});
    
    const wasteSummary = wasteLogs.reduce((acc, log) => {
      acc[log.foodName] = (acc[log.foodName] || 0) + (log.estimatedCost || 0);
      return acc;
    }, {});

    const context = `Business Inventory Summary: ${JSON.stringify(inventorySummary)}.
Recent Waste: ${JSON.stringify(wasteSummary)}.
User Role: Manager (shop owner). Focus on cost reduction, waste minimization, and inventory optimization.`;

    let reply = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.length > 20 && !apiKey.startsWith('AQ.')) {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const langInstruction = language === 'si' 
        ? 'Respond entirely in Sinhala (සිංහල).' 
        : language === 'ta' 
          ? 'Respond entirely in Tamil (தமிழ்).' 
          : 'Respond in English.';

      const prompt = `You are an executive AI business advisor for a food store manager.
Business Context:
${context}

${langInstruction}

Question: ${question}

Provide a concise, actionable response focused on business operations, cost savings, and waste reduction.`;

      const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
      for (const modelName of candidateModels) {
        try {
          const geminiModel = genAI.getGenerativeModel({ model: modelName });
          const result = await geminiModel.generateContent(prompt);
          const txt = result.response.text();
          if (txt && txt.trim()) {
            reply = txt;
            break;
          }
        } catch (apiErr) {
          console.warn(`[Gemini Model ${modelName}] Attempt failed:`, apiErr?.message || apiErr);
        }
      }
    }

    if (!reply) {
      reply = getSmartAdvisorFallback(question, inventory, wasteLogs, language);
    }

    return res.status(200).json({ reply });
  } catch (err) {
    next(err);
  }
}

// ─── Driver Management for Manager ────────────────────────────
async function getManagerDrivers(req, res, next) {
  try {
    const managerId = req.user._id;
    const managerObjId = mongoose.Types.ObjectId.isValid(managerId) ? new mongoose.Types.ObjectId(managerId) : managerId;
    
    const orConditions = [
      { managerId: managerId },
      { managerId: managerObjId },
    ];
    if (req.user.businessId) {
      const busObjId = mongoose.Types.ObjectId.isValid(req.user.businessId) ? new mongoose.Types.ObjectId(req.user.businessId) : req.user.businessId;
      orConditions.push({ managerId: req.user.businessId });
      orConditions.push({ managerId: busObjId });
    }

    const drivers = await User.find({
      role: 'driver',
      $or: orConditions,
    })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.status(200).json(drivers);
  } catch (err) {
    next(err);
  }
}

async function createOrLinkDriver(req, res, next) {
  try {
    const managerId = req.user._id;
    const { name, email, password, phone, vehicleType, licensePlate } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Driver email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let driver = await User.findOne({ email: cleanEmail });

    if (driver) {
      // If driver is already linked to this manager, return error asking for unique email
      if (driver.managerId && driver.managerId.toString() === managerId.toString()) {
        return res.status(400).json({
          error: `A driver with email "${cleanEmail}" is already in your store. Please enter a different email address for your new driver (e.g. driver2@gmail.com).`,
        });
      }

      // If existing user is not a driver, link them to this manager
      if (driver.role !== 'driver') {
        driver.role = 'driver';
      }
      driver.managerId = managerId;
      if (name) driver.name = name;
      if (phone) driver.phone = phone;
      if (vehicleType) driver.vehicleType = vehicleType;
      if (licensePlate) driver.licensePlate = licensePlate;
      await driver.save();
      return res.status(200).json({ message: 'Driver linked to your store successfully', driver });
    }

    if (!name || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required to register a new driver.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    driver = await User.create({
      name,
      email: cleanEmail,
      passwordHash,
      role: 'driver',
      managerId,
      phone: phone || '',
      vehicleType: vehicleType || 'Bicycle',
      licensePlate: licensePlate || '',
      driverStatus: 'available',
      isActive: true,
      lastLogin: null,
    });

    return res.status(201).json({ message: 'New driver created and linked to your store', driver });
  } catch (err) {
    next(err);
  }
}

async function assignDriverToOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;
    const managerId = req.user._id;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    const order = await Order.findOne({ _id: orderId, managerId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found or not owned by you' });
    }

    const driver = await User.findOne({ _id: driverId, role: 'driver' }) || await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    order.driverId = driverId;
    order.status = 'assigned';
    order.assignedAt = new Date();
    await order.save();

    // Socket real-time push
    const io = req.app.get('io');
    if (io) {
      const payload = {
        orderId: order._id.toString(),
        status: 'assigned',
        driverId: driver._id.toString(),
        driverName: driver.name,
        driverPhone: driver.phone || '',
        driverVehicle: driver.vehicleType || 'Bicycle',
      };
      io.to(`order:${order._id}`).emit('order_status_update', payload);
      io.to(`order:${order._id.toString()}`).emit('order_status_update', payload);
      io.emit('order_status_update', payload);
    }

    // In-app Notification for consumer
    try {
      await Notification.create({
        userId: order.consumerId,
        title: '🚴 Delivery Rider Assigned',
        message: `Driver ${driver.name} has been assigned to your order #${order._id.toString().slice(-6)}.`,
        type: 'order',
      });
    } catch (e) {}

    // In-app Notification for driver
    try {
      await Notification.create({
        userId: driverId,
        title: '📦 New Delivery Assigned',
        message: `Order #${order._id.toString().slice(-6)} has been assigned to you.`,
        type: 'order',
      });
    } catch (e) {}

    return res.status(200).json({ message: 'Driver assigned successfully', order });
  } catch (err) {
    next(err);
  }
}

async function updateManagerDriverStatus(req, res, next) {
  try {
    const { driverId } = req.params;
    const { driverStatus } = req.body;

    const validStatuses = ['available', 'delivering', 'offline'];
    if (!validStatuses.includes(driverStatus)) {
      return res.status(400).json({ error: 'Status must be available, delivering, or offline' });
    }

    let driver = null;
    if (mongoose.Types.ObjectId.isValid(driverId)) {
      driver = await User.findById(driverId);
    }
    if (!driver) {
      driver = await User.findOne({ email: driverId.trim().toLowerCase() });
    }

    if (!driver) {
      return res.status(404).json({ error: 'Driver account not found. Please refresh the driver list page.' });
    }

    driver.driverStatus = driverStatus;
    await driver.save();

    return res.status(200).json({ message: `Driver status updated to ${driverStatus}`, driver });
  } catch (err) {
    next(err);
  }
}

async function deleteManagerDriver(req, res, next) {
  try {
    const { driverId } = req.params;

    let driver = null;
    if (mongoose.Types.ObjectId.isValid(driverId)) {
      driver = await User.findById(driverId);
    }
    if (!driver) {
      driver = await User.findOne({ email: driverId.trim().toLowerCase() });
    }

    if (!driver) {
      return res.status(404).json({ error: 'Driver account not found. Please refresh the driver list page.' });
    }

    // Unassign driver from any active pending orders before removing
    await Order.updateMany({ driverId: driver._id, status: { $nin: ['delivered', 'rejected'] } }, { $set: { driverId: null, status: 'confirmed' } });
    await User.deleteOne({ _id: driver._id });

    return res.status(200).json({ message: 'Driver deleted from store successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  importCSV,
  listScans,
  getWasteAnalytics,
  generateWasteReportPDF,
  chat,
  getManagerDrivers,
  createOrLinkDriver,
  assignDriverToOrder,
  updateManagerDriverStatus,
  deleteManagerDriver,
};