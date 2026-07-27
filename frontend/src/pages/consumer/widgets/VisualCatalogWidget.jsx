import React, { useState } from 'react';
import { VISUAL_PRODUCT_CATALOG } from './ShoppingChecklistWidgets';

export default function VisualCatalogWidget({ onSelectProduct }) {
  const [visualCatFilter, setVisualCatFilter] = useState('all');

  const filteredVisualCatalog = VISUAL_PRODUCT_CATALOG.filter((p) => {
    if (visualCatFilter === 'all') return true;
    if (visualCatFilter === 'Fruit') return p.subcat === 'Fruit';
    if (visualCatFilter === 'Vegetable') return p.subcat === 'Vegetable';
    return p.category === visualCatFilter;
  });

  return (
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
            <button
              key={tab.id}
              type="button"
              onClick={() => setVisualCatFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                visualCatFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto pr-1">
        {filteredVisualCatalog.map((prod, idx) => (
          <div
            key={idx}
            onClick={() => onSelectProduct(prod)}
            className="glass p-3 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-between text-center cursor-pointer group space-y-1.5"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{prod.emoji}</span>
            <div>
              <p className="font-bold text-xs text-white leading-tight">{prod.name}</p>
              <span className="text-[10px] text-brand-300 font-mono block mt-0.5">
                1 {prod.defaultUnit} · ${prod.estPrice.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              className="w-full py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[10px] font-extrabold transition-all cursor-pointer"
            >
              + Add to List
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
