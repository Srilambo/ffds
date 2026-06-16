import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import ExpiryAlert from '../components/ExpiryAlert';
import InventoryList from '../components/InventoryList';

const CATEGORIES = ['fruit','vegetable','dairy','bakery','other'];
const STATUSES   = ['active','consumed','wasted'];

export default function Inventory() {
  const { t } = useTranslation();
  const [items,    setItems]    = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [category, setCategory] = useState('');
  const [status,   setStatus]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    foodName: '', category: 'fruit', quantity: 1,
    unit: 'pcs', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      if (status)   params.status   = status;
      const [invRes, expRes] = await Promise.all([
        api.get('/inventory', { params }),
        api.get('/inventory/expiring'),
      ]);
      setItems(invRes.data);
      setExpiring(expRes.data);
    } catch { setError(t('inventory.error')); }
  };

  useEffect(() => { load(); }, [category, status]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory', {
        ...form,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        expiryDate:   new Date(form.expiryDate).toISOString(),
      });
      setShowForm(false);
      setForm({ foodName: '', category: 'fruit', quantity: 1,
        unit: 'pcs', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '' });
      load();
    } catch { setError(t('inventory.error')); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (id, data) => { await api.put(`/inventory/${id}`, data); load(); };
  const handleDelete = async (id) => { await api.delete(`/inventory/${id}`); load(); };

  const stats = {
    total:    items.length,
    active:   items.filter(i => i.status === 'active').length,
    wasted:   items.filter(i => i.status === 'wasted').length,
    consumed: items.filter(i => i.status === 'consumed').length,
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('inventory.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">Track your food pantry and reduce waste</p>
        </div>
        <button
          id="add-item-btn"
          onClick={() => setShowForm(!showForm)}
          className="btn-glow px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          {showForm ? '✕ Cancel' : `+ ${t('inventory.addItem')}`}
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: stats.total,    color: 'text-white',       bg: 'bg-white/5' },
          { label: 'Active',      value: stats.active,   color: 'text-brand-400',   bg: 'bg-brand-500/10' },
          { label: 'Consumed',    value: stats.consumed, color: 'text-slate-400',   bg: 'bg-white/3' },
          { label: 'Wasted',      value: stats.wasted,   color: 'text-red-400',     bg: 'bg-red-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass ${bg} p-4 text-center card-hover`}>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Expiry alerts */}
      <ExpiryAlert expiringItems={expiring} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-dark px-3 py-2 text-sm rounded-lg"
        >
          <option value="">{t('inventory.filter.category')}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-dark px-3 py-2 text-sm rounded-lg"
        >
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">⚠️ {error}</div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="glass p-6 fade-up">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-brand-600/30 text-brand-400 flex items-center justify-center text-xs">+</span>
            Add New Item
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input
              value={form.foodName}
              onChange={(e) => setForm({ ...form, foodName: e.target.value })}
              className="input-dark px-3 py-2.5 text-sm col-span-2 md:col-span-1"
              placeholder={t('inventory.foodName')}
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-dark px-3 py-2.5 text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>)}
            </select>
            <div className="flex gap-2">
              <input
                type="number" min="0.1" step="0.1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
                className="input-dark px-3 py-2.5 text-sm w-20"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input-dark px-3 py-2.5 text-sm flex-1"
                placeholder={t('inventory.unit')}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('inventory.purchaseDate')}</label>
              <input
                type="date" value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="input-dark px-3 py-2.5 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('inventory.expiryDate')}</label>
              <input
                type="date" value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="input-dark px-3 py-2.5 text-sm w-full"
                required
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-glow w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? <><span className="spinner" /> Saving…</> : `${t('inventory.save')} →`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory list */}
      <InventoryList items={items} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );
}
