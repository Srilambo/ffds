import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosClient';

const CATEGORIES = ['fruit', 'vegetable', 'dairy', 'bakery', 'other', 'meat', 'bread'];
const STATUSES = ['active', 'consumed', 'wasted'];

const PRODUCE_PRESETS = [
  // Fruits
  { name: 'Apple', category: 'fruit', icon: '🍎', days: 14 },
  { name: 'Mango', category: 'fruit', icon: '🥭', days: 7 },
  { name: 'Banana', category: 'fruit', icon: '🍌', days: 5 },
  { name: 'Orange', category: 'fruit', icon: '🍊', days: 10 },
  { name: 'Strawberry', category: 'fruit', icon: '🍓', days: 4 },
  { name: 'Grapes', category: 'fruit', icon: '🍇', days: 7 },
  { name: 'Pineapple', category: 'fruit', icon: '🍍', days: 7 },
  { name: 'Avocado', category: 'fruit', icon: '🥑', days: 5 },
  { name: 'Watermelon', category: 'fruit', icon: '🍉', days: 7 },
  { name: 'Lemon', category: 'fruit', icon: '🍋', days: 14 },
  { name: 'Papaya', category: 'fruit', icon: '🍈', days: 6 },
  { name: 'Peach', category: 'fruit', icon: '🍑', days: 5 },

  // Vegetables
  { name: 'Tomato', category: 'vegetable', icon: '🍅', days: 7 },
  { name: 'Carrot', category: 'vegetable', icon: '🥕', days: 14 },
  { name: 'Potato', category: 'vegetable', icon: '🥔', days: 21 },
  { name: 'Broccoli', category: 'vegetable', icon: '🥦', days: 5 },
  { name: 'Onion', category: 'vegetable', icon: '🧅', days: 21 },
  { name: 'Cucumber', category: 'vegetable', icon: '🥒', days: 7 },
  { name: 'Spinach', category: 'vegetable', icon: '🥬', days: 5 },
  { name: 'Garlic', category: 'vegetable', icon: '🧄', days: 30 },
  { name: 'Bell Pepper', category: 'vegetable', icon: '🫑', days: 7 },
  { name: 'Corn', category: 'vegetable', icon: '🌽', days: 5 },
  { name: 'Eggplant', category: 'vegetable', icon: '🍆', days: 6 },
  { name: 'Mushroom', category: 'vegetable', icon: '🍄', days: 5 },
];

const STATUS_CONFIG = {
  active:   { cls: 'bg-brand-500/15 text-brand-400 border-brand-500/30', label: 'Active' },
  consumed: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'Consumed' },
  wasted:   { cls: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Wasted' },
};

const CAT_ICONS = { fruit: '🍎', vegetable: '🥦', dairy: '🥛', bakery: '🍞', other: '📦', meat: '🥩', bread: '🍞' };

export function ManagerInventory() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [presetFilter, setPresetFilter] = useState('all');
  const [form, setForm] = useState({
    foodName: '',
    category: 'fruit',
    quantity: 1,
    unit: 'pcs',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    location: 'warehouse',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateAutoExpiry = (purchaseDateStr, shelfDays) => {
    const base = purchaseDateStr ? new Date(purchaseDateStr) : new Date();
    base.setDate(base.getDate() + shelfDays);
    return base.toISOString().split('T')[0];
  };

  const handleSelectPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      foodName: preset.name,
      category: preset.category,
      expiryDate: calculateAutoExpiry(prev.purchaseDate, preset.days),
    }));
  };

  const load = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      const res = await api.get('/manager/inventory', { params });
      setItems(res.data);
    } catch {
      setError(t('inventory.error', 'Failed to load inventory data'));
    }
  };

  useEffect(() => {
    load();
  }, [category, status]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/manager/inventory', {
        ...form,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        expiryDate: new Date(form.expiryDate).toISOString(),
      });
      setShowForm(false);
      setForm({
        foodName: '',
        category: 'fruit',
        quantity: 1,
        unit: 'pcs',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        location: 'warehouse',
      });
      load();
    } catch {
      setError(t('inventory.error', 'Failed to save item'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, data) => {
    await api.patch(`/manager/inventory/${id}`, data);
    load();
  };

  const handleDelete = async (id) => {
    await api.delete(`/manager/inventory/${id}`);
    load();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/manager/inventory/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`${res.data.inserted} items inserted successfully, ${res.data.skipped} skipped.`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Import failed');
    }
    e.target.value = '';
  };

  const filteredItems = items.filter((item) =>
    item.foodName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = items.filter((i) => i.status === 'active').length;
  const consumedCount = items.filter((i) => i.status === 'consumed').length;
  const wastedCount = items.filter((i) => i.status === 'wasted').length;

  const filteredPresets = PRODUCE_PRESETS.filter(p => {
    if (presetFilter === 'fruit') return p.category === 'fruit';
    if (presetFilter === 'vegetable') return p.category === 'vegetable';
    return true;
  });

  return (
    <div className="space-y-6 fade-up">
      {/* HTML Datalist for Food Name Autocomplete */}
      <datalist id="fresh-produce-datalist">
        {PRODUCE_PRESETS.map((p) => (
          <option key={p.name} value={p.name}>
            {p.icon} {p.name} ({p.category})
          </option>
        ))}
      </datalist>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🍎</span> Stock Control & Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise business inventory, bulk CSV imports, & real-time expiry alerts.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2"
          >
            {showForm ? '✕ Cancel' : '+ Add New Item'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Items</span>
          <p className="text-2xl font-black text-white mt-1">{items.length}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-brand-400">Active Stock</span>
          <p className="text-2xl font-black text-brand-400 mt-1">{activeCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-slate-500/20 bg-slate-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Consumed</span>
          <p className="text-2xl font-black text-slate-300 mt-1">{consumedCount}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-red-400">Wasted</span>
          <p className="text-2xl font-black text-red-400 mt-1">{wastedCount}</p>
        </div>
      </div>

      {/* Bulk CSV Import Banner */}
      <div className="glass p-4 border border-amber-500/20 bg-amber-500/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
            📥
          </div>
          <div>
            <p className="text-xs font-bold text-amber-300">Bulk Stock CSV Import</p>
            <p className="text-[11px] text-slate-400 font-mono">
              Columns: foodName, category, quantity, unit, purchaseDate, expiryDate, location
            </p>
          </div>
        </div>
        <div>
          <input type="file" accept=".csv" onChange={handleImport} className="hidden" id="csv-import-file" />
          <label
            htmlFor="csv-import-file"
            className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer inline-block"
          >
            Select CSV File
          </label>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-dark px-3 py-2 text-xs rounded-xl"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input-dark px-3 py-2 text-xs rounded-xl"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {(category || status) && (
            <button
              onClick={() => {
                setCategory('');
                setStatus('');
              }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              ✕ Clear
            </button>
          )}
        </div>

        <div className="w-full md:w-64 relative">
          <input
            type="text"
            placeholder="Search stock items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark w-full px-3.5 py-2 text-xs rounded-xl pl-9"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Create Item Form Modal */}
      {showForm && (
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-5 fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <span>📦</span> Add New Business Inventory Record
            </h2>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              ⚡ Quick Select Fruits & Vegetables Available
            </span>
          </div>

          {/* Quick Select Fresh Produce Presets Selector */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>🥗</span> Quick Select Fresh Produce (Auto-fills Category & Shelf Life Expiry):
              </span>
              <div className="flex gap-1">
                {['all', 'fruit', 'vegetable'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPresetFilter(type)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all capitalize ${
                      presetFilter === type
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white bg-white/5'
                    }`}
                  >
                    {type === 'all' ? 'All Fresh' : type === 'fruit' ? 'Fruits 🍎' : 'Vegetables 🥦'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 scrollbar-thin">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
                    form.foodName.toLowerCase() === preset.name.toLowerCase()
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold scale-105 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={`Click to select ${preset.name} (+${preset.days} days freshness)`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">+{preset.days}d</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Food Item Name</label>
              <input
                value={form.foodName}
                onChange={(e) => setForm({ ...form, foodName: e.target.value })}
                className="input-dark px-3.5 py-2.5 text-xs rounded-xl w-full"
                placeholder="Food item name (e.g. Mango, Tomato)"
                list="fresh-produce-datalist"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-dark px-3.5 py-2.5 text-xs rounded-xl w-full"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Quantity & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
                  className="input-dark px-3 py-2.5 text-xs rounded-xl w-24"
                />
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="input-dark px-3 py-2.5 text-xs rounded-xl flex-1"
                  placeholder="Unit (pcs, kg)"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="input-dark px-3 py-2.5 text-xs rounded-xl w-full"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="input-dark px-3 py-2.5 text-xs rounded-xl w-full"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Storage Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input-dark px-3.5 py-2.5 text-xs rounded-xl w-full"
              >
                <option value="warehouse">Warehouse 🏬</option>
                <option value="fridge">Cold Room / Fridge 🧊</option>
                <option value="pantry">Store Room 🗄️</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-glow w-full py-3 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <span className="spinner" /> : 'Save Inventory Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/5">
                <th className="text-left py-3.5 px-4">Produce Name</th>
                <th className="text-left py-3.5 px-4 hidden sm:table-cell">Category</th>
                <th className="text-left py-3.5 px-4 hidden md:table-cell">Quantity</th>
                <th className="text-left py-3.5 px-4">Expiry Date</th>
                <th className="text-left py-3.5 px-4">Status</th>
                <th className="text-right py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
                return (
                  <tr key={item._id} className="border-b border-white/5 text-slate-300 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{CAT_ICONS[item.category] || '📦'}</span>
                        <div>
                          <span className="font-bold text-white text-sm capitalize">{item.foodName}</span>
                          <p className="text-[10px] text-slate-400 capitalize">{item.location || 'warehouse'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="capitalize text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell font-mono font-bold text-white">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className={`font-mono font-bold ${days <= 0 ? 'text-red-400' : days <= 2 ? 'text-amber-400' : 'text-slate-200'}`}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                        {days <= 3 && item.status === 'active' && (
                          <span className={`text-[10px] mt-0.5 font-bold ${days <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            {days <= 0 ? '⚠️ Expired' : `⏰ ${days}d left`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdate(item._id, { status: e.target.value })}
                        className={`text-[11px] px-2.5 py-1 rounded-full border font-bold bg-transparent cursor-pointer ${cfg.cls}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-slate-900 text-white">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filteredItems.length && (
          <div className="py-16 flex flex-col items-center gap-3 text-center text-slate-500">
            <span className="text-5xl">🛒</span>
            <p className="text-white font-bold">No inventory items</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Add your first produce item or upload a bulk CSV spreadsheet to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default ManagerInventory;
