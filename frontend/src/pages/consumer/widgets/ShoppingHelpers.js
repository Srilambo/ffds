import L from 'leaflet';

// Custom colored divIcon pins for Leaflet maps (NO external CDN asset calls, bulletproof tracking prevention fix)
export const userPinIcon = typeof L !== 'undefined' && L.divIcon ? L.divIcon({
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">📍</div>',
  className: 'custom-leaflet-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
}) : null;

export const storePinIcon = typeof L !== 'undefined' && L.divIcon ? L.divIcon({
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🏪</div>',
  className: 'custom-leaflet-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
}) : null;

export const riderPinIcon = typeof L !== 'undefined' && L.divIcon ? L.divIcon({
  html: '<div style="font-size: 30px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));" class="animate-bounce">🚴</div>',
  className: 'custom-leaflet-pin',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
}) : null;

export const shopIcon = storePinIcon;
export const userIcon = userPinIcon;

// ────────────────────────────────────────────────────────────
// SRI LANKA POSTAL CODES DATASET
// ────────────────────────────────────────────────────────────
export const SRI_LANKA_POSTAL_CODES = [
  // 📍 JAFFNA DISTRICT
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
  { code: '40320', name: 'Pungudutivu', district: 'Jaffna', coords: [9.5820, 79.8450] },
  { code: '40340', name: 'Nainativu', district: 'Jaffna', coords: [9.6050, 79.7750] },
  { code: '40350', name: 'Delft Island (Neduntivu)', district: 'Jaffna', coords: [9.5150, 79.6850] },
  { code: '40360', name: 'Navatkuli', district: 'Jaffna', coords: [9.6680, 80.0750] },
  { code: '40370', name: 'Kaithady', district: 'Jaffna', coords: [9.6650, 80.1020] },
  { code: '40380', name: 'Chavakachcheri', district: 'Jaffna', coords: [9.6580, 80.1550] },
  { code: '40390', name: 'Kodikamam', district: 'Jaffna', coords: [9.6780, 80.2250] },
  { code: '40400', name: 'Mirusuvil', district: 'Jaffna', coords: [9.6950, 80.2650] },
  { code: '40420', name: 'Eluthumadduval', district: 'Jaffna', coords: [9.6850, 80.2450] },
  { code: '40440', name: 'Palai (Pachchilaipalli)', district: 'Jaffna', coords: [9.6250, 80.3450] },
  { code: '40450', name: 'Kilinochchi Main Town', district: 'Kilinochchi', coords: [9.3800, 80.4000] },
  { code: '40460', name: 'Paranthan', district: 'Kilinochchi', coords: [9.4450, 80.4050] },
  { code: '40470', name: 'Elephant Pass (Iyakachchi)', district: 'Kilinochchi', coords: [9.5350, 80.4020] },
  { code: '40480', name: 'Poonakary (Pooneryn)', district: 'Kilinochchi', coords: [9.5050, 80.2050] },

  // 📍 CAPITAL & OTHER DISTRICTS
  { code: '00100', name: 'Colombo 01 (Fort)', district: 'Colombo', coords: [6.9344, 79.8428] },
  { code: '00300', name: 'Colombo 03 (Kollupitiya)', district: 'Colombo', coords: [6.9125, 79.8507] },
  { code: '00700', name: 'Colombo 07 (Cinnamon Gardens)', district: 'Colombo', coords: [6.9117, 79.8647] },
  { code: '20000', name: 'Kandy City Center', district: 'Kandy', coords: [7.2906, 80.6337] },
  { code: '80000', name: 'Galle Fort & Town', district: 'Galle', coords: [6.0535, 80.2210] },
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
      coords: [lat + 0.003, lng + 0.002],
    },
    {
      _id: 'shop-chunnakam-2',
      shopName: 'Chunnakam Green Grocers & Organics',
      address: '88 Station Road, Chunnakam, Jaffna',
      distanceKm: 1.4,
      deliveryTimeMinutes: '15–20 min',
      rating: 4.8,
      reviewsCount: 210,
      isVerified: true,
      deliveryFee: 1.50,
      coords: [lat - 0.004, lng + 0.005],
    },
    {
      _id: 'shop-jaffna-3',
      shopName: 'Jaffna City Center Hypermarket',
      address: '12 Hospital St, Jaffna Main Town',
      distanceKm: 3.2,
      deliveryTimeMinutes: '20–30 min',
      rating: 4.7,
      reviewsCount: 350,
      isVerified: true,
      deliveryFee: 2.00,
      coords: [lat - 0.012, lng - 0.008],
    },
    {
      _id: 'shop-kks-4',
      shopName: 'KKS Coastal Express Mart',
      address: '45 Harbor Road, Kankesanthurai',
      distanceKm: 4.1,
      deliveryTimeMinutes: '25–35 min',
      rating: 4.6,
      reviewsCount: 92,
      isVerified: false,
      deliveryFee: 2.50,
      coords: [lat + 0.015, lng + 0.012],
    },
    {
      _id: 'shop-mallakam-5',
      shopName: 'Mallakam Fresh & Value Daily',
      address: '77 Point Pedro Road, Mallakam',
      distanceKm: 2.1,
      deliveryTimeMinutes: '15–25 min',
      rating: 4.8,
      reviewsCount: 145,
      isVerified: true,
      deliveryFee: 1.50,
      coords: [lat - 0.005, lng - 0.004],
    },
  ];
}

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

export const DEFAULT_SHOPPING = [
  { id: '1', name: 'Fresh Milk', qty: '1 Liter', quantityNum: 1, unit: 'Liter', estimatedPrice: 2.80, category: 'Dairy', checked: false, emoji: '🥛', priority: 'high', source: 'manual' },
  { id: '2', name: 'Whole Wheat Bread', qty: '1 loaf', quantityNum: 1, unit: 'loaf', estimatedPrice: 2.20, category: 'Bakery', checked: false, emoji: '🍞', priority: 'normal', source: 'manual' },
  { id: '3', name: 'Red Apples', qty: '1 kg', quantityNum: 1, unit: 'kg', estimatedPrice: 3.50, category: 'Produce', checked: false, emoji: '🍎', priority: 'medium', source: 'manual' },
  { id: '4', name: 'Organic Spinach', qty: '200g', quantityNum: 1, unit: 'pack', estimatedPrice: 1.90, category: 'Produce', checked: true, emoji: '🥬', priority: 'normal', source: 'manual' },
  { id: '5', name: 'Eggs', qty: '1 dozen', quantityNum: 1, unit: 'dozen', estimatedPrice: 3.20, category: 'Dairy', checked: false, emoji: '🥚', priority: 'high', source: 'manual' },
];

export const POPULAR_QUICK_SUGGESTIONS = [
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
