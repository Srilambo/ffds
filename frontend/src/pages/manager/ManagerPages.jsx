import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosClient';
import ScanResult from '../../components/ScanResult';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['fruit', 'vegetable', 'dairy', 'bakery', 'other', 'meat', 'bread'];
const STATUSES = ['active', 'consumed', 'wasted'];

const STATUS_CONFIG = {
  active:   { cls: 'bg-brand-500/15 text-brand-400 border-brand-500/30', label: 'Active' },
  consumed: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'Consumed' },
  wasted:   { cls: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Wasted' },
};

const CAT_ICONS = { fruit: '🍎', vegetable: '🥦', dairy: '🥛', bakery: '🍞', other: '📦', meat: '🥩', bread: '🍞' };

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className={`glass bg-gradient-to-br ${color} border p-5 rounded-2xl flex flex-col justify-between space-y-2 card-hover transition-all`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>{icon}</span> {title}
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        {sub && <p className="text-[10px] opacity-70 mt-0.5 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

// ============================================
// MANAGER INVENTORY
// ============================================
export function ManagerInventory() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  return (
    <div className="space-y-6 fade-up">
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

      {/* Create Item Form Modal / Drawer */}
      {showForm && (
        <div className="glass p-6 rounded-2xl border border-white/10 space-y-4 fade-up">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <span>📦</span> Add New Business Inventory Record
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              value={form.foodName}
              onChange={(e) => setForm({ ...form, foodName: e.target.value })}
              className="input-dark px-3.5 py-2.5 text-xs rounded-xl"
              placeholder="Food item name"
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-dark px-3.5 py-2.5 text-xs rounded-xl"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
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
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="input-dark px-3.5 py-2.5 text-xs rounded-xl"
            >
              <option value="warehouse">Warehouse 🏬</option>
              <option value="fridge">Cold Room / Fridge 🧊</option>
              <option value="pantry">Store Room 🗄️</option>
            </select>
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

// ============================================
// MANAGER SCAN
// ============================================
export function ManagerScan() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [invForm, setInvForm] = useState({
    foodName: '',
    category: 'fruit',
    quantity: 1,
    unit: 'pcs',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    location: 'warehouse',
  });

  const applyFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setScan(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setScan(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScan(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Scan analysis failed');
      setScan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToInventory = (scanData) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    setInvForm({
      foodName: scanData.foodType,
      category: 'fruit',
      quantity: 1,
      unit: 'pcs',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      location: 'warehouse',
    });
    setShowInventoryForm(true);
  };

  const submitInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/manager/inventory', {
        ...invForm,
        linkedScanId: scan?._id,
        purchaseDate: new Date(invForm.purchaseDate).toISOString(),
        expiryDate: new Date(invForm.expiryDate).toISOString(),
      });
      setShowInventoryForm(false);
    } catch {
      setError('Failed to add to business inventory');
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>🔍</span> Manager Batch Audit Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform high-speed AI audits on received shipments and add results directly to business stock.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-6 space-y-5 rounded-2xl border border-white/10">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              applyFile(e.dataTransfer.files[0]);
            }}
            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              preview ? 'py-6' : 'py-12'
            } border-white/15 hover:border-brand-500/50 hover:bg-white/5`}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="max-h-56 max-w-full rounded-xl shadow-lg border border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setScan(null);
                  }}
                  className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                  🍎
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Drop sample image here</p>
                  <p className="text-slate-400 text-xs mt-0.5">Supports PNG, JPG, WEBP — Max 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer btn-glow text-white text-xs font-semibold">
              📷 Capture Photo
              <input type="file" accept="image/*" capture="environment" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            </label>
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border border-brand-500/40 text-brand-300 text-xs font-semibold hover:bg-brand-500/10 transition-all">
              📁 Choose File
              <input type="file" accept="image/*" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            </label>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">⚠️ {error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            {loading ? <><span className="spinner" /> Analyzing Produce...</> : <><span>🔬</span> Run CNN & Gas Telemetry</>}
          </button>
        </div>

        <div>
          {scan ? (
            <ScanResult scan={scan} onAddToInventory={handleAddToInventory} />
          ) : (
            <div className="glass p-8 h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/15 rounded-2xl">
              <div className="text-6xl">🥬</div>
              <div>
                <p className="text-white font-bold text-base">Ready for Batch Scan</p>
                <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                  Upload produce sample photos to instantly classify freshness & log gas sensor metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4 fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-white text-base">Add Scanned Item to Stock</h2>
              <button onClick={() => setShowInventoryForm(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={submitInventory} className="space-y-3">
              <input
                value={invForm.foodName}
                onChange={(e) => setInvForm({ ...invForm, foodName: e.target.value })}
                className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                placeholder="Food name"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={invForm.category}
                  onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                  className="input-dark px-3 py-2 text-xs rounded-xl"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={invForm.quantity}
                  onChange={(e) => setInvForm({ ...invForm, quantity: +e.target.value })}
                  className="input-dark px-3 py-2 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={invForm.expiryDate}
                  onChange={(e) => setInvForm({ ...invForm, expiryDate: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInventoryForm(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-glow py-2 rounded-xl text-white text-xs font-semibold">
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MANAGER SCAN HISTORY
// ============================================
export function ManagerScanHistory() {
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ foodType: '', label: '', startDate: '', endDate: '' });
  const limit = 20;

  const fetchScans = async () => {
    try {
      const res = await api.get('/manager/scans', { params: { page, limit, ...filters } });
      setScans(res.data.scans);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page, filters]);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📜</span> Business Scan Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete records of all audit scans, classification confidence, and sensor readouts.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass p-4 rounded-2xl flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filter by food name..."
          value={filters.foodType}
          onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl flex-1 min-w-[150px]"
        />
        <select
          value={filters.label}
          onChange={(e) => setFilters({ ...filters, label: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl"
        >
          <option value="">All Freshness Ratings</option>
          <option value="Fresh">Fresh</option>
          <option value="Borderline">Borderline</option>
          <option value="Spoiled">Spoiled</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl"
        />
        {(filters.foodType || filters.label || filters.startDate || filters.endDate) && (
          <button
            onClick={() => setFilters({ foodType: '', label: '', startDate: '', endDate: '' })}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/5">
                <th className="text-left py-3.5 px-4">Produce</th>
                <th className="text-left py-3.5 px-4">Status</th>
                <th className="text-left py-3.5 px-4 hidden sm:table-cell font-mono">Confidence</th>
                <th className="text-left py-3.5 px-4 hidden md:table-cell font-mono">Gas Sensors (NH₃ / H₂S / Ethylene)</th>
                <th className="text-left py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s._id} className="border-b border-white/5 text-slate-300 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white capitalize">{s.foodType}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        s.label === 'Fresh'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : s.label === 'Borderline'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell font-mono font-bold text-white">{s.confidence}%</td>
                  <td className="py-3 px-4 hidden md:table-cell text-[11px] font-mono text-slate-400">
                    NH₃:<span className="text-white font-bold">{s.gasReadings?.nh3}</span> ppm · H₂S:
                    <span className="text-white font-bold">{s.gasReadings?.h2s}</span> ppm · Ethylene:
                    <span className="text-white font-bold">{s.gasReadings?.ethylene}</span> ppm
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!scans.length && !loading && (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <span className="text-5xl">🔍</span>
            <p className="text-white font-bold">No scan records matching your filter</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// MANAGER WASTE ANALYTICS
// ============================================
export function ManagerWasteAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/manager/waste-analytics', { params: { period } });
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [period]);

  if (loading) {
    return (
      <div className="glass p-8 rounded-2xl animate-pulse space-y-4">
        <div className="h-8 w-1/3 bg-white/10 rounded" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📉</span> Waste Financial Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Weekly and monthly financial loss trends with downloadable compliance PDF report.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
          {['weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                period === p ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="💰"
          title="Total Waste Cost"
          value={formatCurrency(data?.totalCost || 0)}
          sub="All logged spoilage losses"
          color="from-red-600/20 via-red-700/15 to-red-900/20 border-red-500/30 text-red-300"
        />
        <StatCard
          icon="📦"
          title="Highest Loss Item"
          value={data?.mostWastedItem?.name || 'N/A'}
          sub={`${formatCurrency(data?.mostWastedItem?.cost || 0)} total financial loss`}
          color="from-amber-600/20 via-amber-700/15 to-amber-900/20 border-amber-500/30 text-amber-300"
        />
        <StatCard
          icon="📊"
          title="Analytics Scope"
          value={period.charAt(0).toUpperCase() + period.slice(1)}
          sub={`${data?.labels?.length || 0} period intervals tracked`}
          color="from-blue-600/20 via-blue-700/15 to-blue-900/20 border-blue-500/30 text-blue-300"
        />
      </div>

      {/* Interactive Recharts Chart */}
      <div className="glass p-6 rounded-2xl space-y-4 border border-white/10">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📈</span> Financial Loss Trend ({period.charAt(0).toUpperCase() + period.slice(1)})
        </h3>
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.labels?.map((l, i) => ({ label: l, value: data.values[i] })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" stroke="#ffffff60" fontSize={11} tickMargin={10} />
              <YAxis stroke="#ffffff60" fontSize={11} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Waste Cost']}
                contentStyle={{ backgroundColor: '#161b27', border: '1px solid #253044', borderRadius: '12px' }}
              />
              <Bar dataKey="value" fill="url(#wasteGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.15} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PDF Export Banner */}
      <div className="glass p-6 rounded-2xl text-center border border-brand-500/30 bg-brand-500/10 space-y-3">
        <p className="text-white font-bold text-base">Download Enterprise Waste Audit Report</p>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Generate an official compliance-ready PDF report detailing all financial loss records for executive presentation.
        </p>
        <a
          href="/api/manager/waste-report/pdf"
          className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-xs"
        >
          📄 Export PDF Report
        </a>
      </div>
    </div>
  );
}

// ============================================
// MANAGER CHATBOT
// ============================================
export function ManagerChatbot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Business Advisor. Ask me about reducing spoilage loss, optimizing warehouse rotation, or supplier quality controls.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);
    setMessages((p) => [...p, { role: 'user', text: q }]);
    try {
      const { data } = await api.post('/manager/chat', { question: q, language: user?.language || 'en' });
      setMessages((p) => [...p, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', text: 'Error: Could not establish connection with AI advisor.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'How to minimize fruit spoilage?',
    'Optimal cold storage temperatures',
    'High spoilage risk items in stock',
  ];

  return (
    <div className="space-y-4 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>🤖</span> AI Business Advisor
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gemini-powered executive AI consultant for inventory optimization and waste prevention.
        </p>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden h-[620px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-lg">
              🤖
            </div>
            <div>
              <span className="text-xs font-bold text-white">Gemini Business Consultant</span>
              <p className="text-[10px] text-slate-400">Trained on food preservation & logistics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Online</span>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/40">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs mr-2 shrink-0">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-md font-medium'
                    : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/10'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-xl bg-slate-700 flex items-center justify-center text-xs ml-2 shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs">
                🤖
              </div>
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center gap-2 overflow-x-auto">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-[10px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-brand-500/20 border border-white/10 text-slate-300 hover:text-brand-300 transition-all shrink-0 font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 p-3 bg-white/5 border-t border-white/10"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI advisor about inventory strategies..."
            className="input-dark flex-1 px-3.5 py-2.5 text-xs rounded-xl"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5"
          >
            {loading ? <span className="spinner w-4 h-4" /> : 'Send ↑'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// BULK SCAN - Manager multi-image stock audit
// ============================================
export function BatchScan() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [batchName, setBatchName] = useState('');
  const [foodType, setFoodType] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [currency, setCurrency] = useState('USD');

  const resolveImageUrl = (url, index) => {
    if (!url) return previews[index] || '';
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') 
      : 'http://localhost:5000';
    return `${apiBase}${url.startsWith('/') ? url : '/' + url}`;
  };

  const handleFiles = (selectedFiles) => {
    const arr = Array.from(selectedFiles).slice(0, 50);
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
    setError('');
    setResult(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const finalBatchName = batchName.trim() || `Shipment #${Math.floor(100 + Math.random() * 900)}`;
    const finalFoodType = foodType.trim() || 'Produce Stock';

    setUploading(true);
    setProgress(0);
    setError('');

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('batchName', finalBatchName);
    fd.append('foodType', finalFoodType);
    if (estimatedValue) fd.append('estimatedValue', estimatedValue);
    fd.append('currency', currency);

    try {
      const { data } = await api.post('/farmer/batch-scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 100))),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Bulk scan failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Stock Scan</h1>
          <p className="text-slate-500 text-sm mt-1">Upload 1-50 incoming produce images at once for rapid freshness audit.</p>
        </div>
      </div>

      <div className="glass p-4 md:p-6 space-y-5 card-hover animate-fade-up">
        <div className="grid sm:grid-cols-3 gap-4">
          <input
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Stock Batch Name (e.g., Shipment #42)"
            className="input-dark px-3 py-2.5 text-sm"
          />
          <input
            value={foodType}
            onChange={(e) => setFoodType(e.target.value)}
            placeholder="Food type (e.g., Mango, Tomato)"
            className="input-dark px-3 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="Est. total value"
              className="input-dark px-3 py-2.5 text-sm w-40"
            />
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-dark px-3 py-2.5 text-sm w-28">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            previews.length > 0 ? 'py-6' : 'py-10 md:py-14'
          } ${files.length > 0 ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:border-brand-600/50 hover:bg-white/[0.02]'}`}
        >
          {previews.length > 0 ? (
            <div className="w-full">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >✕</button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center">{files.length}/50 images selected</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl md:text-4xl animate-bounce-gentle">📦</div>
              <div>
                <p className="text-white font-semibold text-sm md:text-base">Drop 1-50 stock images here</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP — max 5MB each</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer btn-glow text-white text-sm font-semibold">
            📷 {t('scan.capture', 'Capture')}
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFiles(e.target.files)} className="hidden" multiple />
          </label>
          <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer border border-brand-600/40 text-brand-400 text-sm font-semibold hover:bg-brand-600/10 transition-all">
            📁 {t('scan.upload', 'Upload')}
            <input type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" multiple />
          </label>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-shake">⚠️ {error}</div>}

        <button onClick={handleSubmit} disabled={files.length === 0 || uploading}
          className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
          {uploading ? (
            <>
              <span className="spinner" /> Uploading & Analyzing... {progress}%
              <div className="w-1/2 h-1.5 bg-white/10 rounded-full overflow-hidden ml-4">
                <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>🔬 {t('scan.submit', 'Analyze Bulk Stock')}</>
          )}
        </button>
      </div>

      {result && (
        <div className="animate-fade-up delay-200 space-y-6">
          {/* Audit Summary Header Card */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>📊</span> Bulk Audit Results
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold font-mono">
                    Batch: {result.batch?.batchName || 'Shipment Audit'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Food Type: <span className="text-white font-semibold capitalize">{result.batch?.foodType || 'Produce Stock'}</span> · Scanned at {new Date(result.batch?.createdAt || Date.now()).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                  ID: {result.batch?._id || 'COMPLETED'}
                </span>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Scanned</p>
                <p className="text-3xl font-black text-white">{result.batch?.totalItems || result.scans?.length || 0}</p>
                <p className="text-[10px] text-slate-500 font-mono">Produce samples</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <span>✅</span> Fresh Stock
                </p>
                <p className="text-3xl font-black text-emerald-300">{result.batch?.freshCount || 0}</p>
                <p className="text-[10px] text-emerald-400/80 font-mono">
                  {Math.round(((result.batch?.freshCount || 0) / (result.batch?.totalItems || 1)) * 100)}% of shipment
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <span>⚠️</span> Borderline
                </p>
                <p className="text-3xl font-black text-amber-300">{result.batch?.borderlineCount || 0}</p>
                <p className="text-[10px] text-amber-400/80 font-mono">
                  {Math.round(((result.batch?.borderlineCount || 0) / (result.batch?.totalItems || 1)) * 100)}% sell soon
                </p>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
                <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <span>❌</span> Spoiled Stock
                </p>
                <p className="text-3xl font-black text-red-300">{result.batch?.spoiledCount || 0}</p>
                <p className="text-[10px] text-red-400/80 font-mono">
                  {Math.round(((result.batch?.spoiledCount || 0) / (result.batch?.totalItems || 1)) * 100)}% waste risk
                </p>
              </div>
            </div>

            {/* Quality Rating & Financial Value Banner */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-2xl font-black text-brand-300 font-mono">{result.batch?.qualityScore}%</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Grade</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Shipment Quality</p>
                  <p className="text-lg font-bold text-white mt-0.5">
                    {result.batch?.qualityScore >= 80 ? '🌟 Grade-A Fresh Stock (High Market Value)' : result.batch?.qualityScore >= 50 ? '⚠️ Moderate Quality (Recommend Early Sale)' : '❌ High Degradation Risk'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:border-l sm:border-white/10 sm:pl-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Estimated Market Value</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono text-right">
                    {formatCurrency(result.batch?.estimatedValue || 0)} <span className="text-xs font-normal text-slate-400">{result.batch?.currency || 'USD'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Item Inspection Grid */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🔍</span> Per-Item Inspection ({result.scans?.length || 0})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Individual CNN classification and confidence rating for each produce sample.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(result.scans || []).map((scan, idx) => {
                const labelCls = scan.label === 'Fresh'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : scan.label === 'Borderline'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-red-500/20 border-red-500/40 text-red-300';
                
                const labelIcon = scan.label === 'Fresh' ? '✅' : scan.label === 'Borderline' ? '⚠️' : '❌';

                return (
                  <div key={scan.scanId || idx} className="glass border border-white/10 rounded-2xl overflow-hidden card-hover flex flex-col justify-between">
                    <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
                      <img
                        src={resolveImageUrl(scan.imageUrl, idx)}
                        alt={scan.foodType}
                        onError={(e) => {
                          if (previews[idx]) e.target.src = previews[idx];
                        }}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-md flex items-center gap-1">
                        <span className="text-xs">{labelIcon}</span>
                        <span className="text-[10px] font-mono font-bold text-white">{scan.confidence}%</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-xs capitalize truncate">{scan.foodType}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${labelCls}`}>
                          {scan.label}
                        </span>
                      </div>
                      
                      {scan.gasReadings && (
                        <div className="text-[9px] text-slate-400 font-mono bg-white/5 px-2 py-1 rounded-lg flex justify-between">
                          <span>NH₃: {scan.gasReadings.nh3}</span>
                          <span>H₂S: {scan.gasReadings.h2s}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================
// MANAGER SHOP PROFILE
// ============================================
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useSocket } from '../../context/SocketContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapPinPicker({ position, onPick }) {
  useMapEvents({
    click(e) { onPick([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? <Marker position={position} /> : null;
}

export function ManagerShopProfile() {
  const { user } = useAuth();
  const [form, setForm] = React.useState({
    shopName: '', address: '', phone: '', category: 'grocery', hours: '8am – 9pm', isOpen: true,
  });
  const [pinPos,   setPinPos]   = React.useState(null); // [lat, lng]
  const [saving,   setSaving]   = React.useState(false);
  const [success,  setSuccess]  = React.useState('');
  const [error,    setError]    = React.useState('');
  const [shop,     setShop]     = React.useState(null);
  const [loading,  setLoading]  = React.useState(true);
  const [stockInput, setStockInput] = React.useState('');
  const [stockList,  setStockList]  = React.useState([]);

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/shops/my');
        setShop(data);
        setForm({
          shopName: data.shopName || '',
          address:  data.address  || '',
          phone:    data.phone    || '',
          category: data.category || 'grocery',
          hours:    data.hours    || '8am – 9pm',
          isOpen:   data.isOpen   !== false,
        });
        if (data.location?.coordinates) {
          setPinPos([data.location.coordinates[1], data.location.coordinates[0]]);
        }
        setStockList(data.stockSummary || []);
      } catch {
        // no shop yet, start fresh
      } finally { setLoading(false); }
    })();
  }, []);

  const addStock = () => {
    if (!stockInput.trim()) return;
    setStockList((p) => [...p, { name: stockInput.trim(), inStock: true, price: 0 }]);
    setStockInput('');
  };
  const removeStock = (i) => setStockList((p) => p.filter((_, idx) => idx !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        location: { type: 'Point', coordinates: pinPos ? [pinPos[1], pinPos[0]] : [0, 0] },
        stockSummary: stockList,
      };
      const { data } = await api.post('/shops', payload);
      setShop(data.shop);
      setSuccess('Shop profile saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save shop');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">Loading shop profile...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            🏪 Shop Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">Set up your shop location, hours, and stock for consumers to find you.</p>
        </div>
        {shop?.isVerified && (
          <span className="text-[10px] px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            ✓ Verified Shop
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error   && <div className="glass border border-red-500/20 bg-red-500/5 text-red-400 text-sm px-4 py-3 rounded-xl">⚠️ {error}</div>}
        {success && <div className="glass border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm px-4 py-3 rounded-xl">✅ {success}</div>}

        <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase">Basic Info</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Shop Name *</label>
              <input type="text" value={form.shopName} onChange={e => setForm({...form, shopName: e.target.value})} required className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="e.g. Fresh Garden Market" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="+94 77 123 4567" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase">Address *</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="123 Main Street, Colombo 3" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl">
                {['grocery','produce','supermarket','convenience','organic','other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Opening Hours</label>
              <input type="text" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl" placeholder="8am – 9pm" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase">Status</label>
              <button type="button" onClick={() => setForm({...form, isOpen: !form.isOpen})} className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all ${form.isOpen ? 'bg-brand-500/20 text-brand-300 border-brand-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {form.isOpen ? '🟢 Open' : '🔴 Closed'}
              </button>
            </div>
          </div>
        </div>

        {/* Map location picker */}
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase">Shop Location</p>
          <p className="text-xs text-slate-400">Click on the map to drop your shop pin.</p>
          {pinPos && (
            <p className="text-[10px] font-mono text-brand-300">📍 {pinPos[0].toFixed(5)}, {pinPos[1].toFixed(5)}</p>
          )}
          <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 320 }}>
            <MapContainer
              center={pinPos || [6.9271, 79.8612]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapPinPicker position={pinPos} onPick={setPinPos} />
            </MapContainer>
          </div>
        </div>

        {/* Stock summary */}
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase">Stock Items (shown to consumers)</p>
          <div className="flex gap-2">
            <input type="text" value={stockInput} onChange={e => setStockInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStock())} placeholder="e.g. Red Apples, Organic Spinach..." className="input-dark flex-1 px-3 py-2 text-xs rounded-xl" />
            <button type="button" onClick={addStock} className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold">+ Add</button>
          </div>
          {stockList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stockList.map((s, i) => (
                <div key={i} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                  <span className="text-[10px] text-slate-300">{s.name}</span>
                  <button type="button" onClick={() => removeStock(i)} className="text-slate-500 hover:text-red-400 text-[10px] leading-none">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
          {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Shop Profile'}
        </button>
      </form>
    </div>
  );
}


// ============================================
// MANAGER ORDERS QUEUE
// ============================================
const ORDER_STATUS_META = {
  pending:          { label: 'Pending',          cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  confirmed:        { label: 'Confirmed',         cls: 'bg-brand-500/20 text-brand-300 border-brand-500/30' },
  preparing:        { label: 'Preparing',         cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  out_for_delivery: { label: 'Out for Delivery',  cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  delivered:        { label: 'Delivered',          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rejected:         { label: 'Rejected',           cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export function ManagerOrders() {
  const { socket } = useSocket();
  const [orders,     setOrders]     = React.useState([]);
  const [shopId,     setShopId]     = React.useState(null);
  const [loading,    setLoading]    = React.useState(true);
  const [newOrderId, setNewOrderId] = React.useState(null); // flash highlight
  const [filter,     setFilter]     = React.useState('all');
  const [rejectId,   setRejectId]   = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');

  // Load shop + orders
  React.useEffect(() => {
    (async () => {
      try {
        const shopRes = await api.get('/shops/my');
        setShopId(shopRes.data._id);
        const ordRes = await api.get('/orders/manager');
        setOrders(ordRes.data);
      } catch {
        setOrders([]);
      } finally { setLoading(false); }
    })();
  }, []);

  // Socket.io: join shop room and listen for new orders
  React.useEffect(() => {
    if (!socket || !shopId) return;
    socket.emit('join_shop', shopId);
    socket.on('new_order', (order) => {
      setOrders((prev) => [order, ...prev]);
      setNewOrderId(order.orderId);
      setTimeout(() => setNewOrderId(null), 3000);
    });
    return () => {
      socket.off('new_order');
      socket.emit('leave_shop', shopId);
    };
  }, [socket, shopId]);

  const updateStatus = async (orderId, status, extra = {}) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status, ...extra });
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.orderId === orderId) ? { ...o, status } : o));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await updateStatus(rejectId, 'rejected', { rejectionReason: rejectReason });
    setRejectId(null); setRejectReason('');
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const counts = { pending: 0, confirmed: 0, preparing: 0, out_for_delivery: 0, delivered: 0, rejected: 0 };
  orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">Loading orders...</div>;

  if (!shopId) {
    return (
      <div className="glass rounded-2xl p-12 text-center border border-white/10 space-y-3 fade-up">
        <span className="text-5xl">🏪</span>
        <h2 className="text-xl font-extrabold text-white">No Shop Profile Yet</h2>
        <p className="text-slate-400 text-sm">Set up your shop profile first so consumers can find and order from you.</p>
        <a href="/manager/shop-profile" className="inline-block btn-glow px-6 py-2.5 rounded-xl text-white text-sm font-semibold mt-2">Set Up Shop →</a>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            📦 Orders Queue
            {counts.pending > 0 && (
              <span className="h-6 w-6 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                {counts.pending}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time incoming orders. Accept, prepare, and fulfil.</p>
        </div>
        <button onClick={async () => { const r = await api.get('/orders/manager'); setOrders(r.data); }} className="text-xs text-brand-400 hover:text-brand-300 font-semibold">↻ Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`glass p-2.5 rounded-xl border text-center transition-all ${filter === key ? meta.cls : 'border-white/10 hover:bg-white/5'}`}
          >
            <p className="text-lg font-black text-white">{counts[key]}</p>
            <p className="text-[9px] text-slate-400 uppercase font-semibold leading-tight mt-0.5">{meta.label}</p>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10 space-y-2">
            <span className="text-4xl">📭</span>
            <p className="text-white font-bold text-sm">{filter === 'all' ? 'No orders yet' : `No ${filter} orders`}</p>
            <p className="text-xs text-slate-400">New orders will appear here in real-time.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending;
            const isNew = order._id === newOrderId || order.orderId === newOrderId;
            const orderId = order._id || order.orderId;
            return (
              <div
                key={orderId}
                className={`glass rounded-2xl p-5 border transition-all ${isNew ? 'border-brand-500/50 bg-brand-500/5 scale-[1.01]' : 'border-white/10'} space-y-3`}
                style={{ transition: 'all 0.4s ease' }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-white text-sm">
                      {isNew && <span className="text-brand-400 mr-2 animate-pulse">🆕 NEW</span>}
                      {order.consumerId?.name || order.consumerName || 'Customer'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${meta.cls}`}>{meta.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {order.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {(order.items || []).map((item, i) => (
                    <span key={i} className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-slate-300">
                      {item.emoji || '🛒'} {item.name} × {item.qty}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                {order.status === 'pending' && (
                  <div className="flex gap-2 pt-1 border-t border-white/5 flex-wrap">
                    <button onClick={() => updateStatus(orderId, 'confirmed')} className="px-4 py-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold hover:bg-brand-500/30 transition-all">
                      ✅ Accept
                    </button>
                    <button onClick={() => setRejectId(orderId)} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
                      ❌ Reject
                    </button>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    <button onClick={() => updateStatus(orderId, 'preparing')} className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/30 transition-all">
                      👨‍🍳 Start Preparing
                    </button>
                  </div>
                )}
                {order.status === 'preparing' && (
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    <button onClick={() => updateStatus(orderId, 'out_for_delivery')} className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition-all">
                      🚴 Out for Delivery
                    </button>
                  </div>
                )}
                {order.status === 'out_for_delivery' && (
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    <button onClick={() => updateStatus(orderId, 'delivered')} className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-all">
                      🎉 Mark Delivered
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Rejection modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl border border-white/10 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Reject Order</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="input-dark w-full px-3.5 py-3 text-xs rounded-xl resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-all">Confirm Reject</button>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
