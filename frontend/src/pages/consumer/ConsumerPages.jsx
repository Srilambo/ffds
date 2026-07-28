import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ChatBot from '../../components/ChatBot';

// Custom colored divIcon pins for Leaflet maps (NO external CDN asset calls, bulletproof tracking prevention fix)
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

const shopIcon = storePinIcon;
const userIcon = userPinIcon;

function FlyToLocation({ center }) {
  const map = useMap();
  const lat = center?.[0];
  const lng = center?.[1];
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14);
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }
  }, [lat, lng, map]);
  return null;
}

function MapEventsHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect && e && e.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
    contextmenu(e) {
      if (onLocationSelect && e && e.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// ────────────────────────────────────────────────────────────
// 1. CONSUMER PANTRY (Fridge Inventory Tracker)
// ────────────────────────────────────────────────────────────
export function ConsumerPantry() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLocation, setActiveLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    foodName: '',
    category: 'fruit',
    quantity: 1,
    unit: 'pcs',
    location: 'fridge',
    expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory', { params: { status: 'active' } });
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load pantry items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/inventory/${id}`, { status: newStatus });
      loadItems();
    } catch (err) {
      setError('Failed to update item status');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      loadItems();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await api.post('/inventory', {
        ...newItem,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(newItem.expiryDate).toISOString(),
      });
      setShowAddModal(false);
      setNewItem({
        foodName: '',
        category: 'fruit',
        quantity: 1,
        unit: 'pcs',
        location: 'fridge',
        expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      loadItems();
    } catch (err) {
      setError('Failed to add new pantry item');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const locMatch = activeLocation === 'all' || (item.location || 'pantry').toLowerCase() === activeLocation;
    const nameMatch = item.foodName.toLowerCase().includes(searchQuery.toLowerCase());
    return locMatch && nameMatch;
  });

  const totalCount = items.length;
  const expiringSoonCount = items.filter((i) => {
    const days = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 2 && days > 0;
  }).length;
  const expiredCount = items.filter((i) => {
    const days = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 0;
  }).length;
  const freshCount = Math.max(0, totalCount - expiringSoonCount - expiredCount);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🧊</span> My Fridge Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time freshness tracker for items saved in your Fridge.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => setShowAddModal(true)} className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2">
            <span>+ Add Item</span>
          </button>
          <button onClick={loadItems} className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all">
            🔄
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Items</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Fresh</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{freshCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Expiring Soon</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{expiringSoonCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Expired</span>
          <p className="text-2xl font-black text-red-400 mt-1">{expiredCount}</p>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">🧊 Fridge Stock</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold">
            {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            placeholder="Search fridge items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full px-3.5 py-2 text-xs rounded-xl pl-9"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><span className="spinner h-8 w-8" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl space-y-3">
          <p className="text-5xl">🍽️</p>
          <p className="font-bold text-white text-base">No items found</p>
          <button onClick={() => setShowAddModal(true)} className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold inline-block mt-2">
            + Add First Item
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            let status = 'fresh';
            if (daysLeft <= 0) status = 'spoiled';
            else if (daysLeft <= 2) status = 'expiring';

            const statusStyles = {
              fresh: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Fresh' },
              expiring: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Expiring Soon' },
              spoiled: { border: 'border-red-500/30', bg: 'bg-red-500/5', badge: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Expired' },
            };
            const s = statusStyles[status];
            return (
              <div key={item._id} className={`glass ${s.bg} border ${s.border} rounded-2xl p-5 space-y-4 flex flex-col justify-between card-hover transition-all`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white text-lg capitalize">{item.foodName}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.quantity} {item.unit}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${s.badge}`}>{s.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Status</span>
                      <span className={daysLeft <= 0 ? 'text-red-400 font-bold' : daysLeft <= 2 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Expires today' : 'Expired'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button onClick={() => handleUpdateStatus(item._id, 'consumed')} className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">🍴 Consumed</button>
                  <button onClick={() => handleUpdateStatus(item._id, 'wasted')} className="flex-1 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold">🗑️ Wasted</button>
                  <button onClick={() => handleDeleteItem(item._id)} className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 text-slate-400 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 space-y-4 fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2"><span>📦</span> Add to Pantry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Item Name</label>
                <input type="text" placeholder="e.g. Fresh Milk, Tomatoes" value={newItem.foodName} onChange={(e) => setNewItem({ ...newItem, foodName: e.target.value })} className="input-dark w-full px-3 py-2 text-xs rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                  <input type="number" min="0.1" step="0.1" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: +e.target.value })} className="input-dark w-full px-3 py-2 text-xs rounded-xl" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Unit</label>
                  <input type="text" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className="input-dark w-full px-3 py-2 text-xs rounded-xl" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                <input type="date" value={newItem.expiryDate} onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })} className="input-dark w-full px-3 py-2 text-xs rounded-xl" required />
              </div>
              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={addLoading} className="flex-1 btn-glow py-2.5 rounded-xl text-white text-xs font-semibold">{addLoading ? <span className="spinner" /> : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. CONSUMER HISTORY
// ────────────────────────────────────────────────────────────
export function ConsumerHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  const loadScans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/scans');
      setScans(Array.isArray(data) ? data : []);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScans(); }, []);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2"><span>📜</span> Scan Log & Telemetry</h1>
          <p className="text-slate-400 text-sm mt-1">Review AI freshness assessments and multi-sensor gas logs.</p>
        </div>
        <button onClick={loadScans} className="px-3.5 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-xl">🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="spinner h-8 w-8" /></div>
      ) : scans.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl">No scans recorded yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map((scan) => (
            <div key={scan._id} onClick={() => setSelectedScan(scan)} className="glass border border-white/10 rounded-2xl overflow-hidden cursor-pointer p-4 space-y-3">
              <img src={scan.imageUrl} alt={scan.foodType} className="h-40 w-full object-cover rounded-xl" />
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white capitalize">{scan.foodType}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold">{scan.confidence}%</span>
              </div>
              <p className="text-xs text-slate-400 italic">"{scan.chatbotExplanation || 'AI scan completed'}"</p>
            </div>
          ))}
        </div>
      )}

      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg p-6 rounded-2xl border border-white/15 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="font-bold text-white text-lg capitalize">{selectedScan.foodType} Report</h2>
              <button onClick={() => setSelectedScan(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={selectedScan.imageUrl} alt={selectedScan.foodType} className="rounded-xl h-48 w-full object-cover" />
            <ChatBot scanId={selectedScan._id} initialExplanation={selectedScan.chatbotExplanation} />
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3. CONSUMER RECIPES
// ────────────────────────────────────────────────────────────
export function ConsumerRecipes() {
  const [pantryItems, setPantryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [generating, setGenerating] = useState(false);

  const fetchPantryAndGenerateRecipes = async () => {
    setGenerating(true);
    try {
      const { data } = await api.get('/inventory', { params: { status: 'active' } });
      const items = Array.isArray(data) ? data : [];
      setPantryItems(items);
      const ingredientNames = items.map((i) => i.foodName).filter(Boolean);
      if (ingredientNames.length > 0) {
        const res = await api.post('/chat/recipes/generate', { ingredients: ingredientNames });
        setRecipes(res.data?.recipes || []);
      }
    } catch {
      setRecipes([]);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { fetchPantryAndGenerateRecipes(); }, []);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2"><span>🍳</span> AI Recipe Suggestions</h1>
          <p className="text-slate-400 text-sm mt-1">Zero-waste recipe ideas generated by Gemini AI for your fridge stock.</p>
        </div>
        <button onClick={fetchPantryAndGenerateRecipes} disabled={generating} className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold">
          {generating ? <span className="spinner" /> : '✨ Regenerate'}
        </button>
      </div>

      {generating ? (
        <div className="glass p-12 text-center text-slate-300 rounded-2xl animate-pulse">Gemini AI is crafting your recipes...</div>
      ) : recipes.length === 0 ? (
        <div className="glass p-12 text-center text-slate-400 rounded-2xl">No recipes found. Add items to your fridge!</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {recipes.map((r, idx) => (
            <div key={idx} className="glass p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-lg">{r.name}</h3>
              <p className="text-xs text-slate-400">⏱ {r.time || '15 min'} · {r.difficulty || 'Easy'}</p>
              <div className="flex flex-wrap gap-1">
                {(r.uses || []).map((u, i) => <span key={i} className="text-[10px] px-2 py-0.5 bg-white/10 rounded text-slate-300">{u}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 4. CONSUMER SHOPPING LIST (Checklist + Online Shopping Checkout Modal)
// ────────────────────────────────────────────────────────────
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

const FALLBACK_5_NEARBY_SHOPS = generate5ProximityStores(9.7833, 80.0167);

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
  const [activeChecklistOrder, setActiveChecklistOrder] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ffds_active_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        const dismissed = sessionStorage.getItem(`ffds_dismissed_order_${parsed._id}`);
        if (!dismissed) return parsed;
      }
    } catch {}
    return null;
  });
  const [checklistOrderStatus, setChecklistOrderStatus] = useState({ status: 'delivered' });

  const handleDismissOrderTracking = () => {
    if (activeChecklistOrder?._id) {
      try {
        sessionStorage.setItem(`ffds_dismissed_order_${activeChecklistOrder._id}`, 'true');
        sessionStorage.removeItem('ffds_active_order');
      } catch {}
    }
    setActiveChecklistOrder(null);
  };
  const [deliveryRiderPos, setDeliveryRiderPos] = useState([9.7845, 80.0270]);
  const [showBillHistoryModal, setShowBillHistoryModal] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);

  // Review & Rating State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAutoFridgePrompt, setShowAutoFridgePrompt] = useState(false);
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
  const [trackingGps, setTrackingGps] = useState(false);
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
    {
      id: 'INV-321045',
      date: 'Jul 26, 2026, 04:15 PM',
      shopName: 'Jaffna Fresh Produce',
      shopAddress: 'Kankesanthurai Road, Jaffna',
      items: [
        { name: 'Fresh Mangoes', qty: '3 kg', price: 15.00, emoji: '🥭' },
        { name: 'Organic Carrots', qty: '2 kg', price: 6.20, emoji: '🥕' },
        { name: 'Red Tomatoes', qty: '2 kg', price: 5.50, emoji: '🍅' },
        { name: 'Green Cucumber', qty: '1.5 kg', price: 4.00, emoji: '🥒' },
      ],
      subtotal: 30.70,
      deliveryFee: 3.00,
      ecoFee: 0.50,
      grandTotal: 34.20,
      paymentMethod: 'card',
      deliveryOtp: '9182',
      status: 'Delivered 🎉',
    },
    {
      id: 'INV-319802',
      date: 'Jul 22, 2026, 11:30 AM',
      shopName: 'City Supermarket',
      shopAddress: 'Station Road, Jaffna',
      items: [
        { name: 'Unsalted Butter', qty: '2 packs', price: 9.00, emoji: '🧈' },
        { name: 'Cheddar Cheese Block', qty: '500g', price: 8.50, emoji: '🧀' },
        { name: 'Boneless Chicken Breast', qty: '1.5 kg', price: 18.00, emoji: '🍗' },
        { name: 'Basmati Rice', qty: '5 kg', price: 6.80, emoji: '🌾' },
      ],
      subtotal: 42.30,
      deliveryFee: 0.00,
      ecoFee: 0.50,
      grandTotal: 42.80,
      paymentMethod: 'card',
      deliveryOtp: '3341',
      status: 'Completed 🎉',
    }
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

    // Save to billHistory
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
    handleDismissOrderTracking();
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
        setShowAutoFridgePrompt(true);
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

  const handleEnableLiveGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setTrackingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCustomLocation({ lat: latitude, lng: longitude });
        setSyncMsg(`📍 Live GPS Pinpoint Active! Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setTimeout(() => setSyncMsg(''), 5000);
        setTrackingGps(false);
        fetchBackendShops(latitude, longitude);
      },
      (err) => {
        setTrackingGps(false);
        alert(`GPS location query: ${err.message}. Displaying proximity stores for current area.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPinClick = (lat, lng) => {
    const loc = { lat, lng };
    setUserCustomLocation(loc);
    try { localStorage.setItem('ffds_user_custom_location', JSON.stringify(loc)); } catch { }
    setSyncMsg(`📍 Home Delivery Location Pin Saved! (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    setTimeout(() => setSyncMsg(''), 5000);
    fetchBackendShops(lat, lng);
  };

  const handleSelectPostalCity = (cityObj) => {
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
    if (paymentMethod === 'card' && (!cardForm.number || !cardForm.expiry || !cardForm.cvv)) {
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
    return p.category === visualCatFilter;
  });

  const activeOrderItems = items.filter((i) => !i.checked).length > 0 ? items.filter((i) => !i.checked) : items;
  const orderSubtotal = activeOrderItems.reduce((sum, i) => sum + (i.estimatedPrice || 2.50) * (i.quantityNum || 1), 0);
  const orderDeliveryFee = orderSubtotal > 20 ? 0.00 : (selectedShop?.deliveryFee || 1.50);
  const orderEcoFee = 0.50;
  const orderGrandTotal = orderSubtotal + orderDeliveryFee + orderEcoFee;

  const userLat = userCustomLocation?.lat || selectedPostalLocation?.coords?.[0] || 9.7833;
  const userLng = userCustomLocation?.lng || selectedPostalLocation?.coords?.[1] || 80.0167;

  const allStoresList = nearbyShops.length > 0 ? nearbyShops : generate5ProximityStores(userLat, userLng);
  const currentStoresList = allStoresList
    .map((s) => {
      const sLat = s.coords?.[0] || s.location?.coordinates?.[1] || userLat;
      const sLng = s.coords?.[1] || s.location?.coordinates?.[0] || userLng;
      const dist = (Math.sqrt(Math.pow(sLat - userLat, 2) + Math.pow(sLng - userLng, 2)) * 111).toFixed(1);
      return { ...s, distanceKm: dist, coords: [sLat, sLng] };
    })
    .filter((s) => parseFloat(s.distanceKm) <= 35)
    .sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));

  const activeSelectedShop = selectedShop || currentStoresList[0] || allStoresList[0];

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📋</span> Smart Shopping Checklist
          </h1>
          <p className="text-slate-400 text-sm mt-1">Auto-sync low stock, select units (kg/pcs), pick products visually & order online.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button type="button" onClick={() => setShowBillHistoryModal(true)} className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-glow">
            <span>📜</span> Bill History ({billHistory.length})
          </button>
          <button type="button" onClick={() => setShowVisualCatalog(!showVisualCatalog)} className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-glow">
            <span>🖼️</span> {showVisualCatalog ? 'Hide Visual Catalog' : 'Visual Product Picker'}
          </button>
          <button type="button" onClick={() => setShowBulkModal(true)} className="px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
            <span>✨</span> AI Bulk Add
          </button>
          <button type="button" onClick={autoSyncRestockItems} disabled={syncing} className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer">
            {syncing ? <span className="spinner" /> : <span>⚡ Auto-Restock</span>}
          </button>
          <button type="button" onClick={handleOpenOnlineShoppingModal} className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-2 shadow-glow cursor-pointer">
            <span>🛒</span> Order Online Now
          </button>
        </div>
      </div>

      {activeChecklistOrder && checklistOrderStatus && (
        <div className="glass border border-brand-500/40 bg-brand-500/10 p-5 rounded-2xl space-y-4 animate-fade-up shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-bounce">🚴</span>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Live Order Delivery Tracking: <span className="uppercase text-brand-300 font-extrabold">{checklistOrderStatus.status.replace('_', ' ')}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Order #{activeChecklistOrder._id.slice(-6)} · Store: <span className="text-white font-semibold">{activeSelectedShop?.shopName || 'Proximity Store'}</span> · Est: 10–15 min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 shadow-glow">
                <span>🔐 Delivery OTP:</span>
                <span className="text-white bg-slate-950 px-2 py-0.5 rounded tracking-widest text-sm font-extrabold">{activeChecklistOrder.deliveryOtp || '4829'}</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                {paymentMethod === 'card' ? '💳 Paid via Card' : '💵 Cash on Delivery'} (${(activeChecklistOrder.totalAmount || orderGrandTotal).toFixed(2)})
              </span>
              <button onClick={handleDismissOrderTracking} className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-xl hover:bg-white/10 transition-all font-semibold cursor-pointer">✕ Dismiss & Close</button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 py-1 text-center text-[11px] font-bold">
            <div className={`p-2 rounded-xl border ${checklistOrderStatus.status === 'pending' || checklistOrderStatus.status === 'accepted' || checklistOrderStatus.status === 'preparing' || checklistOrderStatus.status === 'on_the_way' || checklistOrderStatus.status === 'delivered' ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              1. Placed ⌛
            </div>
            <div className={`p-2 rounded-xl border ${checklistOrderStatus.status === 'accepted' || checklistOrderStatus.status === 'preparing' || checklistOrderStatus.status === 'on_the_way' || checklistOrderStatus.status === 'delivered' ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              2. Accepted 🏪
            </div>
            <div className={`p-2 rounded-xl border ${checklistOrderStatus.status === 'preparing' || checklistOrderStatus.status === 'on_the_way' || checklistOrderStatus.status === 'delivered' ? 'bg-brand-500/20 border-brand-500 text-brand-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              3. Packing 📦
            </div>
            <div className={`p-2 rounded-xl border ${checklistOrderStatus.status === 'on_the_way' || checklistOrderStatus.status === 'delivered' ? 'bg-brand-500/20 border-brand-500 text-brand-300 animate-pulse' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              4. On Way 🚴
            </div>
            <div className={`p-2 rounded-xl border ${checklistOrderStatus.status === 'delivered' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              5. Delivered 🎉
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/15 shadow-inner h-60 w-full relative">
            <MapContainer center={[userLat, userLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <Marker position={[userLat, userLng]} icon={userPinIcon}>
                <Popup><strong>📍 Your Delivery Location</strong><br />{user?.address || 'Registered Profile Address'}</Popup>
              </Marker>
              <Marker position={activeSelectedShop?.coords || [userLat + 0.01, userLng + 0.01]} icon={storePinIcon}>
                <Popup><strong>🏪 {activeSelectedShop?.shopName}</strong><br />Store Dispatch Point</Popup>
              </Marker>
              {deliveryRiderPos && (
                <Marker position={deliveryRiderPos} icon={riderPinIcon}>
                  <Popup><strong>🚴 Rider: Nimal Perera (#402)</strong><br />Status: {checklistOrderStatus.status}</Popup>
                </Marker>
              )}
            </MapContainer>
            <div className="absolute bottom-3 left-3 z-[400] glass px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live GPS Delivery Rider Tracking</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-bold text-white">Rider: Nimal Perera (Rider #402)</p>
                <p className="text-[11px] text-slate-400">Vehicle: E-Bike 🏍️ · Speed: 24 km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {checklistOrderStatus.status === 'delivered' && (
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center gap-1.5 cursor-pointer shadow-glow transition-all"
                >
                  <span>⭐</span> {submittedReview ? 'View / Edit Review' : 'Rate & Review Order'}
                </button>
              )}
              <button
                type="button"
                onClick={() => alert('📞 Calling Delivery Rider Nimal Perera (+94 77 123 4567)...')}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold flex items-center gap-2 cursor-pointer shadow-glow"
              >
                📞 Call Rider (+94 77 123 4567)
              </button>
            </div>
          </div>

          {/* Delivered Order Review Banner */}
          {checklistOrderStatus.status === 'delivered' && (
            <div className="pt-2 animate-fade-up">
              {!submittedReview ? (
                <div className="glass p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xl font-bold">
                      ⭐
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">Order Delivered! Please Leave a Review</h4>
                      <p className="text-xs text-slate-300">How was rider delivery speed & produce freshness quality?</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="btn-glow px-5 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shrink-0 shadow-glow"
                  >
                    <span>⭐</span> Rate Rider & Products
                  </button>
                </div>
              ) : (
                <div className="glass p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <span>✨</span> Your Order Review & Rating
                    </span>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="text-[11px] text-amber-400 hover:underline font-bold"
                    >
                      ✏️ Edit Review
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                    <span className="text-white">
                      Rider: <strong className="text-amber-400">{'★'.repeat(submittedReview.riderRating)}{'☆'.repeat(5 - submittedReview.riderRating)}</strong>
                    </span>
                    <span className="text-white">
                      Freshness: <strong className="text-emerald-400">{'★'.repeat(submittedReview.storeRating)}{'☆'.repeat(5 - submittedReview.storeRating)}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic bg-white/5 p-2.5 rounded-lg border border-white/10">
                    "{submittedReview.reviewText}"
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {submittedReview.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showVisualCatalog && (
        <div className="glass p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4 animate-fade-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🖼️</span> Visual Product Catalog (Tap to Add — No Typing Needed!)
              </h2>
              <p className="text-xs text-slate-400">Select any fruit, vegetable, dairy, or bakery product directly into your shopping list.</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Products' },
                { id: 'Fruit', label: '🍎 Fruits' },
                { id: 'Vegetable', label: '🥦 Veggies' },
                { id: 'Dairy', label: '🥛 Dairy' },
                { id: 'Bakery', label: '🍞 Bakery' },
                { id: 'Meat', label: '🥩 Meat' },
                { id: 'Pantry', label: '📦 Pantry' },
              ].map((tab) => (
                <button key={tab.id} type="button" onClick={() => setVisualCatFilter(tab.id)} className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${visualCatFilter === tab.id ? 'bg-emerald-500 text-slate-950 shadow-glow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredVisualCatalog.map((prod, idx) => (
              <div key={idx} onClick={() => handleSelectVisualProduct(prod)} className="glass p-3 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-between text-center cursor-pointer group space-y-1.5">
                <span className="text-3xl group-hover:scale-110 transition-transform">{prod.emoji}</span>
                <div>
                  <p className="font-bold text-xs text-white leading-tight">{prod.name}</p>
                  <span className="text-[10px] text-brand-300 font-mono block mt-0.5">1 {prod.defaultUnit} · ${prod.estPrice.toFixed(2)}</span>
                </div>
                <button type="button" className="w-full py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[10px] font-extrabold transition-all cursor-pointer">
                  + Add to List
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass p-3 rounded-2xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><span>💡</span> 1-Click Quick Add Essentials</span>
          <span className="text-[10px] text-slate-500 font-mono">Tap chip to add or increment</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {POPULAR_QUICK_SUGGESTIONS.map((sug, idx) => (
            <button key={idx} type="button" onClick={() => handleQuickAddChip(sug)} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-brand-500/20 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer group">
              <span>{sug.emoji}</span>
              <span>{sug.name}</span>
            </button>
          ))}
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

      <form onSubmit={handleAddItem} className="glass p-4 rounded-2xl border border-white/10 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
            <span>➕</span> Add New Item to Checklist
          </span>
          <button type="button" onClick={() => setShowVisualCatalog(true)} className="text-[11px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1">
            <span>🖼️</span> Visual Pick
          </button>
        </div>

        <div className="relative w-full">
          <input
            type="text"
            placeholder="Item name (e.g. Fresh Apples, Whole Wheat Bread)..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="input-dark w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex gap-1 min-w-0">
            <input
              type="number"
              step="any"
              min="1"
              placeholder="Qty"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="input-dark w-16 shrink-0 px-2.5 py-2 text-xs rounded-xl font-mono text-center"
            />
            <select
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="input-dark flex-1 min-w-0 px-2 py-2 text-xs rounded-xl cursor-pointer font-medium"
            >
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

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="input-dark w-full px-2.5 py-2 text-xs rounded-xl cursor-pointer font-medium"
          >
            <option value="Produce">Produce 🍎</option>
            <option value="Dairy">Dairy 🥛</option>
            <option value="Bakery">Bakery 🍞</option>
            <option value="Meat">Meat 🥩</option>
            <option value="Pantry">Pantry 📦</option>
          </select>

          <select
            value={newItemPriority}
            onChange={(e) => setNewItemPriority(e.target.value)}
            className="input-dark w-full px-2.5 py-2 text-xs rounded-xl cursor-pointer font-medium"
          >
            <option value="normal">🟢 Normal</option>
            <option value="medium">⭐ Medium</option>
            <option value="high">🔥 High</option>
          </select>

          <input
            type="number"
            step="0.10"
            placeholder="Est. $"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
          />
        </div>

        <button
          type="submit"
          className="btn-glow w-full py-3 rounded-xl text-white text-xs font-black tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-glow transition-all active:scale-95"
        >
          <span>➕</span> Add to Shopping Checklist
        </button>
      </form>

      <div className="glass p-3.5 rounded-2xl space-y-3 border border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            <input type="text" placeholder="Search checklist items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-dark w-full pl-8 pr-3 py-2 text-xs rounded-xl" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-dark px-2.5 py-1.5 text-xs rounded-xl cursor-pointer">
              <option value="priority">🔥 Priority Urgency</option>
              <option value="category">🏷️ Category</option>
              <option value="name">🔤 Name (A-Z)</option>
              <option value="date">🕒 Default</option>
            </select>
            <button type="button" onClick={toggleSelectAll} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer">✓ All</button>
            <button type="button" onClick={copyListToClipboard} className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer">📋 Copy</button>
            {checkedCount > 0 && <button type="button" onClick={clearPurchasedItems} className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 transition-all cursor-pointer">🧹 Clear Done</button>}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 space-y-2.5 border border-white/10">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2"><span className="text-4xl">🛒</span><p className="text-white font-bold text-sm">No checklist items match this view</p></div>
        ) : (
          filteredItems.map((item) => {
            const isHighPriority = item.priority === 'high';
            const estTotal = ((item.estimatedPrice || 2.50) * (item.quantityNum || 1)).toFixed(2);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                  item.checked
                    ? 'bg-slate-900/40 border-white/5 opacity-60'
                    : isHighPriority
                    ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                }`}
              >
                {/* Mobile: 2-Row Stack / Desktop: Single Inline Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Row 1: Checkbox, Emoji, Item Name, Category Tag & Price */}
                  <div className="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto flex-1">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`h-6 w-6 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.checked ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-glow' : 'border-slate-500 hover:border-emerald-400'
                        }`}
                      >
                        {item.checked && <span className="font-black text-xs">✓</span>}
                      </div>

                      <span className="text-2xl sm:text-3xl shrink-0">{item.emoji || '🛒'}</span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-extrabold text-sm sm:text-base leading-tight truncate ${item.checked ? 'line-through text-slate-500' : 'text-white'}`}>
                            {item.name}
                          </p>
                          {isHighPriority && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold uppercase">
                              🔥 Urgent
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium sm:hidden">
                          {item.category || 'Produce'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Right: Total Price */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        ${estTotal}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Unit Select Dropdown, Stepper (- 1 +), Priority Flag & Delete Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 shrink-0">
                    {/* Unit Selector Dropdown */}
                    <select
                      value={item.unit || 'pcs'}
                      onChange={(e) => changeItemUnit(item.id, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-emerald-500/15 text-emerald-300 font-bold text-xs rounded-xl px-2.5 py-1.5 border border-emerald-500/40 hover:border-emerald-500/70 cursor-pointer transition-all shrink-0 max-w-[105px]"
                    >
                      <option value="pcs">pcs 🍎</option>
                      <option value="kg">kg ⚖️</option>
                      <option value="g">g ⚖️</option>
                      <option value="L">L 🥛</option>
                      <option value="ml">ml 🧪</option>
                      <option value="dozen">dozen 🥚</option>
                      <option value="pack">pack 📦</option>
                      <option value="loaf">loaf 🍞</option>
                      <option value="unit">unit 🛒</option>
                    </select>

                    <div className="flex items-center gap-2">
                      {/* Quantity Stepper (- 1 +) */}
                      <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => adjustItemQuantity(item.id, -1, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black font-mono text-white min-w-[20px] text-center">
                          {item.quantityNum || 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => adjustItemQuantity(item.id, 1, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Priority Flag */}
                      <button
                        type="button"
                        onClick={(e) => cyclePriority(item.id, e)}
                        className="p-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                        title="Change Priority"
                      >
                        {item.priority === 'high' ? '🔥' : item.priority === 'medium' ? '⭐' : '🟢'}
                      </button>

                      {/* Trash Delete Icon */}
                      <button
                        type="button"
                        onClick={(e) => removeItem(item.id, e)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        title="Remove Item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
                  <option value="40130">📍 Jaffna - Tellippalai (40130)</option>
                  <option value="40075">📍 Jaffna - Chunnakam (40075)</option>
                  <option value="40000">📍 Jaffna - Main Town (40000)</option>
                  <option value="40060">📍 Jaffna - Kokkuvil (40060)</option>
                  <option value="40062">📍 Jaffna - Kondavil (40062)</option>
                  <option value="40200">📍 Jaffna - Manipay (40200)</option>
                  <option value="40600">📍 Jaffna - Point Pedro (40600)</option>
                  <option value="43000">📍 Kilinochchi Town (43000)</option>
                  <option value="00100">📍 Colombo Main City (00100)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>📍</span> Proximity Stores Surrounding {selectedPostalLocation.name} ({currentStoresList.length} Stores)
                </span>
                <span className="text-[11px] text-cyan-300 font-normal">👇 Tap map to mark exact house pin</span>
              </span>
              <div className="rounded-xl overflow-hidden border border-white/15 h-56 w-full relative">
                <MapContainer center={[userLat, userLng]} zoom={13} style={{ height: '100%', width: '100%' }} tap={false}>
                  <FlyToLocation center={[userLat, userLng]} />
                  <MapEventsHandler onLocationSelect={handleMapPinClick} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <Marker position={[userLat, userLng]} icon={userPinIcon}>
                    <Popup>
                      <strong>📍 Your Marked Home Location</strong><br />
                      {userLat.toFixed(4)}, {userLng.toFixed(4)}
                    </Popup>
                  </Marker>
                  {currentStoresList.map((shop) => (
                    <Marker key={shop._id} position={shop.coords || [userLat, userLng]} icon={storePinIcon} eventHandlers={{ click: () => setSelectedShop(shop) }}>
                      <Popup>
                        <strong>🏪 {shop.shopName}</strong><br />
                        {shop.distanceKm} km away · {shop.deliveryTimeMinutes}<br />
                        Fee: ${shop.deliveryFee === 0 ? 'Free' : shop.deliveryFee.toFixed(2)}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div className="absolute bottom-2 left-2 z-[400] glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                  <span>📍</span> Tap anywhere on map to move home pin
                </div>
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
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏪</span>
                        <div>
                          <p className="font-bold text-xs flex items-center gap-1.5">
                            {shop.shopName}
                            {shop.isVerified && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">✓ Verified</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">{shop.address} · ⭐ {shop.rating || 4.9} ({shop.reviewsCount || 100}+ reviews)</p>
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
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'cash' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  💵 Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${paymentMethod === 'card' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
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

      {/* Bill History & Receipts Modal */}
      {showBillHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass max-w-2xl w-full p-6 rounded-2xl border border-white/20 space-y-5 relative animate-scale-in bg-slate-900 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xl font-bold">
                  📜
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Order Bill History & Invoices</h3>
                  <p className="text-xs text-slate-400">View past purchase receipts, itemized details & delivery ratings.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBillHistoryModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bill List */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin">
              {billHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <span className="text-4xl">📜</span>
                  <p className="text-white font-bold">No bill history found</p>
                  <p className="text-xs text-slate-400">Your online store orders & receipts will appear here.</p>
                </div>
              ) : (
                billHistory.map((bill) => (
                  <div
                    key={bill.id}
                    className="glass p-4 rounded-xl border border-white/10 hover:border-amber-500/40 bg-white/5 space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{bill.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            {bill.status || 'Delivered 🎉'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Store: <strong className="text-white">{bill.shopName}</strong> • {bill.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Grand Total</span>
                        <span className="text-base font-extrabold text-brand-300 font-mono">
                          ${(bill.grandTotal || bill.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="text-xs text-slate-300 flex flex-wrap gap-2">
                      {bill.items?.map((it, idx) => (
                        <span key={idx} className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 font-mono text-[11px]">
                          {it.emoji || '🛒'} {it.name} <span className="text-slate-400">({it.qty})</span>
                        </span>
                      ))}
                    </div>

                    {/* Review Badge if exists */}
                    {bill.review && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-xs flex items-center justify-between">
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          ⭐ {'★'.repeat(bill.review.riderRating || 5)} - "{bill.review.reviewText}"
                        </span>
                        <span className="text-[10px] text-slate-400">Reviewed</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        OTP: <strong className="text-white">{bill.deliveryOtp || '----'}</strong> • Payment: <strong className="text-white uppercase">{bill.paymentMethod || 'cash'}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewReceipt(bill)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold transition-all cursor-pointer"
                        >
                          🧾 View Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Itemized Thermal Receipt Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full p-6 rounded-2xl border border-white/20 space-y-4 relative animate-scale-in bg-slate-950 shadow-2xl font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center border-b border-dashed border-white/20 pb-4 space-y-1">
              <span className="text-3xl">🧾</span>
              <h3 className="text-base font-extrabold text-white tracking-widest uppercase">FFDS STORE RECEIPT</h3>
              <p className="text-[11px] text-slate-400">{viewReceipt.shopName}</p>
              <p className="text-[10px] text-slate-500">{viewReceipt.shopAddress || 'Jaffna Main Branch'}</p>
              <p className="text-[10px] text-brand-400 font-bold pt-1">Invoice: {viewReceipt.id}</p>
              <p className="text-[10px] text-slate-400">{viewReceipt.date}</p>
            </div>

            <div className="space-y-2 border-b border-dashed border-white/20 pb-4">
              <div className="flex justify-between text-slate-400 font-bold text-[10px] uppercase">
                <span>Item</span>
                <span>Qty / Price</span>
              </div>
              {viewReceipt.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-200">
                  <span>{it.emoji || '🛒'} {it.name}</span>
                  <span className="text-right">{it.qty} • ${(it.price || 2.5).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-slate-400 pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-white">${(viewReceipt.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span className="text-white">${(viewReceipt.deliveryFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Eco Packaging:</span>
                <span className="text-white">${(viewReceipt.ecoFee || 0.50).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-brand-300 pt-2 border-t border-white/10">
                <span>GRAND TOTAL:</span>
                <span>${(viewReceipt.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-white/20 text-[10px] text-slate-400 space-y-1">
              <p>Payment: <strong className="text-white uppercase">{viewReceipt.paymentMethod}</strong></p>
              <p>Security OTP: <strong className="text-emerald-400">{viewReceipt.deliveryOtp}</strong></p>
              <p className="text-emerald-300 font-bold pt-1">Thank you for shopping with FFDS! 🌿</p>
            </div>

            <button
              onClick={() => { window.print(); }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all cursor-pointer mt-2"
            >
              🖨️ Print / Save Receipt
            </button>
          </div>
        </div>
      )}

      {/* Completed Delivery Auto-Add to Fridge / Cancel Modal */}
      {showAutoFridgePrompt && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
          <div className="glass max-w-md w-full p-6 rounded-3xl border border-emerald-500/40 bg-slate-900 shadow-2xl space-y-5 relative text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-glow">
              🎉
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-white">Order Delivered Successfully!</h3>
              <p className="text-xs text-slate-300">
                Order <span className="font-mono text-cyan-300 font-bold">#{activeChecklistOrder?._id || '323809'}</span> from{' '}
                <strong className="text-emerald-300">{activeSelectedShop?.shopName || 'Tellippalai Supermarket'}</strong> has arrived.
              </p>
            </div>

            <div className="glass p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2 text-left">
              <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <span>🧊</span> Auto-Add Delivered Items to Fridge Inventory?
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Seamlessly transfer your purchased items to your Fridge Inventory for automated expiration alerts, freshness tracking, and AI recipe ideas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await handleTransferToFridge();
                  setShowAutoFridgePrompt(false);
                  handleDismissOrderTracking();
                  setShowReviewModal(true);
                }}
                disabled={transferring}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {transferring ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-950 animate-ping" />
                    Adding to Fridge...
                  </>
                ) : (
                  <>
                    <span>📥</span> Add to Fridge & Leave Review
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAutoFridgePrompt(false);
                  handleDismissOrderTracking();
                  setShowReviewModal(true);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
              >
                ✕ Cancel / Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rate & Review Delivery Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-white/20 space-y-5 relative animate-scale-in bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xl font-bold">
                ⭐
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Rate & Review Delivery</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Order #{activeChecklistOrder?._id?.slice(-6) || '323809'} · Store: {activeSelectedShop?.shopName || 'super fast'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Rider Rating */}
              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/10">
                <label className="block text-xs font-bold text-slate-200">
                  🚴 Delivery Rider Rating (Nimal Perera #402):
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRiderRating(star)}
                      className={`text-2xl transition-transform cursor-pointer ${star <= riderRating ? 'text-amber-400 scale-110' : 'text-slate-600'
                        }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-amber-300 ml-2">
                    {riderRating === 5 ? '5/5 Excellent!' : riderRating === 4 ? '4/5 Good' : `${riderRating}/5`}
                  </span>
                </div>
              </div>

              {/* Store & Freshness Rating */}
              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/10">
                <label className="block text-xs font-bold text-slate-200">
                  🍎 Produce Freshness & Store Rating:
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStoreRating(star)}
                      className={`text-2xl transition-transform cursor-pointer ${star <= storeRating ? 'text-emerald-400 scale-110' : 'text-slate-600'
                        }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-emerald-300 ml-2">
                    {storeRating === 5 ? '5/5 Super Fresh!' : `${storeRating}/5`}
                  </span>
                </div>
              </div>

              {/* Quick Tag Chips */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  🏷️ Highlight Tags:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '⚡ Fast 10-Min Delivery',
                    '🍎 Super Fresh Produce',
                    '😊 Polite & Friendly Rider',
                    '📦 Perfect Eco Packaging',
                    '🧊 Cold Chain Maintained',
                    '💯 Excellent Value',
                  ].map((tag) => {
                    const isSelected = selectedReviewTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedReviewTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setSelectedReviewTags(prev => [...prev, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all cursor-pointer ${isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                          }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Comment Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  ✍️ Written Review / Feedback:
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about rider speed, polite service, & produce freshness quality..."
                  rows={3}
                  className="input-dark w-full px-3 py-2.5 text-xs rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="btn-glow w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-glow flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⭐</span> Submit Delivery & Produce Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const SRI_LANKA_POSTAL_CODES = [
  // 📍 JAFFNA DISTRICT (Full list from thesrilanka.lk)
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

  // 📍 NORTHERN PROVINCE
  { code: '43000', name: 'Kilinochchi Town', district: 'Kilinochchi', coords: [9.3803, 80.3992] },
  { code: '43020', name: 'Paranthan', district: 'Kilinochchi', coords: [9.4420, 80.4050] },
  { code: '43040', name: 'Elephant Pass', district: 'Kilinochchi', coords: [9.5250, 80.4020] },
  { code: '41000', name: 'Mannar Town', district: 'Mannar', coords: [8.9780, 79.9044] },
  { code: '41020', name: 'Murunkan', district: 'Mannar', coords: [8.8350, 79.9950] },
  { code: '42000', name: 'Vavuniya Town', district: 'Vavuniya', coords: [8.7514, 80.4971] },
  { code: '42050', name: 'Cheddikulam', district: 'Vavuniya', coords: [8.6650, 80.3120] },
  { code: '42200', name: 'Mullaitivu Town', district: 'Mullaitivu', coords: [9.2671, 80.8143] },
  { code: '42220', name: 'Puthukkudiyiruppu', district: 'Mullaitivu', coords: [9.3120, 80.6850] },

  // 📍 COLOMBO DISTRICT
  { code: '00100', name: 'Colombo 01 (Fort / Pettah)', district: 'Colombo', coords: [6.9344, 79.8428] },
  { code: '00200', name: 'Colombo 02 (Slave Island)', district: 'Colombo', coords: [6.9230, 79.8520] },
  { code: '00300', name: 'Colombo 03 (Kollupitiya)', district: 'Colombo', coords: [6.9080, 79.8530] },
  { code: '00400', name: 'Colombo 04 (Bambalapitiya)', district: 'Colombo', coords: [6.8920, 79.8570] },
  { code: '00500', name: 'Colombo 05 (Havelock / Kirulapone)', district: 'Colombo', coords: [6.8840, 79.8710] },
  { code: '00600', name: 'Colombo 06 (Wellawatte)', district: 'Colombo', coords: [6.8740, 79.8620] },
  { code: '00700', name: 'Colombo 07 (Cinnamon Gardens)', district: 'Colombo', coords: [6.9110, 79.8680] },
  { code: '00800', name: 'Colombo 08 (Borella)', district: 'Colombo', coords: [6.9180, 79.8780] },
  { code: '00900', name: 'Colombo 09 (Dematagoda)', district: 'Colombo', coords: [6.9280, 79.8790] },
  { code: '01000', name: 'Colombo 10 (Maradana)', district: 'Colombo', coords: [6.9270, 79.8650] },
  { code: '01100', name: 'Colombo 11 (Pettah Central)', district: 'Colombo', coords: [6.9380, 79.8510] },
  { code: '01200', name: 'Colombo 12 (Hultsdorf)', district: 'Colombo', coords: [6.9410, 79.8570] },
  { code: '01300', name: 'Colombo 13 (Kotahena)', district: 'Colombo', coords: [6.9480, 79.8620] },
  { code: '01400', name: 'Colombo 14 (Grandpass)', district: 'Colombo', coords: [6.9530, 79.8720] },
  { code: '01500', name: 'Colombo 15 (Mattakkuliya / Mutwal)', district: 'Colombo', coords: [6.9710, 79.8680] },
  { code: '10100', name: 'Kotte', district: 'Colombo', coords: [6.8944, 79.9025] },
  { code: '10115', name: 'Malabe', district: 'Colombo', coords: [6.9040, 79.9540] },
  { code: '10120', name: 'Battaramulla', district: 'Colombo', coords: [6.8980, 79.9230] },
  { code: '10230', name: 'Maharagama', district: 'Colombo', coords: [6.8480, 79.9260] },
  { code: '10250', name: 'Dehiwala-Mount Lavinia', district: 'Colombo', coords: [6.8344, 79.8711] },
  { code: '10350', name: 'Nugegoda', district: 'Colombo', coords: [6.8710, 79.8880] },
  { code: '10400', name: 'Moratuwa', district: 'Colombo', coords: [6.7730, 79.8816] },

  // 📍 GAMPAHA DISTRICT
  { code: '11000', name: 'Gampaha Town', district: 'Gampaha', coords: [7.0873, 79.9925] },
  { code: '11300', name: 'Ja-Ela', district: 'Gampaha', coords: [7.0750, 79.8910] },
  { code: '11500', name: 'Negombo', district: 'Gampaha', coords: [7.2083, 79.8358] },
  { code: '11600', name: 'Kelaniya', district: 'Gampaha', coords: [6.9553, 79.9194] },
  { code: '11700', name: 'Wattala', district: 'Gampaha', coords: [6.9890, 79.8920] },

  // 📍 KANDY & CENTRAL
  { code: '20000', name: 'Kandy City', district: 'Kandy', coords: [7.2906, 80.6337] },
  { code: '20400', name: 'Peradeniya', district: 'Kandy', coords: [7.2680, 80.5960] },
  { code: '20800', name: 'Gampola', district: 'Kandy', coords: [7.1630, 80.5690] },
  { code: '20900', name: 'Katugastota', district: 'Kandy', coords: [7.3180, 80.6250] },
  { code: '22200', name: 'Nuwara Eliya Town', district: 'Nuwara Eliya', coords: [6.9497, 80.7891] },
  { code: '22000', name: 'Hatton', district: 'Nuwara Eliya', coords: [6.8920, 80.5980] },
  { code: '21000', name: 'Matale', district: 'Matale', coords: [7.4675, 80.6234] },
  { code: '21100', name: 'Dambulla', district: 'Matale', coords: [7.8742, 80.6511] },

  // 📍 SOUTHERN PROVINCE
  { code: '80000', name: 'Galle Fort & City', district: 'Galle', coords: [6.0535, 80.2210] },
  { code: '80500', name: 'Hikkaduwa', district: 'Galle', coords: [6.1400, 80.1030] },
  { code: '80100', name: 'Ambalangoda', district: 'Galle', coords: [6.2360, 80.0540] },
  { code: '81000', name: 'Matara Town', district: 'Matara', coords: [5.9496, 80.5469] },
  { code: '81700', name: 'Weligama', district: 'Matara', coords: [5.9730, 80.4280] },
  { code: '81060', name: 'Dikwella', district: 'Matara', coords: [5.9620, 80.6920] },
  { code: '82000', name: 'Hambantota', district: 'Hambantota', coords: [6.1248, 81.1185] },
  { code: '82600', name: 'Tangalle', district: 'Hambantota', coords: [6.0240, 80.7950] },
  { code: '82400', name: 'Tissamaharama', district: 'Hambantota', coords: [6.2810, 81.2850] },

  // 📍 NORTH WESTERN & NORTH CENTRAL
  { code: '60000', name: 'Kurunegala Town', district: 'Kurunegala', coords: [7.4863, 80.3647] },
  { code: '60100', name: 'Kuliyapitiya', district: 'Kurunegala', coords: [7.4680, 80.0410] },
  { code: '61000', name: 'Puttalam', district: 'Puttalam', coords: [8.0362, 79.8283] },
  { code: '61250', name: 'Chilaw', district: 'Puttalam', coords: [7.5758, 79.7953] },
  { code: '50000', name: 'Anuradhapura Town', district: 'Anuradhapura', coords: [8.3114, 80.4037] },
  { code: '50100', name: 'Kekirawa', district: 'Anuradhapura', coords: [8.0410, 80.5820] },
  { code: '51000', name: 'Polonnaruwa', district: 'Polonnaruwa', coords: [7.9403, 81.0188] },
  { code: '51100', name: 'Hingurakgoda', district: 'Polonnaruwa', coords: [8.0520, 80.9810] },

  // 📍 EASTERN PROVINCE
  { code: '31000', name: 'Trincomalee Town', district: 'Trincomalee', coords: [8.5874, 81.2152] },
  { code: '31100', name: 'Kinniya', district: 'Trincomalee', coords: [8.4980, 81.1850] },
  { code: '30000', name: 'Batticaloa Town', district: 'Batticaloa', coords: [7.7170, 81.7000] },
  { code: '30300', name: 'Kattankudy', district: 'Batticaloa', coords: [7.6850, 81.7250] },
  { code: '32000', name: 'Ampara Town', district: 'Ampara', coords: [7.2912, 81.6724] },
  { code: '32300', name: 'Kalmunai', district: 'Ampara', coords: [7.4160, 81.8320] },

  // 📍 SABARAGAMUWA & UVA
  { code: '12000', name: 'Kalutara', district: 'Kalutara', coords: [6.5854, 79.9607] },
  { code: '12500', name: 'Panadura', district: 'Kalutara', coords: [6.7130, 79.9070] },
  { code: '12100', name: 'Horana', district: 'Kalutara', coords: [6.7150, 80.0620] },
  { code: '70000', name: 'Ratnapura', district: 'Ratnapura', coords: [6.6828, 80.3992] },
  { code: '70100', name: 'Balangoda', district: 'Ratnapura', coords: [6.6480, 80.7020] },
  { code: '71000', name: 'Kegalle', district: 'Kegalle', coords: [7.2513, 80.3464] },
  { code: '71500', name: 'Mawanella', district: 'Kegalle', coords: [7.2520, 80.4480] },
  { code: '90000', name: 'Badulla', district: 'Badulla', coords: [6.9934, 81.0550] },
  { code: '90100', name: 'Bandarawela', district: 'Badulla', coords: [6.8310, 80.9980] },
  { code: '90900', name: 'Ella', district: 'Badulla', coords: [6.8667, 81.0466] },
  { code: '91000', name: 'Monaragala', district: 'Monaragala', coords: [6.8726, 81.3507] },
  { code: '91200', name: 'Wellawaya', district: 'Monaragala', coords: [6.7380, 81.1020] },
];

export function ConsumerSettings() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    language: 'en',
    address: '',
    cardHolderName: '',
    cardNumberMasked: '',
    expiryDate: '',
  });
  const [pinPos, setPinPos] = useState([6.9271, 79.8612]);
  const [postalSearchQuery, setPostalSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        postalCode: user.postalCode || '',
        language: user.language || 'en',
        address: user.address || '',
        cardHolderName: user.cardDetails?.cardHolderName || '',
        cardNumberMasked: user.cardDetails?.cardNumberMasked || '',
        expiryDate: user.cardDetails?.expiryDate || '',
      });
      if (user.location?.coordinates && user.location.coordinates.length === 2) {
        setPinPos([user.location.coordinates[1], user.location.coordinates[0]]);
      }
    }
  }, [user]);

  const handleSelectPostalCode = (item) => {
    if (!item) return;
    setFormData((prev) => ({
      ...prev,
      postalCode: item.code,
      address: prev.address ? prev.address : `${item.name}, ${item.district}`,
    }));
    setPinPos(item.coords);
    setSuccess(`📍 Set map location to ${item.name} (${item.code}, ${item.district})! Save profile to store.`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const filteredPostalCodes = SRI_LANKA_POSTAL_CODES.filter((item) => {
    const q = postalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.includes(q) ||
      item.district.toLowerCase().includes(q)
    );
  });

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPinPos([pos.coords.latitude, pos.coords.longitude]);
          setSuccess('📍 Current location detected via GPS!');
          setTimeout(() => setSuccess(''), 4000);
        },
        () => setError('Unable to retrieve GPS location.')
      );
    }
  };

  const handleSearchAddressLocation = async () => {
    if (!formData.address || !formData.address.trim()) {
      setError('Please enter a street address to search on the map.');
      return;
    }
    setSearchingAddress(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address.trim())}`);
      const results = await res.json();
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        setPinPos([lat, lon]);
        setSuccess(`📍 Found map location for "${formData.address}"! Save profile to store changes.`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Location not found. Try adding details like city or country (e.g. Jaffna, Sri Lanka).');
      }
    } catch {
      setError('Failed to search location.');
    } finally {
      setSearchingAddress(false);
    }
  };

  const formatCardDisplayNumber = (raw) => {
    if (!raw) return '•••• •••• •••• 4242';
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 16);
    if (!digitsOnly) {
      const cleaned = raw.replace(/[^\d•]/g, '').slice(0, 19);
      if (!cleaned) return '•••• •••• •••• 4242';
      return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    }
    return digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
  };

  const getCardBrandInfo = (raw) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('5')) {
      return { name: 'MASTERCARD', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 border-amber-500/30' };
    }
    if (digits.startsWith('3')) {
      return { name: 'AMEX', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 border-cyan-500/30' };
    }
    if (digits.startsWith('4')) {
      return { name: 'VISA', color: 'text-blue-400', badgeBg: 'bg-blue-500/20 border-blue-500/30' };
    }
    return { name: 'DEBIT / CREDIT', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 border-emerald-500/30' };
  };

  const cardBrand = getCardBrandInfo(formData.cardNumberMasked);

  const handleExpiryDateChange = (e) => {
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
    setFormData((prev) => ({ ...prev, expiryDate: formatted }));
  };

  const handleCardNumberChange = (e) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 16);
    const formatted = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
    setFormData((prev) => ({ ...prev, cardNumberMasked: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        postalCode: formData.postalCode,
        language: formData.language,
        address: formData.address,
        location: { type: 'Point', coordinates: [pinPos[1], pinPos[0]] },
        cardDetails: { cardHolderName: formData.cardHolderName, cardNumberMasked: formData.cardNumberMasked, expiryDate: formData.expiryDate },
      };
      const { data } = await api.put('/auth/profile', payload);
      login(data.token, data.user);
      setSuccess('Profile & delivery preferences updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up pb-16">
      {/* Profile Hero Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-glow">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-emerald-300">
                {formData.name ? formData.name.charAt(0).toUpperCase() : '👤'}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full text-xs font-bold shadow-md" title="Verified Account">
              ✓
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formData.name || 'Consumer Profile'}
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                🍏 Verified Consumer
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Configure your profile details, Sri Lanka house pin location for rapid grocery store dispatch, and saved payment options.
            </p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <span>📧</span> {formData.email || 'No email set'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <span>🇱🇰</span> {formData.phone || 'No phone set'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-bold">
                <span>📍</span> Pin: {pinPos[0].toFixed(3)}, {pinPos[1].toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Alerts */}
        {error && (
          <div className="glass p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-up">
            <span className="text-xl">⚠️</span>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}
        {success && (
          <div className="glass p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-up shadow-glow">
            <span className="text-xl">🎉</span>
            <div className="flex-1 font-medium">{success}</div>
          </div>
        )}

        {/* Card 1: Account & Contact Details */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5 bg-slate-900/60 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-lg font-bold">
              👤
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Account & Contact Details</h3>
              <p className="text-xs text-slate-400">Personal information used for delivery invoices & notifications</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>👤</span> Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
                placeholder="e.g. Lambotharan"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>✉️</span> Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>🇱🇰</span> Mobile Phone Number
              </label>
              <input
                type="text"
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>📮</span> Sri Lanka Postal Code
              </label>
              <input
                type="text"
                placeholder="e.g. 40000, 40130, 00100"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Sri Lanka Delivery Location & Map Precision Pin */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5 bg-slate-900/60 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-lg font-bold">
                📍
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delivery Location & Precise House Pin</h3>
                <p className="text-xs text-slate-400">Set exact coordinates for 10-15 minute grocery store dispatch</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-glow"
            >
              <span>🎯</span> Detect GPS Location
            </button>
          </div>

          {/* Street Address Search */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
              <span>🏠 Street Address / Landmark</span>
              <span className="text-[11px] text-slate-400 font-normal">Type address & search to pin on map</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. KKS Road, Chunnakam, Jaffna..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-dark flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl"
              />
              <button
                type="button"
                onClick={handleSearchAddressLocation}
                disabled={searchingAddress}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {searchingAddress ? <span className="spinner" /> : '🔍 Search Map'}
              </button>
            </div>
          </div>

          {/* Quick Postal Code Search & Dropdown Selector */}
          <div className="glass p-4 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📮</span> Quick Select Sri Lanka Town (Auto-Pin Map)
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono font-bold">
                {filteredPostalCodes.length} towns match
              </span>
            </div>

            <input
              type="text"
              placeholder="🔍 Search town name or code (e.g. Tellipalai, Chunnakam, Colombo, 40130)..."
              value={postalSearchQuery}
              onChange={(e) => setPostalSearchQuery(e.target.value)}
              className="input-dark w-full px-3.5 py-2 text-xs rounded-xl"
            />

            <select
              onChange={(e) => {
                const sel = SRI_LANKA_POSTAL_CODES.find((c) => c.code === e.target.value);
                if (sel) handleSelectPostalCode(sel);
              }}
              className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl cursor-pointer font-medium"
              value={formData.postalCode}
            >
              <option value="" disabled>-- Select Town to Pin Map --</option>
              {filteredPostalCodes.map((item) => (
                <option key={item.code + item.name} value={item.code}>
                  📍 [{item.code}] {item.district} — {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span className="text-cyan-300 font-bold">👇 Tap or drag pin on map to set house location</span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10 text-white font-bold">
                Lat: {pinPos[0].toFixed(4)}, Lng: {pinPos[1].toFixed(4)}
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl relative" style={{ height: 280 }}>
              <MapContainer center={pinPos} zoom={13} style={{ height: '100%', width: '100%' }} tap={false}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FlyToLocation center={pinPos} />
                <MapEventsHandler onLocationSelect={(lat, lng) => setPinPos([lat, lng])} />
                <Marker position={pinPos} icon={userPinIcon}>
                  <Popup>
                    <strong>📍 Your Marked Delivery Pin</strong><br />
                    {pinPos[0].toFixed(4)}, {pinPos[1].toFixed(4)}
                  </Popup>
                </Marker>
              </MapContainer>

              <div className="absolute bottom-3 left-3 z-[400] glass px-3 py-1.5 rounded-xl text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg border border-cyan-500/30">
                <span>📍</span> Tap map anywhere to refine house entry point
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Saved Payment Card Details */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5 bg-slate-900/60 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-lg font-bold">
              💳
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Payment Method & Card Details</h3>
              <p className="text-xs text-slate-400">Manage payment card information for fast 1-click checkout</p>
            </div>
          </div>

          {/* Visual Credit Card Preview */}
          <div className="glass p-6 rounded-2xl border border-white/15 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 shadow-2xl space-y-4 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">FFDS EXPRESS PAY</span>
              <span className={`text-xs font-extrabold font-mono px-2.5 py-1 rounded-lg border ${cardBrand.badgeBg} ${cardBrand.color} shadow-sm`}>
                💳 {cardBrand.name}
              </span>
            </div>

            {/* Authentic Golden EMV Metallic Chip Graphic */}
            <div className="relative z-10 my-1">
              <div className="w-11 h-8 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 rounded-md border border-amber-300/60 shadow-md relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-[1px] bg-amber-900/50 absolute top-2.5" />
                <div className="w-full h-[1px] bg-amber-900/50 absolute bottom-2.5" />
                <div className="w-[1px] h-full bg-amber-900/50 absolute left-4" />
                <div className="w-2.5 h-3 rounded-sm border border-amber-900/40" />
              </div>
            </div>

            <div className="pt-1 relative z-10">
              <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Card Number</span>
              <p className="text-lg sm:text-xl font-mono font-extrabold text-white tracking-widest truncate">
                {formatCardDisplayNumber(formData.cardNumberMasked)}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs font-mono relative z-10">
              <div className="max-w-[220px] truncate">
                <span className="text-[9px] text-slate-400 uppercase block">Cardholder</span>
                <span className="font-bold text-slate-200 uppercase tracking-wider truncate block">
                  {formData.cardHolderName ? formData.cardHolderName.toUpperCase() : (formData.name ? formData.name.toUpperCase() : 'CARDHOLDER NAME')}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] text-slate-400 uppercase block">Expires</span>
                <span className="font-bold text-slate-200">{formData.expiryDate || 'MM/YY'}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Cardholder Name</label>
              <input
                type="text"
                placeholder="e.g. Debit Card / Srilambotharan"
                maxLength={26}
                value={formData.cardHolderName}
                onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                className="input-dark w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY (e.g. 06/30)"
                maxLength={5}
                value={formData.expiryDate}
                onChange={handleExpiryDateChange}
                className="input-dark w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Card Number (Max 16 Digits, Auto-Grouped)</label>
            <input
              type="text"
              placeholder="4532 8921 4412 4242"
              maxLength={19}
              value={formData.cardNumberMasked}
              onChange={handleCardNumberChange}
              className="input-dark w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl font-mono"
            />
          </div>
        </div>

        {/* Card 4: Language & Regional Preferences */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-4 bg-slate-900/60 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-lg font-bold">
              🌐
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">App Language & Regional Settings</h3>
              <p className="text-xs text-slate-400">Select your preferred display language for UI & notifications</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Preferred Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-bold cursor-pointer"
            >
              <option value="en">English (US)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="si">සිංහල (Sinhala)</option>
            </select>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-glow w-full py-4 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-glow cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            {submitting ? (
              <>
                <span className="spinner" /> Saving Updates...
              </>
            ) : (
              '💾 Save Profile & Delivery Preferences'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export { default as ConsumerChatbot } from './widgets/ConsumerChatbot';



