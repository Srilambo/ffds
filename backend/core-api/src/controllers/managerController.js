const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const InventoryItem = require('../models/InventoryItem');
const WasteLog = require('../models/WasteLog');
const User = require('../models/User');
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

async function chat(req, res, next) {
  try {
    const { question, language } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question required' });
    }

    const businessId = req.user.businessId;
    // Get recent business context: inventory summary + waste summary
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

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const langInstruction = language === 'si' 
      ? 'Respond entirely in Sinhala (සිංහල).' 
      : language === 'ta' 
        ? 'Respond entirely in Tamil (தமிழ்).' 
        : 'Respond in English.';

    const prompt = `You are a business advisor for a food store manager.
Business Context:
${context}

${langInstruction}

Question: ${question}

Provide a concise, actionable response focused on business operations, cost savings, and waste reduction.`;

    let reply;
    try {
      const result = await geminiModel.generateContent(prompt);
      reply = result.response.text();
    } catch (apiErr) {
      console.warn('Gemini API call failed in manager chat:', apiErr?.message || apiErr);
      reply = `[AI Advisor Offline] I am currently responding in offline advisory mode.

Recommended strategies for your store:
1. **FIFO Stock Management**: Prioritize selling older inventory first to minimize spoilage loss.
2. **Cold Storage Optimization**: Maintain cold room temperatures at 2-4°C for fresh produce.
3. **Batch Audits**: Perform scans on incoming produce shipments to catch early degradation.

Ask specific questions regarding fruit rotation, inventory layout, or storage conditions!`;
    }

    return res.status(200).json({ reply });
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
};