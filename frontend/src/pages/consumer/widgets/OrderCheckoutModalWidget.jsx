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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
      <div className="glass rounded-2xl border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🛒</span> Online Order & Store Selector
            </h2>
            <p className="text-xs text-slate-400">Map matched 5 top proximity stores, itemized money breakdown & live delivery.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 text-sm">✕</button>
        </div>

        {/* Interactive Proximity Stores Map */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>📍</span> 5 Nearby Suggested Proximity Stores on Map
          </span>
          <div className="rounded-xl overflow-hidden border border-white/15 h-52 w-full relative">
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
            <div className="absolute bottom-2 left-2 z-[400] glass px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">
              Tap pin to pick store
            </div>
          </div>
        </div>

        {/* 5 Suggested Proximity Stores Cards Selector */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Store ({nearbyShops.length} Suggested Stores)</span>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {nearbyShops.map((shop) => {
              const isSelected = selectedShop?._id === shop._id;
              const hasStock = Array.isArray(shop.stockSummary) && shop.stockSummary.length > 0;
              return (
                <div
                  key={shop._id}
                  onClick={() => onSelectShop(shop)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏪</span>
                      <div>
                        <p className="font-bold text-xs flex items-center gap-1.5">
                          {shop.shopName}
                          {shop.isVerified && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">✓ Verified</span>}
                        </p>
                        <p className="text-[11px] text-slate-400">{shop.address} · ⭐ {shop.rating || 4.9} ({shop.reviewsCount || 100}+ reviews)</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-brand-300 block">{shop.distanceKm || '1.2'} km · ⚡ {shop.deliveryTimeMinutes || '10-15 min'}</span>
                      <span className="text-[10px] text-slate-400 block">{shop.deliveryFee === 0 ? '🎉 Free Delivery' : `$${(shop.deliveryFee || 1.5).toFixed(2)} Delivery`}</span>
                    </div>
                  </div>

                  {/* Stock Products Badges from Manager Profile */}
                  {hasStock && (
                    <div className="pt-1.5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0">In-Stock Products:</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {shop.stockSummary.slice(0, 4).map((st, sIdx) => (
                          <span key={sIdx} className="text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full font-semibold border border-white/10 whitespace-nowrap">
                            🛍️ {typeof st === 'string' ? st : st.name}
                          </span>
                        ))}
                        {shop.stockSummary.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold">+{shop.stockSummary.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Money & Itemized Financial Details */}
        <div className="glass p-4 rounded-xl border border-white/10 space-y-3 bg-white/5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>💰 Product & Order Money Breakdown</span>
            <span className="text-brand-300 font-mono">{activeOrderItems.length} items</span>
          </span>
          <div className="space-y-1.5 max-h-28 overflow-y-auto text-xs text-slate-300 pr-1">
            {activeOrderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="flex items-center gap-1.5">
                  <span>{item.emoji}</span> {item.name} <span className="text-slate-400 font-mono">({item.qty})</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">${((item.estimatedPrice || 2.5) * (item.quantityNum || 1)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Items Subtotal:</span>
              <span className="text-white">${orderSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delivery Fee:</span>
              <span className="text-white">{orderDeliveryFee === 0 ? 'FREE' : `$${orderDeliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Eco-Packaging & Service Fee:</span>
              <span className="text-white">${orderEcoFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-brand-300 pt-1 border-t border-white/10">
              <span>Grand Total (Money Due):</span>
              <span>${orderGrandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Select Payment Method */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Payment Method</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'cash' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              💵 Cash on Delivery
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                paymentMethod === 'card' ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              💳 Credit / Debit Card
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="glass p-3 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-2 animate-fade-up mt-2">
              <input
                type="text"
                placeholder="Card Number (4532 •••• •••• 8921)"
                value={cardForm.number}
                onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                />
                <input
                  type="password"
                  placeholder="CVV (123)"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Order Button */}
        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={placingOrder || !selectedShop}
          className="btn-glow w-full py-3.5 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-glow"
        >
          {placingOrder ? (
            <><span className="spinner" /> Submitting Order...</>
          ) : (
            `🚀 Place Order ($${orderGrandTotal.toFixed(2)}) via ${paymentMethod === 'card' ? 'Card' : 'Cash'}`
          )}
        </button>
      </div>
    </div>
  );
}
