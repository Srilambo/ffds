import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import ChatBot from '../../components/ChatBot';

// ────────────────────────────────────────────────────────────
// CONSUMER PANTRY
// ────────────────────────────────────────────────────────────
export function ConsumerPantry() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLocation, setActiveLocation] = useState('all'); // 'all', 'fridge', 'pantry'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🧊</span> My Fridge Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time freshness tracker for items saved in your Fridge.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2"
          >
            <span>+ Add Item</span>
          </button>
          <button
            onClick={loadItems}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            title="Refresh Inventory"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Overview Metric Bar */}
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

      {/* Search Bar */}
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
        <div className="flex justify-center py-16">
          <span className="spinner h-8 w-8" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl space-y-3">
          <p className="text-5xl">🍽️</p>
          <p className="font-bold text-white text-base">No items found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Scan a food item or add it manually to track your pantry's freshness.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold inline-block mt-2"
          >
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
              fresh:    { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Fresh' },
              expiring: { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-500',   label: 'Expiring Soon' },
              spoiled:  { border: 'border-red-500/30',     bg: 'bg-red-500/5',     badge: 'text-red-400 bg-red-500/10 border-red-500/20',         dot: 'bg-red-500',     label: 'Expired' },
            };
            const s = statusStyles[status];
            const locIcon = item.location === 'fridge' ? '🧊' : '🗄️';

            return (
              <div
                key={item._id}
                className={`glass ${s.bg} border ${s.border} rounded-2xl p-5 space-y-4 flex flex-col justify-between card-hover transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{locIcon}</span>
                        <p className="font-bold text-white text-lg capitalize">{item.foodName}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${s.badge}`}>
                      {s.label}
                    </span>
                  </div>

                  {/* Freshness Days Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Status</span>
                      <span className={daysLeft <= 0 ? 'text-red-400 font-bold' : daysLeft <= 2 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Expires today' : 'Expired'}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          daysLeft <= 0 ? 'bg-red-500' : daysLeft <= 2 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, (daysLeft / 10) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleUpdateStatus(item._id, 'consumed')}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all"
                  >
                    🍴 Consumed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item._id, 'wasted')}
                    className="flex-1 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all"
                  >
                    🗑️ Wasted
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs transition-all"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>📦</span> Add to Pantry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Milk, Tomatoes, Apples"
                  value={newItem.foodName}
                  onChange={(e) => setNewItem({ ...newItem, foodName: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  >
                    <option value="fruit">Fruit 🍎</option>
                    <option value="vegetable">Vegetable 🥦</option>
                    <option value="dairy">Dairy 🥛</option>
                    <option value="bakery">Bakery 🍞</option>
                    <option value="meat">Meat 🥩</option>
                    <option value="other">Other 📦</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Storage Location</label>
                  <select
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  >
                    <option value="fridge">Fridge 🧊</option>
                    <option value="pantry">Pantry 🗄️</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: +e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="pcs, kg, liters"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 btn-glow py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {addLoading ? <span className="spinner" /> : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONSUMER HISTORY
// ────────────────────────────────────────────────────────────
export function ConsumerHistory() {
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [filterLabel, setFilterLabel] = useState('all');

  const loadScans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/scans');
      setScans(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.warn('Failed to load scan history:', err);
      setScans([]);
      setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const labelConfig = {
    Fresh:      { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: '✅' },
    Borderline: { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: '⚠️' },
    Spoiled:    { badge: 'text-red-400 bg-red-500/10 border-red-500/20', icon: '❌' },
  };

  const filteredScans = scans.filter((s) => {
    if (filterLabel === 'all') return true;
    return s.label === filterLabel;
  });

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📜</span> Scan Log & Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review AI freshness assessments and multi-sensor gas logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadScans}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh History
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass p-3 rounded-2xl flex items-center gap-2 overflow-x-auto">
        {['all', 'Fresh', 'Borderline', 'Spoiled'].map((lbl) => (
          <button
            key={lbl}
            onClick={() => setFilterLabel(lbl)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
              filterLabel === lbl
                ? 'bg-brand-600/25 border border-brand-500/40 text-brand-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {lbl === 'all' ? 'All Scans' : lbl}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="spinner h-8 w-8" />
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl space-y-3">
          <p className="text-5xl">📸</p>
          <p className="font-bold text-white text-base">No scans recorded yet</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Use the Scan tool to evaluate produce freshness and log AI confidence scores.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScans.map((scan) => {
            const cfg = labelConfig[scan.label] || labelConfig.Fresh;
            return (
              <div
                key={scan._id}
                onClick={() => setSelectedScan(scan)}
                className="glass border border-white/10 rounded-2xl overflow-hidden hover:border-brand-500/40 transition-all flex flex-col justify-between cursor-pointer group card-hover"
              >
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={scan.imageUrl}
                    alt={scan.foodType}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-md">
                    <span className="text-xs">{cfg.icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badge.split(' ')[0]}`}>
                      {scan.label}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white capitalize text-base">{scan.foodType}</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(scan.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase">Confidence</p>
                        <p className="font-bold text-brand-300 font-mono text-xs">{scan.confidence}%</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 italic mt-2">
                      "{scan.chatbotExplanation || 'CNN + Multi-gas sensor assessment completed.'}"
                    </p>
                  </div>

                  <div className="pt-2">
                    <button className="w-full py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-white rounded-xl text-xs font-semibold border border-brand-500/20 transition-all flex items-center justify-center gap-1.5">
                      <span>🤖</span> Inspect & Ask AI
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail view */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-2xl my-8 rounded-2xl overflow-hidden shadow-2xl fade-up max-h-[90vh] flex flex-col border border-white/15">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
              <div>
                <h2 className="font-bold text-white text-lg capitalize flex items-center gap-2">
                  <span>{labelConfig[selectedScan.label]?.icon}</span>
                  {selectedScan.foodType} Analysis Report
                </h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ID: {selectedScan._id} · {new Date(selectedScan.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="text-slate-400 hover:text-white text-2xl h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img
                  src={selectedScan.imageUrl}
                  alt={selectedScan.foodType}
                  className="rounded-2xl object-cover h-52 w-full border border-white/10 shadow-lg"
                />
                <div className="space-y-4 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Freshness Rating</span>
                    <p className="text-3xl font-extrabold text-white capitalize flex items-center gap-2 mt-1">
                      {selectedScan.label}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${labelConfig[selectedScan.label]?.badge}`}>
                        {selectedScan.confidence}% confidence
                      </span>
                    </p>
                  </div>

                  {selectedScan.gasReadings && (
                    <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">🌡️ Sensor Telemetry</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/5 rounded-lg py-2 px-1">
                          <p className="text-[10px] text-slate-400">NH₃</p>
                          <p className="font-bold text-white font-mono text-xs">{selectedScan.gasReadings.nh3} ppm</p>
                        </div>
                        <div className="bg-white/5 rounded-lg py-2 px-1">
                          <p className="text-[10px] text-slate-400">H₂S</p>
                          <p className="font-bold text-white font-mono text-xs">{selectedScan.gasReadings.h2s} ppm</p>
                        </div>
                        <div className="bg-white/5 rounded-lg py-2 px-1">
                          <p className="text-[10px] text-slate-400">Ethylene</p>
                          <p className="font-bold text-white font-mono text-xs">{selectedScan.gasReadings.ethylene} ppm</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <ChatBot scanId={selectedScan._id} initialExplanation={selectedScan.chatbotExplanation} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONSUMER RECIPES
// ────────────────────────────────────────────────────────────
export function ConsumerRecipes() {
  const { t } = useTranslation();
  const [pantryItems, setPantryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const fetchPantryAndGenerateRecipes = async () => {
    setLoading(true);
    setGenerating(true);
    try {
      let items = [];
      try {
        const { data } = await api.get('/inventory', { params: { status: 'active' } });
        items = Array.isArray(data) ? data : [];
      } catch {
        try {
          const { data } = await api.get('/manager/inventory', { params: { status: 'active' } });
          items = Array.isArray(data) ? data : [];
        } catch {}
      }
      setPantryItems(items);

      const ingredientNames = items.map((i) => i.foodName).filter(Boolean);

      if (ingredientNames.length > 0) {
        const res = await api.post('/chat/recipes/generate', { ingredients: ingredientNames });
        if (res.data?.recipes && Array.isArray(res.data.recipes)) {
          setRecipes(res.data.recipes);
        } else {
          setRecipes([]);
        }
      } else {
        setRecipes([]);
      }
    } catch (err) {
      console.error('Failed to generate AI recipes:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchPantryAndGenerateRecipes();
  }, []);

  const hasPantryItem = (itemName) => {
    return pantryItems.some((i) =>
      i.foodName.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(i.foodName.toLowerCase())
    );
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🍳</span> AI Recipe Suggestions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Zero-waste recipe ideas generated by Gemini AI tailored specifically to active items in your fridge.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPantryAndGenerateRecipes}
            disabled={generating}
            className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            {generating ? (
              <><span className="spinner" /> Generating AI Recipes...</>
            ) : (
              <><span>✨</span> Regenerate with Gemini AI</>
            )}
          </button>
        </div>
      </div>

      {/* Pantry Stock Banner */}
      {pantryItems.length > 0 ? (
        <div className="glass border border-brand-500/30 bg-brand-500/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">🧊</span>
            <div>
              <p className="font-bold text-brand-300 text-sm flex items-center gap-2">
                Active Fridge Ingredients Detected ({pantryItems.length})
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Gemini Synced
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {pantryItems.map((item, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-0.5 rounded-lg bg-white/10 text-white font-medium">
                    {item.foodName} ({item.quantity} {item.unit})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass border border-amber-500/30 bg-amber-500/10 rounded-2xl p-6 text-center space-y-3">
          <span className="text-4xl">🛒</span>
          <h3 className="font-bold text-white text-base">Your Fridge is Empty</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            No active ingredients found in your fridge stock. Add or scan items into your fridge to generate custom zero-waste Gemini AI recipes!
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/home" className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold">
              🔍 Scan Food Now
            </Link>
            <Link to="/consumer/pantry" className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:text-white text-xs font-semibold">
              🧊 Manage Fridge
            </Link>
          </div>
        </div>
      )}

      {/* Loading state */}
      {generating && (
        <div className="glass p-12 text-center text-slate-300 rounded-2xl space-y-3 animate-pulse">
          <div className="text-5xl animate-bounce-gentle">🤖</div>
          <p className="font-bold text-white text-base">Gemini AI is crafting your recipes...</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Analyzing your active ingredients ({pantryItems.map((i) => i.foodName).join(', ')}) to build custom zero-waste steps.
          </p>
        </div>
      )}

      {/* Recipe Cards */}
      {!generating && recipes.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {recipes.map((r, idx) => {
            const usesList = r.uses || [];
            const matches = usesList.filter((ing) => hasPantryItem(ing));
            const matchRatio = `${matches.length}/${usesList.length}`;

            return (
              <div
                key={idx}
                className="glass border border-white/10 rounded-2xl p-5 space-y-4 hover:border-brand-500/40 transition-all cursor-pointer group flex flex-col justify-between card-hover"
                onClick={() => setSelectedRecipe(r)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{r.icon || '🍳'}</span>
                      <div>
                        <p className="font-bold text-white group-hover:text-brand-300 transition-colors text-lg">
                          {r.name}
                        </p>
                        <p className="text-xs text-slate-400">⏱ {r.time || '15 min'} · {r.difficulty || 'Easy'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {matchRatio} ingredients
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {usesList.map((ing, iIdx) => {
                      const matched = hasPantryItem(ing);
                      return (
                        <span
                          key={iIdx}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                            matched
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}
                        >
                          {ing} {matched ? '✓' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Tap to inspect AI recipe steps</span>
                  <span className="text-xs font-semibold text-brand-300 group-hover:translate-x-1 transition-transform">
                    View Recipe →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4 fade-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedRecipe.icon || '🍳'}</span>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedRecipe.name}</h3>
                  <p className="text-xs text-slate-400">⏱ {selectedRecipe.time || '15 min'} · {selectedRecipe.difficulty || 'Easy'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="text-slate-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Ingredients</p>
              <div className="flex flex-wrap gap-2">
                {(selectedRecipe.uses || []).map((ing, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200">
                    {ing}
                  </span>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Gemini AI Step-by-Step Instructions</p>
              <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
                {(selectedRecipe.steps || []).map((step, idx) => (
                  <li key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="btn-glow px-5 py-2 rounded-xl text-white text-xs font-semibold"
              >
                Close Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONSUMER SHOPPING LIST
// ────────────────────────────────────────────────────────────
const DEFAULT_SHOPPING = [
  { id: '1', name: 'Fresh Milk', qty: '1 Liter', category: 'Dairy', checked: false, emoji: '🥛', source: 'manual' },
  { id: '2', name: 'Whole Wheat Bread', qty: '1 loaf', category: 'Bakery', checked: false, emoji: '🍞', source: 'manual' },
  { id: '3', name: 'Red Apples', qty: '1 kg', category: 'Produce', checked: false, emoji: '🍎', source: 'manual' },
  { id: '4', name: 'Organic Spinach', qty: '200g', category: 'Produce', checked: true, emoji: '🥬', source: 'manual' },
  { id: '5', name: 'Eggs', qty: '1 dozen', category: 'Dairy', checked: false, emoji: '🥚', source: 'manual' },
];

function getCategoryEmoji(name, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('milk') || c.includes('dairy') || n.includes('cheese') || n.includes('yogurt')) return '🥛';
  if (n.includes('bread') || c.includes('bakery') || n.includes('toast') || n.includes('bun')) return '🍞';
  if (n.includes('apple')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('spinach') || n.includes('lettuce') || n.includes('cabbage')) return '🥬';
  if (n.includes('egg')) return '🥚';
  if (n.includes('chicken') || n.includes('meat') || n.includes('beef') || c.includes('meat')) return '🥩';
  if (c.includes('produce') || c.includes('fruit') || c.includes('vegetable')) return '🍎';
  return '🛒';
}

export function ConsumerShoppingList() {
  const { t } = useTranslation();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ffds_shopping_checklist');
      return saved ? JSON.parse(saved) : DEFAULT_SHOPPING;
    } catch {
      return DEFAULT_SHOPPING;
    }
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1 unit');
  const [newItemCategory, setNewItemCategory] = useState('Produce');
  const [filter, setFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('ffds_shopping_checklist', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save shopping list to localStorage', e);
    }
  }, [items]);

  const toggleItem = (id) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const removeItem = (id, e) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    const newItem = {
      id: Date.now().toString(),
      name,
      qty: newItemQty.trim() || '1 unit',
      category: newItemCategory,
      checked: false,
      emoji: getCategoryEmoji(name, newItemCategory),
      source: 'manual',
    };
    setItems((prev) => [newItem, ...prev]);
    setNewItemName('');
    setNewItemQty('1 unit');
  };

  // Auto-Sync from low stock & expiring fridge items
  const autoSyncRestockItems = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      let invItems = [];
      try {
        const { data } = await api.get('/inventory');
        invItems = Array.isArray(data) ? data : [];
      } catch {
        try {
          const { data } = await api.get('/manager/inventory');
          invItems = Array.isArray(data) ? data : [];
        } catch {}
      }

      const now = new Date();
      const needsRestock = invItems.filter((i) => {
        if (i.status === 'consumed' || i.status === 'wasted') return true;
        if (i.expiryDate) {
          const exp = new Date(i.expiryDate);
          const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
          return daysLeft <= 3;
        }
        return false;
      });

      let addedCount = 0;
      setItems((prev) => {
        const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
        const newEntries = [];

        needsRestock.forEach((item) => {
          if (!existingNames.has(item.foodName.toLowerCase())) {
            addedCount++;
            newEntries.push({
              id: 'auto-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              name: item.foodName,
              qty: `${item.quantity || 1} ${item.unit || 'pcs'}`,
              category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Produce',
              checked: false,
              emoji: getCategoryEmoji(item.foodName, item.category),
              source: 'auto-expiry',
            });
          }
        });

        return [...newEntries, ...prev];
      });

      setSyncMsg(addedCount > 0 ? `✨ Added ${addedCount} low-stock/expiring item(s) to checklist!` : '✓ Your fridge items are well-stocked! No urgent restocks needed.');
      setTimeout(() => setSyncMsg(''), 4000);
    } catch {
      setSyncMsg('⚠️ Unable to sync fridge inventory.');
      setTimeout(() => setSyncMsg(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  // Transfer checked items to active fridge inventory
  const handleTransferToFridge = async () => {
    const checkedItems = items.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    setTransferring(true);
    let count = 0;
    try {
      for (const item of checkedItems) {
        try {
          await api.post('/inventory', {
            foodName: item.name,
            category: item.category.toLowerCase().includes('dairy') ? 'dairy' : item.category.toLowerCase().includes('bakery') ? 'bakery' : 'fruit',
            quantity: 1,
            unit: item.qty || 'pcs',
            location: 'fridge',
            purchaseDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          });
          count++;
        } catch (e) {
          console.warn('Failed to add item to inventory:', item.name);
        }
      }
      setItems((prev) => prev.filter((i) => !i.checked));
      setSyncMsg(`🎉 Transferred ${count} checked item(s) to your Fridge Inventory!`);
      setTimeout(() => setSyncMsg(''), 4000);
    } finally {
      setTransferring(false);
    }
  };

  const clearCompleted = () => {
    setItems((prev) => prev.filter((i) => !i.checked));
  };

  const filteredItems = items.filter((i) => {
    if (filter === 'active') return !i.checked;
    if (filter === 'completed') return i.checked;
    return true;
  });

  const checkedCount = items.filter((i) => i.checked).length;
  const activeCount = items.length - checkedCount;
  const progressPct = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📋</span> Smart Shopping Checklist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Auto-sync low-stock & expiring items from your fridge, track purchases & restock inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={autoSyncRestockItems}
            disabled={syncing}
            className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {syncing ? <><span className="spinner" /> Syncing Inventory...</> : <><span>⚡</span> Auto-Restock from Fridge</>}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="glass border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs px-4 py-3 rounded-xl animate-fade-up flex items-center justify-between">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Progress Bar & Summary */}
      <div className="glass p-5 rounded-2xl space-y-3 border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-semibold">Shopping Completion</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold font-mono">
              {checkedCount}/{items.length} Completed
            </span>
          </div>
          <span className="font-bold text-white font-mono text-sm">{progressPct}%</span>
        </div>

        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 via-emerald-400 to-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'all', label: `All (${items.length})` },
              { key: 'active', label: `To Buy (${activeCount})` },
              { key: 'completed', label: `Completed (${checkedCount})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter === t.key
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {checkedCount > 0 && (
              <>
                <button
                  onClick={handleTransferToFridge}
                  disabled={transferring}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {transferring ? <span className="spinner" /> : '🧊 Move Checked to Fridge'}
                </button>

                <button
                  onClick={clearCompleted}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/10 text-xs font-semibold transition-all cursor-pointer"
                >
                  Clear Completed
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Item Form */}
      <form onSubmit={handleAddItem} className="glass p-3 rounded-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/10">
        <input
          type="text"
          placeholder="Add item (e.g. Olive Oil, Tomatoes, Milk)..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="input-dark flex-1 px-3.5 py-2.5 text-xs rounded-xl w-full"
          required
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Qty (e.g. 1 kg)"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            className="input-dark w-28 px-3 py-2.5 text-xs rounded-xl"
          />

          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="input-dark px-3 py-2.5 text-xs rounded-xl cursor-pointer"
          >
            <option value="Produce">Produce 🍎</option>
            <option value="Dairy">Dairy 🥛</option>
            <option value="Bakery">Bakery 🍞</option>
            <option value="Meat">Meat 🥩</option>
            <option value="Pantry">Pantry 📦</option>
          </select>

          <button type="submit" className="btn-glow px-5 py-2.5 rounded-xl text-white text-xs font-semibold shrink-0 cursor-pointer">
            + Add Item
          </button>
        </div>
      </form>

      {/* Items list */}
      <div className="glass rounded-2xl p-4 space-y-2 border border-white/10">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <span className="text-4xl">🛒</span>
            <p className="text-white font-bold text-sm">No items in this view</p>
            <p className="text-xs text-slate-400">
              Add new items above or click "Auto-Restock from Fridge" to import low stock produce.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-center justify-between gap-4 p-3.5 rounded-xl transition-all cursor-pointer ${
                item.checked
                  ? 'bg-white/[0.02] border border-white/5 opacity-60'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    item.checked ? 'bg-brand-500 border-brand-500' : 'border-slate-600'
                  }`}
                >
                  {item.checked && <span className="text-slate-950 font-bold text-xs">✓</span>}
                </div>

                <span className="text-2xl shrink-0">{item.emoji}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm truncate ${item.checked ? 'line-through text-slate-500' : 'text-white'}`}>
                      {item.name}
                    </p>
                    {item.source === 'auto-expiry' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold shrink-0">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.qty} · {item.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => removeItem(item.id, e)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONSUMER SETTINGS
// ────────────────────────────────────────────────────────────
export function ConsumerSettings() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language: 'en',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        language: user.language || 'en',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const { data } = await api.put('/auth/profile', formData);
      login(data.token, data.user);
      setSuccess('Profile details updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const languages = [
    { code: 'en', name: '🇬🇧 English' },
    { code: 'si', name: '🇱🇰 Sinhala (සිංහල)' },
    { code: 'ta', name: '🇱🇰 Tamil (தமிழ்)' },
    { code: 'ar', name: '🇸🇦 Arabic (العربية)' },
    { code: 'fr', name: '🇫🇷 French (Français)' },
    { code: 'ja', name: '🇯🇵 Japanese (日本語)' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>⚙️</span> Account & Preferences
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure your personal profile and language settings.</p>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-slate-950 text-2xl font-black shadow-glow">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CU'}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg capitalize">{user?.name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="mt-2 inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {user?.role || 'consumer'} user
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
              ✅ {success}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Language Preference</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2"
            >
              {submitting ? <span className="spinner" /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

