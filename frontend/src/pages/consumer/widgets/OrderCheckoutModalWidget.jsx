import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const userPinIcon = typeof L !== 'undefined' ? L.divIcon({
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">📍</div>',
  className: 'custom-leaflet-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
}) : null;

const storePinIcon = typeof L !== 'undefined' ? L.divIcon({
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🏪</div>',
  className: 'custom-leaflet-pin',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
}) : null;

export default function OrderCheckoutModalWidget({
  onClose,
  items,
  nearbyShops,
  selectedShop,
  onSelectShop,
  paymentMethod,
  setPaymentMethod,
  cardForm,
  setCardForm,
  onSubmitOrder,
  placingOrder,
  userLat,
  userLng
}) {
  const activeOrderItems = items.filter((i) => !i.checked).length > 0 ? items.filter((i) => !i.checked) : items;
  const orderSubtotal = activeOrderItems.reduce((sum, i) => sum + (i.estimatedPrice || 2.50) * (i.quantityNum || 1), 0);
  const orderDeliveryFee = orderSubtotal > 20 ? 0.00 : (selectedShop?.deliveryFee || 1.50);
  const orderEcoFee = 0.50;
  const orderGrandTotal = orderSubtotal + orderDeliveryFee + orderEcoFee;

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/85 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 overflow-y-auto animate-fade-up">
      <div className="glass rounded-3xl border border-white/20 w-full max-w-6xl xl:max-w-7xl p-6 sm:p-8 space-y-6 shadow-2xl bg-slate-900/95 relative mb-12">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span className="text-2xl">🛒</span> Online Order & Store Selector
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Map matched top proximity stores, itemized money breakdown & live delivery dispatch.</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map & Store Cards */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>📍</span> Proximity Map ({nearbyShops.length} Stores Available)
              </span>
              <div className="rounded-2xl overflow-hidden border border-white/15 h-56 sm:h-64 w-full relative shadow-lg">
                <MapContainer center={[userLat, userLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <Marker position={[userLat, userLng]} icon={userPinIcon}>
                    <Popup><strong>📍 Your Delivery Location</strong></Popup>
                  </Marker>
                  {nearbyShops.map((shop) => (
                    <Marker key={shop._id} position={shop.coords || [userLat, userLng]} icon={storePinIcon} eventHandlers={{ click: () => onSelectShop(shop) }}>
                      <Popup>
                        <strong>🏪 {shop.shopName}</strong><br />
                        {shop.distanceKm} km away · {shop.deliveryTimeMinutes}<br />
                        Fee: ${shop.deliveryFee === 0 ? 'Free' : shop.deliveryFee.toFixed(2)}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div className="absolute bottom-3 left-3 z-[400] glass px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md">
                  Tap pin to pick store
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Suggested Store ({nearbyShops.length} Stores Available)
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1.5 scrollbar-thin">
                {nearbyShops.map((shop) => {
                  const isSelected = selectedShop?._id === shop._id;
                  return (
                    <div
                      key={shop._id}
                      onClick={() => onSelectShop(shop)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow ring-1 ring-brand-500/40'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">🏪</span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-white flex items-center gap-2 truncate">
                            <span className="truncate">{shop.shopName}</span>
                            {shop.isVerified && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                                ✓ Verified
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {shop.address} · ⭐ {shop.rating || 4.9} ({shop.reviewsCount || 100}+ reviews)
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-brand-300 block">
                          {shop.distanceKm || '1.2'} km · ⚡ {shop.deliveryTimeMinutes || '10-15 min'}
                        </span>
                        <span className="text-xs text-emerald-400 font-extrabold block mt-0.5">
                          {shop.deliveryFee === 0 ? '🎉 Free Delivery' : `$${(shop.deliveryFee || 1.5).toFixed(2)} Delivery`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown, Payment Options & Large Submit Button */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="glass p-5 rounded-2xl border border-white/10 space-y-4 bg-white/5 shadow-md">
              <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">💰 Order Money Breakdown</span>
                <span className="text-brand-300 font-mono font-bold text-xs">{activeOrderItems.length} items</span>
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto text-xs text-slate-300 pr-1 scrollbar-thin">
                {activeOrderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-sm">{item.emoji}</span> <span className="truncate font-semibold">{item.name}</span> <span className="text-slate-400 font-mono text-[11px]">({item.qty})</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-xs shrink-0">${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal:</span>
                  <span className="text-white font-bold">${orderSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="text-white font-bold">{orderDeliveryFee === 0 ? 'FREE' : `$${orderDeliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Eco-Packaging Fee:</span>
                  <span className="text-white font-bold">${orderEcoFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base text-brand-300 pt-2 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">${orderGrandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payment Method</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-3.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'cash' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow ring-1 ring-brand-500/40' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  💵 Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3.5 px-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow ring-1 ring-brand-500/40' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  💳 Credit / Debit Card
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="glass p-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 space-y-3 animate-fade-up mt-2">
                  <input
                    type="text"
                    placeholder="Card Number (4532 •••• •••• 8921)"
                    value={cardForm.number}
                    onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                    className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl font-mono"
                    />
                    <input
                      type="password"
                      placeholder="CVV (123)"
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onSubmitOrder}
              disabled={placingOrder || !selectedShop}
              className="btn-glow w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-glow transition-all active:scale-98"
            >
              {placingOrder ? (
                <><span className="spinner" /> Submitting Order...</>
              ) : (
                `🚀 Dispatch Order ($${orderGrandTotal.toFixed(2)})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
