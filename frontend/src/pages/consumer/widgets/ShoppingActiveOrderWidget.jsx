import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { userPinIcon, storePinIcon, riderPinIcon } from './ShoppingHelpers';

export default function ShoppingActiveOrderWidget({
  activeOrder,
  orderStatus,
  userLat,
  userLng,
  deliveryRiderPos,
  activeSelectedShop,
  userAddress,
}) {
  const [showBillModal, setShowBillModal] = useState(false);

  if (!activeOrder || !orderStatus) return null;

  const steps = [
    { key: 'placed', label: '1. Placed' },
    { key: 'packing', label: '2. Packing' },
    { key: 'picked_up', label: '3. Picked Up' },
    { key: 'on_the_way', label: '4. On The Way' },
    { key: 'delivered', label: '5. Delivered 🎉' },
  ];

  const currentLat = userLat || 9.7833;
  const currentLng = userLng || 80.0167;

  return (
    <div className="glass p-5 sm:p-7 rounded-3xl border border-emerald-500/30 bg-slate-900/90 shadow-2xl space-y-5 animate-fade-up">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚴</span>
            <h2 className="text-lg font-black text-white">Active Order Tracker</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
              {orderStatus.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Order ID: <span className="font-mono text-cyan-300 font-bold">#{activeOrder._id}</span> · Store:{' '}
            <span className="text-white font-bold">{activeOrder.shopName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeOrder.deliveryOtp && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <span>🔑 OTP:</span>
              <span className="text-white tracking-widest text-sm">{activeOrder.deliveryOtp}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowBillModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all"
          >
            📄 View Receipt
          </button>
        </div>
      </div>

      {/* 5 Stage Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-bold">
        {steps.map((step) => {
          const isActive = orderStatus.status.toLowerCase().includes(step.key.replace('_', ' '));
          return (
            <div
              key={step.key}
              className={`p-2.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-glow'
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Live Rider Delivery Map */}
      <div className="rounded-2xl overflow-hidden border border-white/15 shadow-inner h-60 w-full relative">
        <MapContainer
          center={[currentLat, currentLng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {userPinIcon && (
            <Marker position={[currentLat, currentLng]} icon={userPinIcon}>
              <Popup>
                <strong>📍 Your Delivery Location</strong>
                <br />
                {userAddress || 'Registered Profile Address'}
              </Popup>
            </Marker>
          )}

          {storePinIcon && (
            <Marker
              position={activeSelectedShop?.coords || [currentLat + 0.01, currentLng + 0.01]}
              icon={storePinIcon}
            >
              <Popup>
                <strong>🏪 {activeSelectedShop?.shopName || activeOrder.shopName}</strong>
                <br /> Store Dispatch Point
              </Popup>
            </Marker>
          )}

          {deliveryRiderPos && riderPinIcon && (
            <Marker position={deliveryRiderPos} icon={riderPinIcon}>
              <Popup>
                <strong>🚴 Express Delivery Rider</strong>
                <br />
                Status: {orderStatus.status}
              </Popup>
            </Marker>
          )}
        </MapContainer>

        <div className="absolute bottom-3 left-3 z-[400] glass px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Live GPS Rider Dispatching</span>
        </div>
      </div>

      {/* Receipt Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-up">
          <div className="glass w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Order Receipt Invoice</h3>
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Invoice ID:</span>
                <span className="font-mono font-bold text-white">{activeOrder._id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Store Name:</span>
                <span className="font-bold text-white">{activeOrder.shopName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ${activeOrder.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBillModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
