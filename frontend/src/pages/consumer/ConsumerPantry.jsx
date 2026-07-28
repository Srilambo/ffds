import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';

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
