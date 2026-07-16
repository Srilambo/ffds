import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';
import ScanResult from '../../components/ScanResult';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CATEGORIES = ['fruit', 'vegetable', 'dairy', 'bakery', 'other', 'meat', 'bread'];
const STATUSES = ['active', 'consumed', 'wasted'];

// ============================================
// SHARED HELPERS (moved to top for hoisting)
// ============================================
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
    <div className={`glass bg-gradient-to-br ${color} border p-5 rounded-2xl flex flex-col gap-2`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70">
        <span>{icon}</span> {title}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <span className="text-[10px] opacity-60">{sub}</span>}
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    foodName: '', category: 'fruit', quantity: 1,
    unit: 'pcs', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', location: 'warehouse',
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
    } catch { setError(t('inventory.error')); }
  };

  useEffect(() => { load(); }, [category, status]);

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
      setForm({ foodName: '', category: 'fruit', quantity: 1, unit: 'pcs', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', location: 'warehouse' });
      load();
    } catch { setError(t('inventory.error')); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (id, data) => { await api.patch(`/manager/inventory/${id}`, data); load(); };
  const handleDelete = async (id) => { await api.delete(`/manager/inventory/${id}`); load(); };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/manager/inventory/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert(`${res.data.inserted} items added, ${res.data.skipped} skipped`);
      if (res.data.errors.length) console.log('Errors:', res.data.errors);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Import failed');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.inventory')}</h1>
          <p className="text-slate-500 text-sm mt-1">Manage business stock, bulk import, track expiry</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-glow px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 self-start sm:self-auto">
          {showForm ? '✕ Cancel' : `+ ${t('inventory.addItem')}`}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: items.length, color: 'text-white', bg: 'bg-white/5' },
          { label: 'Active', value: items.filter(i => i.status === 'active').length, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Consumed', value: items.filter(i => i.status === 'consumed').length, color: 'text-slate-400', bg: 'bg-white/3' },
          { label: 'Wasted', value: items.filter(i => i.status === 'wasted').length, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass ${bg} p-4 text-center card-hover`}>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Import CSV */}
      <div className="glass p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-amber-400">📥</span>
          <span className="text-sm font-medium text-amber-300">Bulk Import CSV</span>
          <input type="file" accept=".csv" onChange={handleImport} className="hidden" id="csv-import" />
          <label htmlFor="csv-import" className="btn-glow px-4 py-2 rounded-lg text-white text-sm font-semibold">Select CSV</label>
          <p className="text-xs text-slate-500 ml-auto">Columns: foodName, category, quantity, unit, purchaseDate, expiryDate, location</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-dark px-3 py-2 text-sm rounded-lg">
          <option value="">{t('inventory.filter.category')}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-dark px-3 py-2 text-sm rounded-lg">
          <option value="">{t('inventory.filter.status')}</option>
          {STATUSES.map(s => <option key={s} value={s}>{t(`inventory.status.${s}`)}</option>)}
        </select>
        {(category || status) && (
          <button onClick={() => { setCategory(''); setStatus(''); }}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-all">
            ✕ Clear filters
          </button>
        )}
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">⚠️ {error}</div>}

      {/* Add Form */}
      {showForm && (
        <div className="glass p-6 fade-up">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-brand-600/30 text-brand-400 flex items-center justify-center text-xs">+</span>
            Add New Item
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input value={form.foodName} onChange={(e) => setForm({...form, foodName: e.target.value})}
              className="input-dark px-3 py-2.5 text-sm col-span-2 md:col-span-1" placeholder={t('inventory.foodName')} required />
            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="input-dark px-3 py-2.5 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" min="0.1" step="0.1" value={form.quantity} onChange={(e) => setForm({...form, quantity: +e.target.value})}
                className="input-dark px-3 py-2.5 text-sm w-20" />
              <input value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})}
                className="input-dark px-3 py-2.5 text-sm flex-1" placeholder={t('inventory.unit')} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('inventory.purchaseDate')}</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({...form, purchaseDate: e.target.value})}
                className="input-dark px-3 py-2.5 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('inventory.expiryDate')}</label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({...form, expiryDate: e.target.value})}
                className="input-dark px-3 py-2.5 text-sm w-full" required />
            </div>
            <select value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="input-dark px-3 py-2.5 text-sm">
              <option value="warehouse">Warehouse</option>
              <option value="fridge">Fridge</option>
              <option value="pantry">Pantry</option>
            </select>
            <div className="col-span-2 md:col-span-1 flex items-end">
              <button type="submit" disabled={loading} className="btn-glow w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                {loading ? <><span className="spinner" /> Saving…</> : `${t('inventory.save')} →`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory List */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full dark-table">
            <thead>
              <tr>
                <th className="text-left">Food</th>
                <th className="text-left hidden sm:table-cell">Category</th>
                <th className="text-left hidden md:table-cell">Quantity</th>
                <th className="text-left">Expiry</th>
                <th className="text-left">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
                return (
                  <tr key={item._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{CAT_ICONS[item.category] || '📦'}</span>
                        <span className="font-semibold text-white">{item.foodName}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="capitalize text-slate-400">{t(`inventory.category.${item.category}`)}</span>
                    </td>
                    <td className="hidden md:table-cell text-slate-400 font-mono text-xs">
                      {item.quantity} {item.unit}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className={`text-xs font-mono font-bold ${days <= 0 ? 'text-red-400' : days <= 2 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                        {days <= 3 && item.status === 'active' && (
                          <span className={`text-[10px] mt-0.5 ${days <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                            {days <= 0 ? '⚠️ Expired' : `⏰ ${days}d left`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <select value={item.status} onChange={(e) => handleUpdate(item._id, { status: e.target.value })}
                        className={`text-xs px-2.5 py-1 rounded-full border font-semibold bg-transparent cursor-pointer ${cfg.cls}`}>
                        {['active','consumed','wasted'].map(s => (
                          <option key={s} value={s} className="bg-surface-3 text-white">{t(`inventory.status.${s}`)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <button onClick={() => handleDelete(item._id)}
                        className="text-xs text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10">
                        {t('inventory.delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!items.length && (
          <div className="glass py-16 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">🛒</span>
            <p className="text-white font-medium">No inventory items yet</p>
            <p className="text-slate-500 text-sm">Add your first food item to start tracking freshness</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MANAGER SCAN (reuse ScanCapture logic)
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
    foodName: '', category: 'fruit', quantity: 1, unit: 'pcs',
    purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '', location: 'warehouse',
  });

  const applyFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setScan(null); setError('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(''); setScan(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScan(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || t('scan.error'));
      setScan(null);
    } finally { setLoading(false); }
  };

  const handleAddToInventory = (scanData) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    setInvForm({ foodName: scanData.foodType, category: 'fruit', quantity: 1, unit: 'pcs',
      purchaseDate: new Date().toISOString().split('T')[0], expiryDate: expiry.toISOString().split('T')[0], location: 'warehouse' });
    setShowInventoryForm(true);
  };

  const submitInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/manager/inventory', { ...invForm, linkedScanId: scan?._id,
        purchaseDate: new Date(invForm.purchaseDate).toISOString(),
        expiryDate: new Date(invForm.expiryDate).toISOString() });
      setShowInventoryForm(false);
    } catch { setError(t('inventory.error')); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1>{t('scan.title')}</h1>
            <p>Scan produce for business inventory</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-4 md:p-6 space-y-5 card-hover animate-fade-up delay-100">
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); applyFile(e.dataTransfer.files[0]); }}
            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              preview ? 'py-6' : 'py-10 md:py-14'
            } border-white/10 hover:border-brand-600/50 hover:bg-white/[0.02]`}>
            {preview ? (
              <div className="relative animate-scale-in">
                <img src={preview} alt="preview" className="max-h-48 md:max-h-64 max-w-full rounded-xl shadow-lg border border-white/10" />
                <button type="button" onClick={() => { setFile(null); setPreview(null); setScan(null); }}
                  className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg transition-transform hover:scale-110">✕</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl md:text-4xl animate-bounce-gentle">🍎</div>
                <div>
                  <p className="text-white font-semibold text-sm md:text-base">Drop an image here</p>
                  <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP — max 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer btn-glow text-white text-sm font-semibold">
              📷 {t('scan.capture')}
              <input type="file" accept="image/*" capture="environment" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            </label>
            <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer border border-brand-600/40 text-brand-400 text-sm font-semibold hover:bg-brand-600/10 transition-all">
              📁 {t('scan.upload')}
              <input type="file" accept="image/*" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            </label>
          </div>

          {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-shake">⚠️ {error}</div>}

          <button onClick={handleSubmit} disabled={!file || loading}
            className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
            {loading ? <><span className="spinner" /> {t('scan.loading')}</> : <><span>🔬</span> {t('scan.submit')}</>}
          </button>
        </div>

        <div className="animate-fade-up delay-200">
          {scan ? (
            <ScanResult scan={scan} onAddToInventory={handleAddToInventory} />
          ) : (
            <div className="glass p-6 md:p-8 h-full min-h-[280px] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl">
              <div className="text-5xl md:text-6xl animate-float-slow">🥬</div>
              <div>
                <p className="text-white font-semibold">Ready to analyze</p>
                <p className="text-slate-500 text-sm mt-1 max-w-xs">Upload a food image — the AI will detect freshness and add to business inventory</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm drawer-overlay">
          <div className="glass w-full sm:max-w-md p-6 shadow-2xl rounded-t-3xl sm:rounded-2xl animate-fade-up safe-bottom">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg">{t('result.addToInventory')}</h2>
              <button onClick={() => setShowInventoryForm(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={submitInventory} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input value={invForm.foodName} onChange={(e) => setInvForm({...invForm, foodName: e.target.value})}
                  className="input-dark px-3 py-2.5 text-sm col-span-2" placeholder={t('inventory.foodName')} />
                <select value={invForm.category} onChange={(e) => setInvForm({...invForm, category: e.target.value})} className="input-dark px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" value={invForm.quantity} onChange={(e) => setInvForm({...invForm, quantity: +e.target.value})}
                    className="input-dark px-3 py-2.5 text-sm w-20" />
                  <input value={invForm.unit} onChange={(e) => setInvForm({...invForm, unit: e.target.value})}
                    className="input-dark px-3 py-2.5 text-sm flex-1" placeholder={t('inventory.unit')} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">{t('inventory.purchaseDate')}</label>
                  <input type="date" value={invForm.purchaseDate} onChange={(e) => setInvForm({...invForm, purchaseDate: e.target.value})}
                    className="input-dark px-3 py-2.5 text-sm w-full" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">{t('inventory.expiryDate')}</label>
                  <input type="date" value={invForm.expiryDate} onChange={(e) => setInvForm({...invForm, expiryDate: e.target.value})}
                    className="input-dark px-3 py-2.5 text-sm w-full" required />
                </div>
                <select value={invForm.location} onChange={(e) => setInvForm({...invForm, location: e.target.value})} className="input-dark px-3 py-2.5 text-sm col-span-2">
                  <option value="warehouse">Warehouse</option>
                  <option value="fridge">Fridge</option>
                  <option value="pantry">Pantry</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInventoryForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all">
                  {t('inventory.cancel')}
                </button>
                <button type="submit" className="flex-1 btn-glow py-2.5 rounded-xl text-white text-sm font-semibold">
                  {t('inventory.save')}
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

  useEffect(() => { fetchScans(); }, [page, filters]);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.manager.scans')}</h1>
          <p className="text-slate-500 text-sm mt-1">All scans from your business</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap gap-2">
          <input type="text" placeholder={t('result.foodType')} value={filters.foodType}
            onChange={(e) => setFilters({...filters, foodType: e.target.value})}
            className="input-dark px-3 py-2 text-sm rounded-lg flex-1 min-w-[150px]" />
          <select value={filters.label} onChange={(e) => setFilters({...filters, label: e.target.value})}
            className="input-dark px-3 py-2 text-sm rounded-lg">
            <option value="">{t('label.all')}</option>
            <option value="Fresh">{t('label.Fresh')}</option>
            <option value="Borderline">{t('label.Borderline')}</option>
            <option value="Spoiled">{t('label.Spoiled')}</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            className="input-dark px-3 py-2 text-sm rounded-lg" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            className="input-dark px-3 py-2 text-sm rounded-lg" />
          {(filters.foodType || filters.label || filters.startDate || filters.endDate) && (
            <button onClick={() => setFilters({ foodType: '', label: '', startDate: '', endDate: '' })}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-all">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full dark-table">
            <thead>
              <tr>
                <th className="text-left">Food</th>
                <th className="text-left">Status</th>
                <th className="text-left hidden sm:table-cell">Confidence</th>
                <th className="text-left hidden md:table-cell">Gas (NH₃/H₂S/C₂H₄)</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s._id} className="border-b border-white/5 text-slate-300 hover:bg-white/[0.01]">
                  <td className="py-3 pr-4 font-medium text-white">{s.foodType}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.label === 'Fresh' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      s.label === 'Borderline' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {t(`label.${s.label}`)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell font-mono text-slate-400">{s.confidence}%</td>
                  <td className="py-3 pr-4 hidden md:table-cell text-xs font-mono text-slate-500">
                    NH₃:{s.gasReadings.nh3} H₂S:{s.gasReadings.h2s} C₂H₄:{s.gasReadings.ethylene}
                  </td>
                  <td className="py-3 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!scans.length && !loading && (
          <div className="glass py-16 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-white font-medium">No scans found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
            ← Prev
          </button>
          <span className="text-sm text-slate-400">Page {page} of {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))} disabled={page >= Math.ceil(total / limit)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetch();
  }, [period]);

  if (loading) {
    return <div className="glass p-8 rounded-2xl animate-pulse"><div className="h-8 w-1/3 bg-white/10 rounded mb-4" /><div className="h-64 bg-white/5 rounded" /></div>;
  }

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.manager.waste')}</h1>
          <p className="text-slate-500 text-sm mt-1">Weekly/monthly waste cost trends, top wasted items, PDF export</p>
        </div>
        <div className="flex gap-2">
          {['weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="💰" title="Total Waste Cost" value={formatCurrency(data?.totalCost || 0)} sub="All time" color="from-red-600/20 to-red-800/20 border-red-500/30 text-red-300" />
        <StatCard icon="📦" title="Most Wasted" value={data?.mostWastedItem?.name || 'N/A'} sub={`${formatCurrency(data?.mostWastedItem?.cost || 0)} lost`} color="from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300" />
        <StatCard icon="📊" title="Period" value={period.charAt(0).toUpperCase() + period.slice(1)} sub={`${data?.labels?.length || 0} data points`} color="from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300" />
      </div>

      {/* Chart */}
      <div className="glass p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">{t('nav.manager.waste')} Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.labels?.map((l, i) => ({ label: l, value: data.values[i] })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" stroke="#ffffff60" fontSize={11} tickMargin={10} />
              <YAxis stroke="#ffffff60" fontSize={11} tickFormatter={v => formatCurrency(v)} />
              <Tooltip formatter={v => [formatCurrency(v), 'Waste Cost']} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="url(#wasteGradient)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Download PDF */}
      <div className="glass p-6 rounded-2xl text-center border border-brand-500/30 bg-brand-500/10">
        <p className="text-slate-400 mb-4">Generate a compliance-ready PDF waste report</p>
        <a href="/api/manager/waste-report/pdf" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold">
          📄 Download PDF Report
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
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hello! I\'m your business advisor. Ask me about inventory optimization, waste reduction, or supplier quality.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput(''); setLoading(true);
    setMessages(p => [...p, { role: 'user', text: q }]);
    try {
      const { data } = await api.post('/manager/chat', { question: q, language: user?.language || 'en' });
      setMessages(p => [...p, { role: 'assistant', text: data.reply }]);
    } catch { setMessages(p => [...p, { role: 'assistant', text: 'Error: Could not reach AI advisor.' }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden h-[600px] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border-b border-white/8">
        <div className="h-6 w-6 rounded-md bg-brand-600/30 flex items-center justify-center text-xs">🤖</div>
        <span className="text-sm font-semibold text-white">Business AI Advisor</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse-slow" />
          <span className="text-xs text-slate-500">Gemini AI</span>
        </div>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-surface-2/30 flex-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-brand-700/40 border border-brand-600/30 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">🤖</div>
            )}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white/8 text-slate-200 rounded-bl-sm border border-white/5'
            }`}>{msg.text}</div>
            {msg.role === 'user' && <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs ml-2 mt-0.5 shrink-0">👤</div>}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="h-6 w-6 rounded-full bg-brand-700/40 border border-brand-600/30 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">🤖</div>
            <div className="bg-white/8 border border-white/5 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-3 bg-white/2 border-t border-white/8">
        <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about waste reduction, inventory turnover..."
          className="input-dark flex-1 px-3 py-2 text-sm rounded-lg" disabled={loading} />
        <button id="chat-send-btn" type="submit" disabled={loading || !input.trim()}
          className="btn-glow px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5">
          {loading ? <span className="spinner w-4 h-4" /> : '↑'}
        </button>
      </form>
    </div>
  );
}








