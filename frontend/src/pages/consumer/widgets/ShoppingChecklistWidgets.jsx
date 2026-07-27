import React from 'react';

// ────────────────────────────────────────────────────────────
// VISUAL PRODUCT CATALOG DATA (Zero Typing Add)
// ────────────────────────────────────────────────────────────
export const VISUAL_PRODUCT_CATALOG = [
  // Produce - Fruits
  { name: 'Red Apples', category: 'Produce', emoji: '🍎', defaultUnit: 'kg', estPrice: 3.50, subcat: 'Fruit' },
  { name: 'Bananas', category: 'Produce', emoji: '🍌', defaultUnit: 'kg', estPrice: 1.80, subcat: 'Fruit' },
  { name: 'Avocados', category: 'Produce', emoji: '🥑', defaultUnit: 'pcs', estPrice: 2.50, subcat: 'Fruit' },
  { name: 'Oranges', category: 'Produce', emoji: '🍊', defaultUnit: 'kg', estPrice: 2.80, subcat: 'Fruit' },
  { name: 'Grapes', category: 'Produce', emoji: '🍇', defaultUnit: 'kg', estPrice: 3.90, subcat: 'Fruit' },
  { name: 'Strawberries', category: 'Produce', emoji: '🍓', defaultUnit: 'pack', estPrice: 3.20, subcat: 'Fruit' },
  { name: 'Lemons', category: 'Produce', emoji: '🍋', defaultUnit: 'pcs', estPrice: 1.20, subcat: 'Fruit' },

  // Produce - Vegetables
  { name: 'Fresh Tomatoes', category: 'Produce', emoji: '🍅', defaultUnit: 'kg', estPrice: 1.90, subcat: 'Vegetable' },
  { name: 'Organic Spinach', category: 'Produce', emoji: '🥬', defaultUnit: 'g', estPrice: 1.90, subcat: 'Vegetable' },
  { name: 'Carrots', category: 'Produce', emoji: '🥕', defaultUnit: 'kg', estPrice: 1.40, subcat: 'Vegetable' },
  { name: 'Onions', category: 'Produce', emoji: '🧅', defaultUnit: 'kg', estPrice: 1.20, subcat: 'Vegetable' },
  { name: 'Broccoli', category: 'Produce', emoji: '🥦', defaultUnit: 'pcs', estPrice: 2.10, subcat: 'Vegetable' },
  { name: 'Potatoes', category: 'Produce', emoji: '🥔', defaultUnit: 'kg', estPrice: 1.50, subcat: 'Vegetable' },
  { name: 'Cucumbers', category: 'Produce', emoji: '🥒', defaultUnit: 'pcs', estPrice: 1.10, subcat: 'Vegetable' },

  // Dairy
  { name: 'Fresh Milk', category: 'Dairy', emoji: '🥛', defaultUnit: 'L', estPrice: 2.80 },
  { name: 'Eggs', category: 'Dairy', emoji: '🥚', defaultUnit: 'pcs', estPrice: 3.20 },
  { name: 'Butter', category: 'Dairy', emoji: '🧈', defaultUnit: 'g', estPrice: 2.90 },
  { name: 'Cheddar Cheese', category: 'Dairy', emoji: '🧀', defaultUnit: 'g', estPrice: 3.80 },
  { name: 'Greek Yogurt', category: 'Dairy', emoji: '🍦', defaultUnit: 'pack', estPrice: 2.40 },

  // Bakery
  { name: 'Whole Wheat Bread', category: 'Bakery', emoji: '🍞', defaultUnit: 'loaf', estPrice: 2.20 },
  { name: 'Croissants', category: 'Bakery', emoji: '🥐', defaultUnit: 'pcs', estPrice: 1.80 },
  { name: 'Bagels', category: 'Bakery', emoji: '🥯', defaultUnit: 'pack', estPrice: 2.50 },

  // Meat & Seafood
  { name: 'Chicken Breast', category: 'Meat', emoji: '🍗', defaultUnit: 'g', estPrice: 5.50 },
  { name: 'Beef Steak', category: 'Meat', emoji: '🥩', defaultUnit: 'kg', estPrice: 8.90 },
  { name: 'Salmon Fillet', category: 'Meat', emoji: '🐟', defaultUnit: 'g', estPrice: 7.50 },

  // Pantry
  { name: 'Olive Oil', category: 'Pantry', emoji: '🫒', defaultUnit: 'L', estPrice: 6.50 },
  { name: 'Basmati Rice', category: 'Pantry', emoji: '📦', defaultUnit: 'kg', estPrice: 4.20 },
  { name: 'Ground Coffee', category: 'Pantry', emoji: '☕', defaultUnit: 'g', estPrice: 5.00 },
];

// ────────────────────────────────────────────────────────────
// 5 SUGGESTED PROXIMITY STORES DATA (Map fallback)
// ────────────────────────────────────────────────────────────
export const FALLBACK_5_NEARBY_SHOPS = [
  {
    _id: 'shop-1',
    shopName: 'Fresh Mart Supermarket',
    address: '142 Galle Road, Colombo 03',
    distanceKm: 0.6,
    deliveryTimeMinutes: '10–15 min',
    rating: 4.9,
    reviewsCount: 184,
    isVerified: true,
    deliveryFee: 1.50,
    coords: [6.9271, 79.8612],
    hours: '7am – 10pm',
  },
  {
    _id: 'shop-2',
    shopName: 'Green Organic Pantry',
    address: '88 Duplication Road, Colombo 04',
    distanceKm: 1.2,
    deliveryTimeMinutes: '15–20 min',
    rating: 4.8,
    reviewsCount: 142,
    isVerified: true,
    deliveryFee: 2.00,
    coords: [6.9150, 79.8650],
    hours: '8am – 9pm',
  },
  {
    _id: 'shop-3',
    shopName: 'City Express Grocery',
    address: '25 Havelock Road, Colombo 05',
    distanceKm: 2.1,
    deliveryTimeMinutes: '18–25 min',
    rating: 4.7,
    reviewsCount: 96,
    isVerified: true,
    deliveryFee: 0.00,
    coords: [6.9010, 79.8700],
    hours: '24/7 Open',
  },
  {
    _id: 'shop-4',
    shopName: 'Sunland Fresh Produce Market',
    address: '310 Kynsey Road, Colombo 08',
    distanceKm: 3.5,
    deliveryTimeMinutes: '20–30 min',
    rating: 4.9,
    reviewsCount: 215,
    isVerified: true,
    deliveryFee: 2.50,
    coords: [6.9180, 79.8780],
    hours: '7am – 9:30pm',
  },
  {
    _id: 'shop-5',
    shopName: 'QuickPick Express Super',
    address: '12 Main Street, Colombo Central',
    distanceKm: 4.8,
    deliveryTimeMinutes: '25–35 min',
    rating: 4.6,
    reviewsCount: 78,
    isVerified: true,
    deliveryFee: 1.80,
    coords: [6.9350, 79.8500],
    hours: '8am – 11pm',
  },
];

// ────────────────────────────────────────────────────────────
// SMART FOOD & UNIT PARSER ENGINE
// ────────────────────────────────────────────────────────────
export function detectCategoryAndEmoji(name, fallbackCategory = 'Produce') {
  const n = (name || '').toLowerCase();

  if (n.includes('milk') || n.includes('cheese') || n.includes('butter') || n.includes('egg') || n.includes('yogurt') || n.includes('yoghurt') || n.includes('cream') || n.includes('curd') || n.includes('paneer')) {
    let emoji = '🥛';
    if (n.includes('egg')) emoji = '🥚';
    if (n.includes('cheese')) emoji = '🧀';
    if (n.includes('butter')) emoji = '🧈';
    if (n.includes('yogurt') || n.includes('yoghurt')) emoji = '🍦';
    return { category: 'Dairy', emoji };
  }
  if (n.includes('bread') || n.includes('loaf') || n.includes('bun') || n.includes('pastry') || n.includes('croissant') || n.includes('cake') || n.includes('bagel') || n.includes('toast') || n.includes('muffin')) {
    return { category: 'Bakery', emoji: '🍞' };
  }
  if (n.includes('chicken') || n.includes('beef') || n.includes('pork') || n.includes('meat') || n.includes('fish') || n.includes('salmon') || n.includes('steak') || n.includes('turkey') || n.includes('bacon') || n.includes('sausage') || n.includes('shrimp') || n.includes('prawn')) {
    let emoji = '🥩';
    if (n.includes('chicken') || n.includes('poultry')) emoji = '🍗';
    if (n.includes('fish') || n.includes('salmon')) emoji = '🐟';
    if (n.includes('shrimp') || n.includes('prawn')) emoji = '🦐';
    return { category: 'Meat', emoji };
  }
  if (n.includes('apple') || n.includes('banana') || n.includes('orange') || n.includes('tomato') || n.includes('spinach') || n.includes('avocado') || n.includes('carrot') || n.includes('onion') || n.includes('potato') || n.includes('berry') || n.includes('grapes') || n.includes('lemon') || n.includes('lime') || n.includes('fruit') || n.includes('veg') || n.includes('lettuce') || n.includes('cucumber') || n.includes('garlic')) {
    let emoji = '🍎';
    if (n.includes('banana')) emoji = '🍌';
    if (n.includes('avocado')) emoji = '🥑';
    if (n.includes('tomato')) emoji = '🍅';
    if (n.includes('carrot')) emoji = '🥕';
    if (n.includes('onion')) emoji = '🧅';
    if (n.includes('spinach') || n.includes('lettuce')) emoji = '🥬';
    if (n.includes('orange') || n.includes('lemon')) emoji = '🍊';
    if (n.includes('grapes')) emoji = '🍇';
    return { category: 'Produce', emoji };
  }
  if (n.includes('rice') || n.includes('oil') || n.includes('flour') || n.includes('sugar') || n.includes('salt') || n.includes('pasta') || n.includes('sauce') || n.includes('spice') || n.includes('cereal') || n.includes('noodle') || n.includes('coffee') || n.includes('tea') || n.includes('water') || n.includes('juice') || n.includes('snack')) {
    let emoji = '📦';
    if (n.includes('oil')) emoji = '🫒';
    if (n.includes('coffee') || n.includes('tea')) emoji = '☕';
    if (n.includes('water') || n.includes('juice')) emoji = '🧃';
    return { category: 'Pantry', emoji };
  }
  const cat = fallbackCategory || 'Produce';
  let emoji = '🛒';
  if (cat === 'Produce') emoji = '🍎';
  if (cat === 'Dairy') emoji = '🥛';
  if (cat === 'Bakery') emoji = '🍞';
  if (cat === 'Meat') emoji = '🥩';
  if (cat === 'Pantry') emoji = '📦';
  return { category: cat, emoji };
}

export function smartParseGroceryItem(rawText, userQty = '1', userUnit = 'unit', userCat = 'Produce') {
  if (!rawText || typeof rawText !== 'string') {
    return { name: '', quantityNum: 1, unit: 'unit', category: userCat, emoji: '🛒' };
  }
  let text = rawText.trim();
  let quantityNum = parseFloat(userQty) || 1;
  let unit = userUnit && userUnit !== 'unit' ? userUnit : 'unit';
  let cleanName = text;

  const knownUnits = { kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg', g: 'g', gram: 'g', grams: 'g', l: 'L', liter: 'L', liters: 'L', litre: 'L', litres: 'L', ml: 'ml', milliliter: 'ml', milliliters: 'ml', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', oz: 'oz', ounce: 'oz', ounces: 'oz', dozen: 'dozen', doz: 'dozen', pack: 'pack', packs: 'pack', packet: 'pack', packets: 'pack', loaf: 'loaf', loaves: 'loaf', bottle: 'bottle', bottles: 'bottle', can: 'can', cans: 'can', pcs: 'pcs', pc: 'pcs', piece: 'pcs', pieces: 'pcs' };
  const leadingMatch = text.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?[\s\-_]*(.*)$/i);
  if (leadingMatch) {
    const parsedNum = parseFloat(leadingMatch[1]);
    const parsedUnitCandidate = (leadingMatch[2] || '').toLowerCase();
    const restOfName = leadingMatch[3].trim();
    if (!isNaN(parsedNum) && parsedNum > 0) {
      if (parsedUnitCandidate && knownUnits[parsedUnitCandidate]) {
        quantityNum = parsedNum;
        unit = knownUnits[parsedUnitCandidate];
        cleanName = restOfName;
      } else if (parsedUnitCandidate && !restOfName) {
        quantityNum = parsedNum;
        unit = 'pcs';
        cleanName = parsedUnitCandidate;
      } else if (parsedUnitCandidate && restOfName) {
        quantityNum = parsedNum;
        unit = 'pcs';
        cleanName = `${parsedUnitCandidate} ${restOfName}`;
      } else if (restOfName) {
        quantityNum = parsedNum;
        unit = 'pcs';
        cleanName = restOfName;
      }
    }
  }
  cleanName = cleanName.replace(/^[\s\-_]+|[\s\-_]+$/g, '').replace(/[\-_]+/g, ' ').replace(/\s+/g, ' ');
  cleanName = cleanName.split(' ').map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '')).join(' ').trim();
  if (!cleanName) cleanName = rawText;
  const { category, emoji } = detectCategoryAndEmoji(cleanName, userCat);
  return { name: cleanName, quantityNum, unit, qty: `${quantityNum} ${unit}`, category, emoji };
}

export function sanitizeChecklistSingleItem(item) {
  if (!item || !item.name) return item;
  const parsed = smartParseGroceryItem(item.name, item.quantityNum || 1, item.unit || 'unit', item.category || 'Produce');
  return { ...item, name: parsed.name, quantityNum: parsed.quantityNum > 1 ? parsed.quantityNum : (item.quantityNum || 1), unit: parsed.unit !== 'unit' ? parsed.unit : (item.unit || 'unit'), qty: `${parsed.quantityNum > 1 ? parsed.quantityNum : (item.quantityNum || 1)} ${parsed.unit !== 'unit' ? parsed.unit : (item.unit || 'unit')}`, category: parsed.category || item.category || 'Produce', emoji: parsed.emoji || item.emoji || '🛒' };
}
