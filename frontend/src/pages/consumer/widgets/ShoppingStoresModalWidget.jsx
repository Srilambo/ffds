import React from 'react';
import ShoppingMapWidget from './ShoppingMapWidget';
import { SRI_LANKA_POSTAL_CODES } from './ShoppingHelpers';

export default function ShoppingStoresModalWidget({
  isOpen,
  onClose,
  stores = [],
  selectedShop,
  onSelectShop,
  userCustomLocation,
  selectedPostalLocation,
  onSelectPostalCity,
  onMapPinClick,
  onEnableGps,
  trackingGps,
  onProceedToCheckout,
  loadingShops = false,
}) {
  if (!isOpen) return null;

  const currentLat = userCustomLocation?.lat || selectedPostalLocation?.coords?.[0] || 9.7833;
  const currentLng = userCustomLocation?.lng || selectedPostalLocation?.coords?.[1] || 80.0167;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-up">
      <div className="glass w-full max-w-4xl rounded-3xl border border-white/15 bg-slate-900/95 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
              🏪
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Select Grocery Store</h2>
              <p className="text-xs text-slate-400">Choose proximity store for fast home delivery</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Location Picker Options Bar */}
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              📍 Postal Code / District:
            </label>
            <select
              value={selectedPostalLocation?.code || '40130'}
              onChange={(e) => {
                const match = SRI_LANKA_POSTAL_CODES.find((p) => p.code === e.target.value);
                if (match && onSelectPostalCity) onSelectPostalCity(match);
              }}
              className="bg-slate-950 text-white font-bold w-full px-3 py-2.5 rounded-xl border border-white/15 focus:border-emerald-500"
            >
              {SRI_LANKA_POSTAL_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} - {item.name} ({item.district})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              🎯 Location Pin Status:
            </label>
            <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-mono flex items-center justify-between">
              <span>
                {userCustomLocation
                  ? `Custom Pin: ${userCustomLocation.lat.toFixed(4)}, ${userCustomLocation.lng.toFixed(4)}`
                  : `District Pin: ${selectedPostalLocation?.name || 'Tellippalai'}`}
              </span>
              {onEnableGps && (
                <button
                  type="button"
                  onClick={onEnableGps}
                  className="text-emerald-400 font-bold hover:underline ml-2"
                >
                  {trackingGps ? 'Locating...' : 'GPS Pin'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map Location Picker Widget */}
        <ShoppingMapWidget
          userLat={currentLat}
          userLng={currentLng}
          stores={stores}
          selectedShop={selectedShop}
          onSelectStore={onSelectShop}
          onLocationSelect={onMapPinClick}
          onEnableGps={onEnableGps}
          trackingGps={trackingGps}
          heightClass="h-56 sm:h-64"
        />

        {/* Store Selection Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available Stores Nearby ({stores.length})
            </h3>
            {loadingShops && <span className="text-xs text-emerald-400 animate-pulse">Loading stores...</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stores.map((shop) => {
              const isSelected = selectedShop && selectedShop._id === shop._id;
              return (
                <div
                  key={shop._id || shop.shopName}
                  onClick={() => onSelectShop(shop)}
                  className={`glass p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-glow'
                      : 'border-white/10 hover:border-white/20 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        <span>🏪</span>
                        <span>{shop.shopName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{shop.address}</div>
                    </div>
                    {isSelected && (
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-300 font-medium">
                      📍 {shop.distanceKm} km · ⏱️ {shop.deliveryTimeMinutes}
                    </span>
                    <span className="font-bold text-emerald-300">
                      Fee: ${shop.deliveryFee === 0 ? 'FREE' : shop.deliveryFee?.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onProceedToCheckout}
            disabled={!selectedShop}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>💳</span> Proceed to Checkout with {selectedShop?.shopName || 'Selected Store'}
          </button>
        </div>
      </div>
    </div>
  );
}
