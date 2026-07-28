import React from 'react';

export default function ShoppingChecklistTableWidget({
  items = [],
  filterCategory,
  setFilterCategory,
  onToggleItem,
  onRemoveItem,
  onAdjustQuantity,
  onChangeUnit,
  onCyclePriority,
  onToggleSelectAll,
  onClearPurchased,
  onCopyClipboard,
  onTransferToFridge,
  transferring = false,
}) {
  const categories = ['all', 'Produce', 'Dairy', 'Bakery', 'Meat', 'Pantry'];

  const filteredItems = items.filter((item) => {
    if (filterCategory === 'all') return true;
    return (item.category || 'Produce').toLowerCase() === filterCategory.toLowerCase();
  });

  const allChecked = items.length > 0 && items.every((i) => i.checked);
  const checkedCount = items.filter((i) => i.checked).length;

  const priorityColors = {
    high: 'bg-red-500/20 text-red-300 border-red-500/40',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    normal: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all capitalize ${
                filterCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium transition-all"
          >
            {allChecked ? 'Deselect All' : 'Select All'}
          </button>

          {checkedCount > 0 && (
            <>
              <button
                type="button"
                onClick={onTransferToFridge}
                disabled={transferring}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition-all flex items-center gap-1"
              >
                <span>📥</span> Transfer ({checkedCount}) to Fridge
              </button>

              <button
                type="button"
                onClick={onClearPurchased}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-medium transition-all"
              >
                Clear Checked
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onCopyClipboard}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium transition-all"
            title="Copy list to clipboard"
          >
            📋 Copy List
          </button>
        </div>
      </div>

      {/* Items Rendering */}
      {filteredItems.length === 0 ? (
        <div className="glass p-8 rounded-2xl border border-white/10 text-center space-y-2">
          <div className="text-4xl">🛒</div>
          <div className="text-sm font-bold text-white">No Grocery Items Found</div>
          <div className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterCategory === 'all'
              ? 'Your checklist is empty. Add items above or choose from quick suggestions.'
              : `No items listed under the "${filterCategory}" category.`}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mobile Cards View (Visible on small screens) */}
          <div className="grid grid-cols-1 gap-2.5 sm:hidden">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`glass p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  item.checked
                    ? 'bg-slate-900/40 border-white/5 opacity-60'
                    : 'bg-slate-900/80 border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!item.checked}
                      onChange={() => onToggleItem(item.id)}
                      className="w-5 h-5 rounded text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xl shrink-0">{item.emoji || '🛒'}</span>
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          item.checked ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.category || 'Produce'} · ${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => onCyclePriority(item.id, e)}
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                      priorityColors[item.priority || 'normal']
                    }`}
                  >
                    {item.priority || 'normal'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-white/10 px-1.5 py-1">
                    <button
                      type="button"
                      onClick={(e) => onAdjustQuantity(item.id, -1, e)}
                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white px-2">
                      {item.quantityNum || 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => onAdjustQuantity(item.id, 1, e)}
                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.unit || 'pcs'}
                      onChange={(e) => onChangeUnit(item.id, e.target.value, e)}
                      className="bg-slate-950 text-slate-300 text-xs rounded-lg border border-white/10 px-2 py-1 font-medium"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="Liter">L</option>
                      <option value="pack">pack</option>
                      <option value="loaf">loaf</option>
                      <option value="dozen">dozen</option>
                    </select>

                    <button
                      type="button"
                      onClick={(e) => onRemoveItem(item.id, e)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Visible on medium screens and larger) */}
          <div className="hidden sm:block glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 uppercase text-[10px] tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 w-10">Done</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Quantity & Unit</th>
                  <th className="py-3 px-4">Est. Price</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.checked ? 'bg-slate-950/40 opacity-50' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={!!item.checked}
                        onChange={() => onToggleItem(item.id)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.emoji || '🛒'}</span>
                        <span className={item.checked ? 'line-through text-slate-500' : 'text-white'}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-400">{item.category || 'Produce'}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={(e) => onCyclePriority(item.id, e)}
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                          priorityColors[item.priority || 'normal']
                        }`}
                      >
                        {item.priority || 'normal'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 px-1 py-0.5">
                          <button
                            type="button"
                            onClick={(e) => onAdjustQuantity(item.id, -1, e)}
                            className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-white px-1.5 text-xs">
                            {item.quantityNum || 1}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => onAdjustQuantity(item.id, 1, e)}
                            className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <select
                          value={item.unit || 'pcs'}
                          onChange={(e) => onChangeUnit(item.id, e.target.value, e)}
                          className="bg-slate-950 text-slate-300 text-xs rounded-lg border border-white/10 px-2 py-1 font-medium"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="Liter">L</option>
                          <option value="pack">pack</option>
                          <option value="loaf">loaf</option>
                          <option value="dozen">dozen</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300 font-bold">
                      ${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => onRemoveItem(item.id, e)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
