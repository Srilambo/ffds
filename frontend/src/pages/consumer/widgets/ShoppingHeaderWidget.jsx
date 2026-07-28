import React from 'react';
import { POPULAR_QUICK_SUGGESTIONS } from './ShoppingHelpers';

export default function ShoppingHeaderWidget({
  itemsCount,
  checkedCount,
  estimatedTotal,
  inputItem,
  setInputItem,
  onAddItem,
  onQuickAddChip,
  isListening,
  onToggleVoice,
  onOpenCatalog,
  onOpenBulkImport,
  onOpenStoresModal,
  syncMsg,
  selectedPostalLocation,
  userCustomLocation,
  savedAddressLabel,
}) {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="glass p-5 sm:p-7 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">🛒</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Smart Grocery Shopping
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Interactive grocery list with proximity stores, instant online checkout, and map location pin.
            </p>
          </div>

          {/* Location Badge & Online Order Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">📍 Location:</span>
              <span className="font-bold text-white">
                {userCustomLocation
                  ? `${userCustomLocation.lat.toFixed(3)}, ${userCustomLocation.lng.toFixed(3)}`
                  : selectedPostalLocation?.name || 'Tellippalai'}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenStoresModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-glow transition-all active:scale-95 flex items-center gap-2"
            >
              <span>🏪</span> Order Online ({itemsCount} items)
            </button>
          </div>
        </div>

        {/* Sync Notification Banner */}
        {syncMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-up">
            <span>✨</span>
            <span>{syncMsg}</span>
          </div>
        )}
      </div>

      {/* Metrics Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass p-3.5 sm:p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <div className="text-xs text-slate-400 font-medium">Total Items</div>
          <div className="text-xl sm:text-2xl font-black text-white">{itemsCount}</div>
        </div>
        <div className="glass p-3.5 sm:p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <div className="text-xs text-slate-400 font-medium">Purchased</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">{checkedCount}</div>
        </div>
        <div className="glass p-3.5 sm:p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <div className="text-xs text-slate-400 font-medium">Remaining</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">{itemsCount - checkedCount}</div>
        </div>
        <div className="glass p-3.5 sm:p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <div className="text-xs text-slate-400 font-medium">Est. Total Cost</div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300">${estimatedTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Input Bar Form */}
      <form onSubmit={onAddItem} className="glass p-3 sm:p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputItem}
              onChange={(e) => setInputItem(e.target.value)}
              placeholder='Add item (e.g., "2 kg Apples", "1 Liter Milk")...'
              className="input-dark w-full pl-4 pr-10 py-3 text-xs sm:text-sm rounded-xl font-medium"
            />
            {onToggleVoice && (
              <button
                type="button"
                onClick={onToggleVoice}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-xs transition-colors ${
                  isListening ? 'bg-red-500/30 text-red-400 animate-pulse' : 'text-slate-400 hover:text-white'
                }`}
                title="Voice Dictation"
              >
                🎤
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
            >
              <span>➕</span> Add Item
            </button>

            {onOpenCatalog && (
              <button
                type="button"
                onClick={onOpenCatalog}
                className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all flex items-center gap-1"
                title="Visual Catalog"
              >
                <span>📦</span> Catalog
              </button>
            )}

            {onOpenBulkImport && (
              <button
                type="button"
                onClick={onOpenBulkImport}
                className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all flex items-center gap-1"
                title="Bulk Paste"
              >
                <span>📋</span> Bulk
              </button>
            )}
          </div>
        </div>

        {/* Quick Add Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider shrink-0 mr-1">
            ⚡ Quick Add:
          </span>
          {POPULAR_QUICK_SUGGESTIONS.slice(0, 8).map((sug) => (
            <button
              key={sug.name}
              type="button"
              onClick={() => onQuickAddChip(sug)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium hover:border-emerald-500/40 hover:text-emerald-300 transition-all flex items-center gap-1 active:scale-95"
            >
              <span>{sug.emoji}</span>
              <span>{sug.name}</span>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
