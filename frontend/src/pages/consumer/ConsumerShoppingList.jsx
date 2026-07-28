import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

// Map Pins
const userPinIcon = L.divIcon({
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">📍</div>',
  className: 'custom-leaflet-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const storePinIcon = L.divIcon({
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🏪</div>',
  className: 'custom-leaflet-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const riderPinIcon = L.divIcon({
  html: '<div style="font-size: 30px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));" class="animate-bounce">🚴</div>',
  className: 'custom-leaflet-pin',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function FlyToLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] && center[1]) {
      map.setView(center, 14);
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, [center, map]);
  return null;
}

function MapEventsHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const DEFAULT_SHOPPING = [
  { id: '1', name: 'Fresh Milk', qty: '1 Liter', quantityNum: 1, unit: 'Liter', estimatedPrice: 2.80, category: 'Dairy', checked: false, emoji: '🥛', priority: 'high', source: 'manual' },
  { id: '2', name: 'Whole Wheat Bread', qty: '1 loaf', quantityNum: 1, unit: 'loaf', estimatedPrice: 2.20, category: 'Bakery', checked: false, emoji: '🍞', priority: 'normal', source: 'manual' },
  { id: '3', name: 'Red Apples', qty: '1 kg', quantityNum: 1, unit: 'kg', estimatedPrice: 3.50, category: 'Produce', checked: false, emoji: '🍎', priority: 'medium', source: 'manual' },
  { id: '4', name: 'Organic Spinach', qty: '200g', quantityNum: 1, unit: 'pack', estimatedPrice: 1.90, category: 'Produce', checked: true, emoji: '🥬', priority: 'normal', source: 'manual' },
  { id: '5', name: 'Eggs', qty: '1 dozen', quantityNum: 1, unit: 'dozen', estimatedPrice: 3.20, category: 'Dairy', checked: false, emoji: '🥚', priority: 'high', source: 'manual' },
];

const POPULAR_QUICK_SUGGESTIONS = [
  { name: 'Fresh Milk', category: 'Dairy', emoji: '🥛', qty: '1 Liter', estPrice: 2.80 },
  { name: 'Whole Wheat Bread', category: 'Bakery', emoji: '🍞', qty: '1 loaf', estPrice: 2.20 },
  { name: 'Eggs', category: 'Dairy', emoji: '🥚', qty: '1 dozen', estPrice: 3.20 },
  { name: 'Red Apples', category: 'Produce', emoji: '🍎', qty: '1 kg', estPrice: 3.50 },
  { name: 'Bananas', category: 'Produce', emoji: '🍌', qty: '1 bunch', estPrice: 1.80 },
  { name: 'Avocado', category: 'Produce', emoji: '🥑', qty: '2 pcs', estPrice: 2.50 },
  { name: 'Butter', category: 'Dairy', emoji: '🧈', qty: '200g', estPrice: 2.90 },
  { name: 'Cheddar Cheese', category: 'Dairy', emoji: '🧀', qty: '250g', estPrice: 3.80 },
  { name: 'Chicken Breast', category: 'Meat', emoji: '🍗', qty: '500g', estPrice: 5.50 },
  { name: 'Fresh Tomatoes', category: 'Produce', emoji: '🍅', qty: '500g', estPrice: 1.90 },
  { name: 'Carrots', category: 'Produce', emoji: '🥕', qty: '1 kg', estPrice: 1.40 },
  { name: 'Onions', category: 'Produce', emoji: '🧅', qty: '1 kg', estPrice: 1.20 },
];

export function generate5ProximityStores(lat = 9.7833, lng = 80.0167) {
  return [
    {
      _id: 'shop-tellippalai-1',
      shopName: 'Tellippalai Fresh Supermarket',
      address: '142 Kankesanthurai Road, Tellippalai, Jaffna',
      distanceKm: 0.6,
      deliveryTimeMinutes: '10–15 min',
      rating: 4.9,
      reviewsCount: 184,
      isVerified: true,
      deliveryFee: 1.50,
      coords: [lat + 0.003, lng + 0.004],
      hours: '6:30am – 10:00pm',
    },
    {
      _id: 'shop-chunnakam-2',
      shopName: 'Chunnakam Organic Pantry',
      address: '88 Station Road, Chunnakam, Jaffna',
      distanceKm: 1.2,
      deliveryTimeMinutes: '15–20 min',
      rating: 4.8,
      reviewsCount: 142,
      isVerified: true,
      deliveryFee: 2.00,
      coords: [lat - 0.005, lng + 0.003],
      hours: '7:00am – 9:30pm',
    },
    {
      _id: 'shop-jaffna-3',
      shopName: 'Jaffna City Express Grocery',
      address: '25 Hospital Road, Jaffna Town',
      distanceKm: 2.1,
      deliveryTimeMinutes: '18–25 min',
      rating: 4.7,
      reviewsCount: 96,
      isVerified: true,
      deliveryFee: 0.00,
      coords: [lat + 0.007, lng - 0.006],
      hours: '24/7 Open',
    },
    {
      _id: 'shop-kokkuvil-4',
      shopName: 'Kokkuvil Green Farmers Market',
      address: '12 Palaly Road, Kokkuvil, Jaffna',
      distanceKm: 3.5,
      deliveryTimeMinutes: '20–30 min',
      rating: 4.9,
      reviewsCount: 215,
      isVerified: true,
      deliveryFee: 2.50,
      coords: [lat - 0.008, lng - 0.007],
      hours: '7:00am – 9:00pm',
    },
    {
      _id: 'shop-kondavil-5',
      shopName: 'Kondavil QuickPick Super',
      address: '45 Point Pedro Road, Kondavil, Jaffna',
      distanceKm: 4.8,
      deliveryTimeMinutes: '25–35 min',
      rating: 4.6,
      reviewsCount: 78,
      isVerified: true,
      deliveryFee: 1.80,
      coords: [lat + 0.010, lng + 0.009],
      hours: '7:00am – 9:30pm',
    },
  ];
}

const VISUAL_PRODUCT_CATALOG = [
  { name: 'Red Apples', category: 'Produce', emoji: '🍎', defaultUnit: 'kg', estPrice: 3.50, subcat: 'Fruit' },
  { name: 'Bananas', category: 'Produce', emoji: '🍌', defaultUnit: 'kg', estPrice: 1.80, subcat: 'Fruit' },
  { name: 'Avocados', category: 'Produce', emoji: '🥑', defaultUnit: 'pcs', estPrice: 2.50, subcat: 'Fruit' },
  { name: 'Oranges', category: 'Produce', emoji: '🍊', defaultUnit: 'kg', estPrice: 2.80, subcat: 'Fruit' },
  { name: 'Grapes', category: 'Produce', emoji: '🍇', defaultUnit: 'kg', estPrice: 3.90, subcat: 'Fruit' },
  { name: 'Strawberries', category: 'Produce', emoji: '🍓', defaultUnit: 'pack', estPrice: 3.20, subcat: 'Fruit' },
  { name: 'Lemons', category: 'Produce', emoji: '🍋', defaultUnit: 'pcs', estPrice: 1.20, subcat: 'Fruit' },
  { name: 'Fresh Tomatoes', category: 'Produce', emoji: '🍅', defaultUnit: 'kg', estPrice: 1.90, subcat: 'Vegetable' },
  { name: 'Organic Spinach', category: 'Produce', emoji: '🥬', defaultUnit: 'g', estPrice: 1.90, subcat: 'Vegetable' },
  { name: 'Carrots', category: 'Produce', emoji: '🥕', defaultUnit: 'kg', estPrice: 1.40, subcat: 'Vegetable' },
  { name: 'Onions', category: 'Produce', emoji: '🧅', defaultUnit: 'kg', estPrice: 1.20, subcat: 'Vegetable' },
  { name: 'Broccoli', category: 'Produce', emoji: '🥦', defaultUnit: 'pcs', estPrice: 2.10, subcat: 'Vegetable' },
  { name: 'Potatoes', category: 'Produce', emoji: '🥔', defaultUnit: 'kg', estPrice: 1.50, subcat: 'Vegetable' },
  { name: 'Cucumbers', category: 'Produce', emoji: '🥒', defaultUnit: 'pcs', estPrice: 1.10, subcat: 'Vegetable' },
  { name: 'Fresh Milk', category: 'Dairy', emoji: '🥛', defaultUnit: 'L', estPrice: 2.80 },
  { name: 'Eggs', category: 'Dairy', emoji: '🥚', defaultUnit: 'pcs', estPrice: 3.20 },
  { name: 'Butter', category: 'Dairy', emoji: '🧈', defaultUnit: 'g', estPrice: 2.90 },
  { name: 'Cheddar Cheese', category: 'Dairy', emoji: '🧀', defaultUnit: 'g', estPrice: 3.80 },
  { name: 'Greek Yogurt', category: 'Dairy', emoji: '🍦', defaultUnit: 'pack', estPrice: 2.40 },
  { name: 'Whole Wheat Bread', category: 'Bakery', emoji: '🍞', defaultUnit: 'loaf', estPrice: 2.20 },
  { name: 'Croissants', category: 'Bakery', emoji: '🥐', defaultUnit: 'pcs', estPrice: 1.80 },
  { name: 'Bagels', category: 'Bakery', emoji: '🥯', defaultUnit: 'pack', estPrice: 2.50 },
  { name: 'Chicken Breast', category: 'Meat', emoji: '🍗', defaultUnit: 'g', estPrice: 5.50 },
  { name: 'Beef Steak', category: 'Meat', emoji: '🥩', defaultUnit: 'kg', estPrice: 8.90 },
  { name: 'Salmon Fillet', category: 'Meat', emoji: '🐟', defaultUnit: 'g', estPrice: 7.50 },
  { name: 'Olive Oil', category: 'Pantry', emoji: '🫒', defaultUnit: 'L', estPrice: 6.50 },
  { name: 'Basmati Rice', category: 'Pantry', emoji: '📦', defaultUnit: 'kg', estPrice: 4.20 },
  { name: 'Ground Coffee', category: 'Pantry', emoji: '☕', defaultUnit: 'g', estPrice: 5.00 },
];

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

const SRI_LANKA_POSTAL_CODES = [
  { code: '40000', name: 'Jaffna Main Town', district: 'Jaffna', coords: [9.6615, 80.0255] },
  { code: '40045', name: 'Mandativu', district: 'Jaffna', coords: [9.6200, 79.9950] },
  { code: '40048', name: 'Allaipiddy', district: 'Jaffna', coords: [9.6050, 79.9450] },
  { code: '40060', name: 'Kokkuvil', district: 'Jaffna', coords: [9.6950, 80.0220] },
  { code: '40062', name: 'Kondavil', district: 'Jaffna', coords: [9.7080, 80.0310] },
  { code: '40075', name: 'Chunnakam', district: 'Jaffna', coords: [9.7430, 80.0380] },
  { code: '40080', name: 'Erlalai', district: 'Jaffna', coords: [9.7800, 80.0300] },
  { code: '40095', name: 'Inuvil', district: 'Jaffna', coords: [9.7210, 80.0250] },
  { code: '40098', name: 'Sandilipay', district: 'Jaffna', coords: [9.7350, 79.9850] },
  { code: '40100', name: 'Pandaterippu', district: 'Jaffna', coords: [9.7680, 79.9720] },
  { code: '40108', name: 'Ilavalai', district: 'Jaffna', coords: [9.8020, 79.9750] },
  { code: '40110', name: 'Mathagal', district: 'Jaffna', coords: [9.8210, 79.9550] },
  { code: '40120', name: 'Alaveddy', district: 'Jaffna', coords: [9.7650, 80.0210] },
  { code: '40130', name: 'Tellipalai / Tellippalai', district: 'Jaffna', coords: [9.7833, 80.0167] },
  { code: '40142', name: 'Mallakam', district: 'Jaffna', coords: [9.7560, 80.0280] },
  { code: '40145', name: 'Vasavilan', district: 'Jaffna', coords: [9.7750, 80.0620] },
  { code: '40150', name: 'Achchuvely', district: 'Jaffna', coords: [9.7620, 80.0910] },
  { code: '40158', name: 'Puttur', district: 'Jaffna', coords: [9.7320, 80.0980] },
  { code: '40165', name: 'Neervely', district: 'Jaffna', coords: [9.7150, 80.0750] },
  { code: '40170', name: 'Kopay', district: 'Jaffna', coords: [9.6980, 80.0620] },
  { code: '40180', name: 'Urumpirai', district: 'Jaffna', coords: [9.7120, 80.0410] },
  { code: '40190', name: 'Kankesanthurai (KKS)', district: 'Jaffna', coords: [9.8150, 80.0450] },
  { code: '40198', name: 'Anaicoddai', district: 'Jaffna', coords: [9.6820, 79.9950] },
  { code: '40200', name: 'Manipay', district: 'Jaffna', coords: [9.6980, 79.9880] },
  { code: '40212', name: 'Chankanai', district: 'Jaffna', coords: [9.7350, 79.9620] },
  { code: '40220', name: 'Vaddukoddai', district: 'Jaffna', coords: [9.7150, 79.9380] },
  { code: '40230', name: 'Chulipuram', district: 'Jaffna', coords: [9.7520, 79.9320] },
  { code: '40250', name: 'Karainagar', district: 'Jaffna', coords: [9.7380, 79.8820] },
  { code: '40270', name: 'Kayts', district: 'Jaffna', coords: [9.6750, 79.9120] },
  { code: '40300', name: 'Velanai', district: 'Jaffna', coords: [9.6380, 79.9050] },
  { code: '40400', name: 'Kaitadi', district: 'Jaffna', coords: [9.6620, 80.0980] },
  { code: '40500', name: 'Chavakachcheri', district: 'Jaffna', coords: [9.6550, 80.1650] },
  { code: '40600', name: 'Point Pedro', district: 'Jaffna', coords: [9.8250, 80.2333] },
  { code: '43000', name: 'Kilinochchi Town', district: 'Kilinochchi', coords: [9.3803, 80.3992] },
  { code: '00100', name: 'Colombo 01 (Fort / Pettah)', district: 'Colombo', coords: [6.9344, 79.8428] },
];

export function ConsumerShoppingList() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ffds_shopping_checklist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((i) => sanitizeChecklistSingleItem(i));
        }
      }
      return DEFAULT_SHOPPING.map((i) => sanitizeChecklistSingleItem(i));
    } catch {
      return DEFAULT_SHOPPING.map((i) => sanitizeChecklistSingleItem(i));
    }
  });
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('unit');
  const [newItemCategory, setNewItemCategory] = useState('Produce');
  const [newItemPriority, setNewItemPriority] = useState('normal');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [showVisualCatalog, setShowVisualCatalog] = useState(false);
  const [visualCatFilter, setVisualCatFilter] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loadingShops, setLoadingShops] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '' });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeChecklistOrder, setActiveChecklistOrder] = useState({
    _id: 'INV-323809',
    shopName: 'super fast',
    totalAmount: 56.60,
    paymentMethod: 'cash',
    itemsCount: 5,
    deliveryOtp: '7413',
  });
  const [checklistOrderStatus, setChecklistOrderStatus] = useState({ status: 'delivered' });
  const [deliveryRiderPos, setDeliveryRiderPos] = useState([9.7845, 80.0270]);
  const [showBillHistoryModal, setShowBillHistoryModal] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [riderRating, setRiderRating] = useState(5);
  const [storeRating, setStoreRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedReviewTags, setSelectedReviewTags] = useState(['⚡ Fast 10-Min Delivery', '🍎 Super Fresh Produce']);
  const [submittedReview, setSubmittedReview] = useState(null);

  const [userCustomLocation, setUserCustomLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('ffds_user_custom_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [postalSearchQuery, setPostalSearchQuery] = useState('');
  const [selectedPostalLocation, setSelectedPostalLocation] = useState({
    code: '40130',
    name: 'Tellipalai / Tellippalai',
    district: 'Jaffna',
    coords: [9.7833, 80.0167],
  });

  const DEFAULT_DEMO_BILLS = [
    {
      id: 'INV-323809',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      shopName: 'super fast',
      shopAddress: 'Jaffna Main Road, Tellipalai',
      items: [
        { name: 'Fresh Milk (1 Liter)', qty: '2 Liter', price: 5.00, emoji: '🥛' },
        { name: 'Whole Wheat Bread', qty: '1 loaf', price: 3.20, emoji: '🍞' },
        { name: 'Fresh Farm Eggs', qty: '1 dozen', price: 4.50, emoji: '🥚' },
        { name: 'Red Apples', qty: '2 kg', price: 8.40, emoji: '🍎' },
        { name: 'Fresh Bananas', qty: '1.5 kg', price: 4.50, emoji: '🍌' },
        { name: 'Avocado', qty: '4 pcs', price: 10.00, emoji: '🥑' },
        { name: 'Fresh Tomatoes', qty: '2 kg', price: 6.00, emoji: '🍅' },
      ],
      subtotal: 54.60,
      deliveryFee: 1.50,
      ecoFee: 0.50,
      grandTotal: 56.60,
      paymentMethod: 'cash',
      deliveryOtp: '7413',
      status: 'Delivered 🎉',
      review: {
        riderRating: 5,
        storeRating: 5,
        reviewText: 'Super fast delivery in 10 mins! Produce was fresh.',
        tags: ['⚡ Fast 10-Min Delivery', '🍎 Super Fresh Produce'],
      }
    },
  ];

  const [billHistory, setBillHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ffds_bill_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return DEFAULT_DEMO_BILLS;
  });

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const reviewData = {
      orderId: activeChecklistOrder?._id || 'INV-323809',
      riderName: 'Nimal Perera (#402)',
      riderRating,
      storeRating,
      reviewText: reviewText.trim() || 'Great delivery service and super fresh produce!',
      tags: selectedReviewTags,
      createdAt: new Date().toISOString(),
    };
    setSubmittedReview(reviewData);

    setBillHistory(prev => prev.map(bill => {
      if (bill.id === activeChecklistOrder?._id) {
        return { ...bill, review: reviewData };
      }
      return bill;
    }));

    try {
      localStorage.setItem('ffds_last_review', JSON.stringify(reviewData));
    } catch { }

    setShowReviewModal(false);
    setSyncMsg('⭐ Thank you! Your delivery & produce review has been submitted successfully.');
    setTimeout(() => setSyncMsg(''), 5000);
  };

  useEffect(() => {
    try { localStorage.setItem('ffds_shopping_checklist', JSON.stringify(items)); } catch { }
  }, [items]);

  useEffect(() => {
    if (user?.cardDetails) {
      const num = user.cardDetails.cardNumberMasked || '';
      const exp = user.cardDetails.expiryDate || '';
      setCardForm((prev) => ({
        ...prev,
        number: prev.number || num,
        expiry: prev.expiry || exp,
      }));
    }
  }, [user]);

  const handleModalCardNumberChange = (e) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 16);
    const formatted = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
    setCardForm((prev) => ({ ...prev, number: formatted }));
  };

  const handleModalCardExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 4) raw = raw.slice(0, 4);

    let formatted = '';
    if (raw.length > 0) {
      let m = raw.slice(0, 2);
      if (raw.length === 1 && parseInt(raw[0], 10) > 1) {
        m = '0' + raw[0];
        raw = m;
      } else if (m.length === 2) {
        const monthNum = parseInt(m, 10);
        if (monthNum < 1) m = '01';
        if (monthNum > 12) m = '12';
      }
      formatted = m;
      if (raw.length > 2) {
        formatted += '/' + raw.slice(2, 4);
      } else if (raw.length === 2 && e.nativeEvent.inputType !== 'deleteContentBackward') {
        formatted += '/';
      }
    }
    setCardForm((prev) => ({ ...prev, expiry: formatted }));
  };

  useEffect(() => {
    const lat = userCustomLocation?.lat || selectedPostalLocation?.coords?.[0] || 9.7833;
    const lng = userCustomLocation?.lng || selectedPostalLocation?.coords?.[1] || 80.0167;
    fetchBackendShops(lat, lng);
  }, [selectedPostalLocation, userCustomLocation]);

  useEffect(() => {
    if (!activeChecklistOrder) return;
    const shopLat = selectedShop?.coords?.[0] || 9.7850;
    const shopLng = selectedShop?.coords?.[1] || 80.0280;
    const userLat = user?.location?.coordinates?.[1] || 9.7831;
    const userLng = user?.location?.coordinates?.[0] || 80.0255;

    setDeliveryRiderPos([shopLat, shopLng]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.1;
      if (progress >= 1) {
        progress = 1;
        setChecklistOrderStatus({ status: 'delivered' });
        clearInterval(interval);
      } else if (progress > 0.6) {
        setChecklistOrderStatus({ status: 'on_the_way' });
      } else if (progress > 0.3) {
        setChecklistOrderStatus({ status: 'preparing' });
      } else {
        setChecklistOrderStatus({ status: 'accepted' });
      }

      const curLat = shopLat + (userLat - shopLat) * progress;
      const curLng = shopLng + (userLng - shopLng) * progress;
      setDeliveryRiderPos([curLat, curLng]);
    }, 2500);

    return () => clearInterval(interval);
  }, [activeChecklistOrder]);

  useEffect(() => {
    if (!socket || !activeChecklistOrder) return;
    socket.emit('join_order', activeChecklistOrder._id);
    socket.on('order_status_update', (update) => {
      if (update.orderId === activeChecklistOrder._id) setChecklistOrderStatus(update);
    });
    return () => {
      socket.off('order_status_update');
      socket.emit('leave_order', activeChecklistOrder._id);
    };
  }, [socket, activeChecklistOrder]);

  const toggleItem = (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const removeItem = (id, e) => {
    e?.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const adjustItemQuantity = (id, delta, e) => {
    e?.stopPropagation();
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const currentQty = i.quantityNum || 1;
        const newQty = Math.max(1, currentQty + delta);
        return { ...i, quantityNum: newQty, qty: `${newQty} ${i.unit || 'unit'}` };
      })
    );
  };

  const changeItemUnit = (id, newUnit, e) => {
    e?.stopPropagation();
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const qNum = i.quantityNum || 1;
        return { ...i, unit: newUnit, qty: `${qNum} ${newUnit}` };
      })
    );
  };

  const cyclePriority = (id, e) => {
    e?.stopPropagation();
    const priorities = ['normal', 'medium', 'high'];
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nextIdx = (priorities.indexOf(i.priority || 'normal') + 1) % priorities.length;
        return { ...i, priority: priorities[nextIdx] };
      })
    );
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const parsed = smartParseGroceryItem(newItemName, newItemQty, newItemUnit, newItemCategory);
    const estP = parseFloat(newItemPrice) || 2.50;
    const newItem = { id: Date.now().toString(), name: parsed.name, quantityNum: parsed.quantityNum, unit: parsed.unit, qty: parsed.qty, estimatedPrice: estP, category: parsed.category, priority: newItemPriority, checked: false, emoji: parsed.emoji, source: 'manual' };
    setItems((prev) => [newItem, ...prev]);
    setNewItemName('');
    setNewItemQty('1');
    setNewItemPrice('');
    setSyncMsg(`✨ Added "${parsed.name}" (${parsed.qty}) to checklist!`);
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const handleQuickAddChip = (sug) => {
    const existing = items.find((i) => i.name.toLowerCase() === sug.name.toLowerCase());
    if (existing) {
      adjustItemQuantity(existing.id, 1);
      setSyncMsg(`➕ Incremented quantity of "${sug.name}"!`);
    } else {
      const newItem = { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: sug.name, quantityNum: 1, unit: sug.qty.split(' ').slice(1).join(' ') || 'unit', qty: sug.qty, estimatedPrice: sug.estPrice || 2.50, category: sug.category, priority: 'normal', checked: false, emoji: sug.emoji, source: 'manual' };
      setItems((prev) => [newItem, ...prev]);
      setSyncMsg(`⚡ Instant added "${sug.name}" to checklist!`);
    }
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const handleSelectVisualProduct = (prod) => {
    const existing = items.find((i) => i.name.toLowerCase() === prod.name.toLowerCase());
    if (existing) {
      adjustItemQuantity(existing.id, 1);
      setSyncMsg(`➕ Incremented quantity of "${prod.name}"!`);
    } else {
      const newItem = { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), name: prod.name, quantityNum: 1, unit: prod.defaultUnit || 'pcs', qty: `1 ${prod.defaultUnit || 'pcs'}`, estimatedPrice: prod.estPrice || 2.50, category: prod.category, priority: 'normal', checked: false, emoji: prod.emoji, source: 'manual' };
      setItems((prev) => [newItem, ...prev]);
      setSyncMsg(`🖼️ Selected & added "${prod.name}" to checklist!`);
    }
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const handleBulkImport = () => {
    if (!bulkInputText.trim()) return;
    const lines = bulkInputText.split(/\n|,/).map((l) => l.trim()).filter(Boolean);
    let addedCount = 0;
    const newEntries = lines.map((line, index) => {
      addedCount++;
      const parsed = smartParseGroceryItem(line, 1, 'unit', 'Produce');
      return { id: 'bulk-' + Date.now() + '-' + index, name: parsed.name, quantityNum: parsed.quantityNum, unit: parsed.unit, qty: parsed.qty, estimatedPrice: 2.50, category: parsed.category, priority: 'normal', checked: false, emoji: parsed.emoji, source: 'manual' };
    });
    setItems((prev) => [...newEntries, ...prev]);
    setBulkInputText('');
    setShowBulkModal(false);
    setSyncMsg(`✨ Imported ${addedCount} item(s) into your checklist!`);
    setTimeout(() => setSyncMsg(''), 4000);
  };

  const toggleSelectAll = () => {
    const allChecked = items.every((i) => i.checked);
    setItems((prev) => prev.map((i) => ({ ...i, checked: !allChecked })));
  };

  const clearPurchasedItems = () => {
    const purchasedCount = items.filter((i) => i.checked).length;
    if (purchasedCount === 0) return;
    if (window.confirm(`Are you sure you want to remove ${purchasedCount} purchased item(s)?`)) {
      setItems((prev) => prev.filter((i) => !i.checked));
      setSyncMsg(`🗑️ Cleared ${purchasedCount} purchased item(s).`);
      setTimeout(() => setSyncMsg(''), 3000);
    }
  };

  const copyListToClipboard = () => {
    if (items.length === 0) return;
    const formatted = items.map((i) => `${i.checked ? '✅' : '⏹️'} ${i.emoji || '🛒'} ${i.name} (${i.qty}) - Est. $${((i.estimatedPrice || 2.5) * (i.quantityNum || 1)).toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`🛒 *Smart Shopping Checklist*\n\n${formatted}`);
    setSyncMsg('📋 Shopping list copied to clipboard!');
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const autoSyncRestockItems = async () => {
    setSyncing(true);
    try {
      const { data } = await api.get('/inventory');
      const invItems = Array.isArray(data) ? data : [];
      let addedCount = 0;
      setItems((prev) => {
        const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
        const newEntries = [];
        invItems.forEach((item) => {
          if (!existingNames.has(item.foodName.toLowerCase())) {
            addedCount++;
            newEntries.push({ id: 'auto-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), name: item.foodName, quantityNum: item.quantity || 1, unit: item.unit || 'pcs', qty: `${item.quantity || 1} ${item.unit || 'pcs'}`, estimatedPrice: 3.00, category: 'Produce', priority: 'high', checked: false, emoji: '🛒', source: 'auto-expiry' });
          }
        });
        return [...newEntries, ...prev];
      });
      setSyncMsg(`✨ Added ${addedCount} low-stock item(s) from your Fridge!`);
      setTimeout(() => setSyncMsg(''), 4000);
    } catch {
      setSyncMsg('⚠️ Sync completed');
    } finally {
      setSyncing(false);
    }
  };

  const handleTransferToFridge = async () => {
    const checkedItems = items.filter((i) => i.checked);
    if (checkedItems.length === 0) return;
    setTransferring(true);
    try {
      for (const item of checkedItems) {
        await api.post('/inventory', { foodName: item.name, category: item.category === 'Produce' ? 'fruit' : 'other', quantity: item.quantityNum || 1, unit: item.unit || 'pcs', location: 'fridge', expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] });
      }
      setItems((prev) => prev.filter((i) => !i.checked));
      setSyncMsg(`🎉 Transferred ${checkedItems.length} purchased item(s) to your Fridge Inventory!`);
      setTimeout(() => setSyncMsg(''), 4000);
    } catch {
      alert('Failed to transfer items to fridge.');
    } finally {
      setTransferring(false);
    }
  };

  const fetchBackendShops = async (lat, lng) => {
    setLoadingShops(true);
    const generated5 = generate5ProximityStores(lat, lng);
    try {
      const { data } = await api.get('/shops/nearby', { params: { lat, lng, radius: 50000 } });
      const merged = Array.isArray(data) && data.length > 0 ? data.map((s) => {
        const sLat = s.location?.coordinates?.[1] || s.coords?.[0] || lat;
        const sLng = s.location?.coordinates?.[0] || s.coords?.[1] || lng;
        const dist = (Math.sqrt(Math.pow(sLat - lat, 2) + Math.pow(sLng - lng, 2)) * 111).toFixed(1);
        return {
          ...s,
          distanceKm: dist,
          coords: [sLat, sLng],
          deliveryTimeMinutes: s.deliveryTimeMinutes || '10–20 min',
          deliveryFee: s.deliveryFee !== undefined ? s.deliveryFee : 1.50,
        };
      }) : [];

      const combined = [...merged];
      generated5.forEach((fb) => {
        if (!combined.some((s) => s.shopName === fb.shopName)) {
          const fDist = (Math.sqrt(Math.pow(fb.coords[0] - lat, 2) + Math.pow(fb.coords[1] - lng, 2)) * 111).toFixed(1);
          combined.push({ ...fb, distanceKm: fDist });
        }
      });

      combined.sort((a, b) => parseFloat(a.distanceKm || 0) - parseFloat(b.distanceKm || 0));
      setNearbyShops(combined);
      if (combined.length > 0) setSelectedShop(combined[0]);
    } catch {
      setNearbyShops(generated5);
      setSelectedShop(generated5[0]);
    } finally {
      setLoadingShops(false);
    }
  };

  const handleSelectPostalCity = (cityObj) => {
    if (!cityObj) return;
    setSelectedPostalLocation(cityObj);
    setUserCustomLocation(null);
    try { localStorage.removeItem('ffds_user_custom_location'); } catch { }
    setSyncMsg(`📍 Location switched to ${cityObj.name}, ${cityObj.district} (${cityObj.code})`);
    setTimeout(() => setSyncMsg(''), 4000);
    fetchBackendShops(cityObj.coords[0], cityObj.coords[1]);
  };

  const handleOpenOnlineShoppingModal = async () => {
    setShowOrderModal(true);
    const uLat = userCustomLocation?.lat || selectedPostalLocation?.coords?.[0] || 9.7833;
    const uLng = userCustomLocation?.lng || selectedPostalLocation?.coords?.[1] || 80.0167;
    fetchBackendShops(uLat, uLng);
  };

  const handleSubmitChecklistOrder = async () => {
    const uncompletedItems = items.filter((i) => !i.checked);
    const orderItemsList = uncompletedItems.length > 0 ? uncompletedItems : items;
    if (!selectedShop || orderItemsList.length === 0) {
      alert('Please select a nearby store and add items.');
      return;
    }
    if (paymentMethod === 'card' && (!cardForm.number || !cardForm.expiry)) {
      alert('Please enter valid credit/debit card details.');
      return;
    }

    setPlacingOrder(true);
    try {
      const subtotal = orderItemsList.reduce((sum, i) => sum + ((i.estimatedPrice || 2.5) * (i.quantityNum || 1)), 0);
      const deliveryFee = subtotal > 20 ? 0.00 : (selectedShop.deliveryFee || 1.50);
      const grandTotal = subtotal + deliveryFee + 0.50;
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

      const newBill = {
        id: 'INV-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        shopName: selectedShop.shopName,
        shopAddress: selectedShop.address || 'Proximity Store',
        items: orderItemsList.map((i) => ({ name: i.name, qty: i.qty, price: ((i.estimatedPrice || 2.5) * (i.quantityNum || 1)), emoji: i.emoji || '🛒' })),
        subtotal,
        deliveryFee,
        ecoFee: 0.50,
        grandTotal,
        paymentMethod,
        deliveryOtp: otpCode,
        status: 'Paid / In Delivery',
      };

      const updatedHistory = [newBill, ...billHistory];
      setBillHistory(updatedHistory);
      try { localStorage.setItem('ffds_bill_history', JSON.stringify(updatedHistory)); } catch { }

      setActiveChecklistOrder({
        _id: newBill.id,
        shopName: selectedShop.shopName,
        totalAmount: grandTotal,
        paymentMethod,
        itemsCount: orderItemsList.length,
        deliveryOtp: otpCode,
      });

      setChecklistOrderStatus({ status: 'accepted' });
      setShowOrderModal(false);
      setSyncMsg(`🎉 Order placed! Delivery Security OTP: ${otpCode}`);
      setTimeout(() => setSyncMsg(''), 6000);
    } catch {
      alert('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const filteredItems = items
    .filter((i) => {
      const statusMatch = statusFilter === 'all' ? true : statusFilter === 'pending' ? !i.checked : i.checked;
      const catMatch = categoryFilter === 'all' ? true : i.category === categoryFilter;
      const prioMatch = priorityFilter === 'all' ? true : (i.priority || 'normal') === priorityFilter;
      const searchMatch = !searchQuery.trim() || i.name.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && catMatch && prioMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { high: 1, medium: 2, normal: 3 };
        return (order[a.priority || 'normal'] || 3) - (order[b.priority || 'normal'] || 3);
      }
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const totalCount = items.length;
  const pendingCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;
  const autoRestockCount = items.filter((i) => i.source === 'auto-expiry').length;
  const pendingEstBudget = items.filter((i) => !i.checked).reduce((sum, i) => sum + (i.estimatedPrice || 2.50) * (i.quantityNum || 1), 0);

  const filteredVisualCatalog = VISUAL_PRODUCT_CATALOG.filter((p) => {
    if (visualCatFilter === 'all') return true;
    if (visualCatFilter === 'Fruit') return p.subcat === 'Fruit';
    if (visualCatFilter === 'Vegetable') return p.subcat === 'Vegetable';
    if (visualCatFilter === 'Dairy') return p.category === 'Dairy';
    if (visualCatFilter === 'Bakery') return p.category === 'Bakery';
    if (visualCatFilter === 'Meat') return p.category === 'Meat';
    if (visualCatFilter === 'Pantry') return p.category === 'Pantry';
    return true;
  });

  const currentStoresList = nearbyShops.length > 0 ? nearbyShops : FALLBACK_5_NEARBY_SHOPS;
  const activeSelectedShop = selectedShop || currentStoresList[0];
  const userLat = userCustomLocation?.lat || selectedPostalLocation?.coords?.[0] || 9.7833;
  const userLng = userCustomLocation?.lng || selectedPostalLocation?.coords?.[1] || 80.0167;

  const activeOrderItems = items.filter((i) => !i.checked).length > 0 ? items.filter((i) => !i.checked) : items;
  const orderSubtotal = activeOrderItems.reduce((sum, i) => sum + ((i.estimatedPrice || 2.5) * (i.quantityNum || 1)), 0);
  const orderDeliveryFee = orderSubtotal > 20 ? 0.00 : (activeSelectedShop?.deliveryFee || 1.50);
  const orderEcoFee = 0.50;
  const orderGrandTotal = orderSubtotal + orderDeliveryFee + orderEcoFee;

  return (
    <div className="space-y-6 fade-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📋</span> Smart Shopping Checklist & Dispatch
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Smart auto-restock, 1-click store dispatch, live e-bike tracking & invoices.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowBillHistoryModal(true)} className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-glow">
            <span>📜</span> Invoices ({billHistory.length})
          </button>
          <button type="button" onClick={autoSyncRestockItems} disabled={syncing} className="px-3.5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            {syncing ? <span className="spinner" /> : '⚡ Sync Low-Stock'}
          </button>
          <button type="button" onClick={handleOpenOnlineShoppingModal} className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-glow">
            <span>🚀</span> Order to Nearby Store
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Items</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">To Buy (Pending)</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Purchased</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{checkedCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Restocked</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{autoRestockCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-brand-300 tracking-wider">Est. Total Cost</span>
          <p className="text-2xl font-black text-brand-300 mt-1">${pendingEstBudget.toFixed(2)}</p>
        </div>
      </div>

      {syncMsg && (
        <div className="glass border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-fade-up">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleAddItem} className="glass p-3 rounded-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/10">
        <div className="relative w-full sm:flex-1">
          <input type="text" placeholder="Add item (e.g. Fresh Tomatoes, Olive Oil)..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" required />
          <button type="button" onClick={() => setShowVisualCatalog(true)} className="absolute right-2 top-2 text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer" title="Pick product visually">🖼️ Visual Pick</button>
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input type="number" step="any" min="1" placeholder="Qty" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} className="input-dark w-20 px-3 py-2.5 text-xs rounded-xl" />
          <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} className="input-dark w-24 px-2 py-2.5 text-xs rounded-xl cursor-pointer">
            <option value="pcs">pcs 🍎</option>
            <option value="kg">kg ⚖️</option>
            <option value="g">g ⚖️</option>
            <option value="Liter">Liter 🥛</option>
            <option value="loaf">loaf 🍞</option>
            <option value="dozen">dozen 🥚</option>
            <option value="pack">pack 📦</option>
            <option value="unit">unit 🛒</option>
          </select>
        </div>
        <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="input-dark w-full sm:w-32 px-3 py-2.5 text-xs rounded-xl cursor-pointer">
          <option value="Produce">Produce 🍎</option>
          <option value="Dairy">Dairy 🥛</option>
          <option value="Bakery">Bakery 🍞</option>
          <option value="Meat">Meat 🥩</option>
          <option value="Pantry">Pantry 📦</option>
        </select>
        <select value={newItemPriority} onChange={(e) => setNewItemPriority(e.target.value)} className="input-dark w-full sm:w-28 px-3 py-2.5 text-xs rounded-xl cursor-pointer">
          <option value="normal">🟢 Normal</option>
          <option value="medium">⭐ Medium</option>
          <option value="high">🔥 High</option>
        </select>
        <input type="number" step="0.10" placeholder="Est. $" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="input-dark w-full sm:w-24 px-3 py-2.5 text-xs rounded-xl" />
        <button type="submit" className="btn-glow w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-xs font-extrabold shrink-0 cursor-pointer">+ Add Item</button>
      </form>

      {/* Checklist items list */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div key={item.id} className={`glass p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${item.checked ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} className="w-4 h-4 rounded accent-emerald-500 cursor-pointer" />
              <span className="text-xl shrink-0">{item.emoji || '🛒'}</span>
              <div className="min-w-0">
                <p className={`font-bold text-xs sm:text-sm text-white truncate ${item.checked ? 'line-through text-slate-400' : ''}`}>{item.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{item.qty} · ${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={(e) => cyclePriority(item.id, e)} className="p-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-amber-300 transition-all cursor-pointer">
                {item.priority === 'high' ? '🔥' : item.priority === 'medium' ? '⭐' : '🟢'}
              </button>
              <button type="button" onClick={(e) => removeItem(item.id, e)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-up">
          <div className="glass rounded-2xl border border-white/15 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2"><span>✨</span> AI Bulk Add / Multi-Item Paste</h2>
                <p className="text-xs text-slate-400">Paste your list of items (one per line or comma separated).</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10">✕</button>
            </div>
            <textarea rows="6" placeholder={`Paste items here, e.g:\n2 Liters Fresh Milk\n1 loaf Bread\n500g Chicken Breast\n1 dozen Eggs`} value={bulkInputText} onChange={(e) => setBulkInputText(e.target.value)} className="input-dark w-full p-3 text-xs rounded-xl font-mono leading-relaxed" />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold">Cancel</button>
              <button type="button" onClick={handleBulkImport} disabled={!bulkInputText.trim()} className="btn-glow px-5 py-2 rounded-xl text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer shadow-glow">🚀 Import Items</button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
          <div className="glass rounded-2xl border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>🛒</span> Online Order & Store Selector
                </h2>
                <p className="text-xs text-slate-400">Map matched 5 top proximity stores, itemized money breakdown & live delivery.</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 text-sm">✕</button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/90 p-3 rounded-xl border border-brand-500/40">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-brand-300 font-extrabold flex items-center gap-1">📍 Delivery Region:</span>
                <span className="text-white font-bold">{selectedPostalLocation.name} ({selectedPostalLocation.district})</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedPostalLocation.code}
                  onChange={(e) => {
                    const match = SRI_LANKA_POSTAL_CODES.find((p) => p.code === e.target.value);
                    if (match) handleSelectPostalCity(match);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-brand-500/50 text-brand-300 font-bold text-xs cursor-pointer shadow-glow"
                >
                  {SRI_LANKA_POSTAL_CODES.map((p) => (
                    <option key={p.code + p.name} value={p.code}>📍 [{p.code}] {p.district} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Store ({currentStoresList.length} Proximity Stores)</span>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {currentStoresList.map((shop) => {
                  const isSelected = activeSelectedShop?._id === shop._id;
                  return (
                    <div
                      key={shop._id}
                      onClick={() => setSelectedShop(shop)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏪</span>
                        <div>
                          <p className="font-bold text-xs flex items-center gap-1.5">
                            {shop.shopName}
                            {shop.isVerified && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">✓ Verified</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">{shop.address} · ⭐ {shop.rating || 4.9}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-brand-300 block">{shop.distanceKm || '1.2'} km · ⚡ {shop.deliveryTimeMinutes || '10-15 min'}</span>
                        <span className="text-[10px] text-slate-400 block">{shop.deliveryFee === 0 ? '🎉 Free Delivery' : `$${(shop.deliveryFee || 1.5).toFixed(2)} Delivery`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass p-4 rounded-xl border border-white/10 space-y-3 bg-white/5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>💰 Product & Order Money Breakdown</span>
                <span className="text-brand-300 font-mono">{activeOrderItems.length} items</span>
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto text-xs text-slate-300 pr-1">
                {activeOrderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{item.emoji}</span> {item.name} <span className="text-slate-400 font-mono">({item.qty})</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal:</span>
                  <span className="text-white">${orderSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="text-white">{orderDeliveryFee === 0 ? 'FREE' : `$${orderDeliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Eco-Packaging & Service Fee:</span>
                  <span className="text-white">${orderEcoFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-brand-300 pt-1 border-t border-white/10">
                  <span>Grand Total (Money Due):</span>
                  <span>${orderGrandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payment Method</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'cash' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  💵 Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'card' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  💳 Credit / Debit Card
                </button>
              </div>
              {paymentMethod === 'card' && (
                <div className="glass p-3.5 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-2.5 animate-fade-up mt-2">
                  {user?.cardDetails?.cardNumberMasked && (
                    <div className="flex items-center justify-between text-xs text-brand-300 font-bold bg-brand-500/15 px-3 py-2 rounded-lg border border-brand-500/40">
                      <span className="flex items-center gap-1.5">
                        <span>💳</span> Saved Card Loaded: <strong className="text-white font-mono">{user.cardDetails.cardNumberMasked}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCardForm({
                          number: user.cardDetails.cardNumberMasked || '',
                          expiry: user.cardDetails.expiryDate || '',
                          cvv: '123'
                        })}
                        className="text-[10px] bg-brand-500 hover:bg-brand-400 text-slate-950 px-2.5 py-1 rounded-lg font-extrabold cursor-pointer transition-all shadow-glow"
                      >
                        ⚡ Auto-Fill Saved Card
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Card Number (4532 •••• •••• 8921)"
                    maxLength={19}
                    value={cardForm.number}
                    onChange={handleModalCardNumberChange}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardForm.expiry}
                      onChange={handleModalCardExpiryChange}
                      className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                    />
                    <input
                      type="password"
                      placeholder="CVV (123)"
                      maxLength={4}
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                      className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmitChecklistOrder}
              disabled={placingOrder || !selectedShop}
              className="btn-glow w-full py-3.5 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-glow"
            >
              {placingOrder ? <><span className="spinner" /> Submitting Order...</> : '🚀 Submit Order to Shop'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
