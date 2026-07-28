import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosClient';

export default function PantryWidget() {
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
    const nameMatch = (item.foodName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return locMatch && nameMatch;
  });

  const totalCount = items.length;
  const expiringSoonCount = items.filter((i) => {
    const days = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  }).length;

  const expiredCount = items.filter((i) => {
    const days = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days < 0;
  }).length;

  const getCategoryEmoji = (cat) => {
    switch (cat) {
      case 'fruit': return '🍎';
      case 'vegetable': return '🥦';
      case 'dairy': return '🥛';
      case 'meat': return '🥩';
      case 'beverage': return '🧃';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6 animate-fade-up pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">🧊</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('pantry.title') || 'Fridge & Pantry Inventory'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('pantry.subtitle') || 'Track freshness, prevent food waste, and manage inventory.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <span>➕</span> {t('pantry.addItem') || 'Add Pantry Item'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <div className="text-xs text-slate-400 font-medium">Total Items</div>
          <div className="text-xl sm:text-2xl font-black text-white">{totalCount}</div>
        </div>

        <div className="glass p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center space-y-1">
          <div className="text-xs text-amber-300 font-medium">Expiring Soon (≤3d)</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">{expiringSoonCount}</div>
        </div>

        <div className="glass p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-1">
          <div className="text-xs text-red-300 font-medium">Expired Items</div>
          <div className="text-xl sm:text-2xl font-black text-red-400">{expiredCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar text-xs">
          {['all', 'fridge', 'freezer', 'pantry'].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setActiveLocation(loc)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all capitalize ${
                activeLocation === loc
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pantry items..."
            className="input-dark w-full pl-9 pr-3 py-2 text-xs rounded-xl"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading pantry items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="glass p-8 rounded-2xl border border-white/10 text-center space-y-2">
          <div className="text-4xl">🥦</div>
          <div className="text-sm font-bold text-white">No items in your pantry</div>
          <div className="text-xs text-slate-400">Click "Add Pantry Item" above to add new food items.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            let statusBadge = (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                Fresh ({daysLeft}d)
              </span>
            );
            if (daysLeft >= 0 && daysLeft <= 3) {
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
                  Expiring ({daysLeft}d)
                </span>
              );
            } else if (daysLeft < 0) {
              statusBadge = (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                  Expired ({Math.abs(daysLeft)}d ago)
                </span>
              );
            }

            return (
              <div
                key={item._id}
                className="glass p-4 rounded-2xl border border-white/10 hover:border-white/20 bg-slate-900/60 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{item.foodName}</h3>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {item.quantity} {item.unit} · Location: {item.location}
                        </div>
                      </div>
                    </div>
                    {statusBadge}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(item._id, 'consumed')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px]"
                  >
                    ✓ Consumed
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item._id)}
                    className="p-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md animate-fade-up">
          <form
            onSubmit={handleCreateItem}
            className="glass w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Add Pantry Item</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                  Food Name
                </label>
                <input
                  type="text"
                  required
                  value={newItem.foodName}
                  onChange={(e) => setNewItem({ ...newItem, foodName: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  placeholder="e.g. Organic Milk"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="bg-slate-950 text-white w-full px-3 py-2 text-xs rounded-xl border border-white/10"
                  >
                    <option value="fruit">Fruit</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="beverage">Beverage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                    Location
                  </label>
                  <select
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="bg-slate-950 text-white w-full px-3 py-2 text-xs rounded-xl border border-white/10"
                  >
                    <option value="fridge">Fridge</option>
                    <option value="freezer">Freezer</option>
                    <option value="pantry">Pantry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value, 10) })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                    placeholder="pcs, kg, L"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold"
              >
                {addLoading ? 'Saving...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
