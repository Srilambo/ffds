import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../../api/axiosClient';

// ─── Custom map icon helper ───────────────────────────────────
const makeIcon = (emoji, size = 36) =>
  L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">${emoji}</div>`,
    className: '',
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

const storeIcon    = makeIcon('🏪', 34);
const consumerIcon = makeIcon('📍', 36);
const driverIcon   = makeIcon('🏍️', 40);

// ─── Route + animated bike (OSRM, free, no API key) ────────────
// Single fetch: draws the road polyline AND animates the bike when isMoving=true
function RouteWithBike({ from, to, isMoving }) {
  const [routePoints, setRoutePoints] = React.useState([]);
  const [posIdx, setPosIdx]           = React.useState(0);
  const timerRef                      = React.useRef(null);

  // Fetch road geometry from OSRM
  useEffect(() => {
    if (!from || !to) return;
    setPosIdx(0);
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const c = data?.routes?.[0]?.geometry?.coordinates;
        setRoutePoints(c?.length ? c.map(([lng, lat]) => [lat, lng]) : [from, to]);
      })
      .catch(() => setRoutePoints([from, to]));
  }, [JSON.stringify(from), JSON.stringify(to)]);

  // Animate bike along route when out_for_delivery
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!isMoving || routePoints.length < 2) return;
    // Step 1 point every 180ms → full route loops smoothly
    timerRef.current = setInterval(() => {
      setPosIdx(i => (i + 1) % routePoints.length);
    }, 180);
    return () => clearInterval(timerRef.current);
  }, [isMoving, routePoints.length]);

  // Reset to start of route when not moving
  useEffect(() => { if (!isMoving) setPosIdx(0); }, [isMoving]);

  const bikePosition = isMoving
    ? (routePoints[posIdx] || from)
    : from;  // static at store when not on the way

  const bikeLabel = isMoving ? '📦 On The Way — Delivering!' : '🛒 Bike — Ready at Store';

  return (
    <>
      {/* Road polyline */}
      {routePoints.length > 0 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#f59e0b', weight: 4, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }}
        />
      )}
      {/* Bike marker: moves when isMoving, static at store otherwise */}
      <Marker position={bikePosition} icon={driverIcon}>
        <Popup><strong>🏍️ {bikeLabel}</strong></Popup>
      </Marker>
    </>
  );
}


// ─── Auto-fit map bounds to all pins ─────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length >= 2) {
      try { map.fitBounds(positions, { padding: [50, 50] }); } catch {}
    }
  }, [map, JSON.stringify(positions)]);
  return null;
}

export function DriverDeliveriesWidget({ orders, onUpdateStatus, loading }) {

  const [filter, setFilter]               = useState('active');
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [otpInput, setOtpInput]           = useState('');
  const [otpError, setOtpError]           = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [driverReviews, setDriverReviews] = useState([]);
  const [driverAvgRating, setDriverAvgRating] = useState(5.0);
  const [driverPos, setDriverPos]         = useState(null);  // live GPS [lat, lng]
  const watchRef = useRef(null);

  // ── Load driver ratings ────────────────────────────────────
  useEffect(() => {
    api.get('/reviews/driver')
      .then(res => {
        setDriverReviews(res.data?.reviews || []);
        setDriverAvgRating(res.data?.avgRating || 5.0);
      })
      .catch(() => {});
  }, [orders]);

  // ── Live GPS watchPosition ─────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => setDriverPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const filteredOrders = (orders || []).filter(order => {
    if (filter === 'active')    return ['pending','confirmed','preparing','assigned','out_for_delivery'].includes(order.status);
    if (filter === 'completed') return order.status === 'delivered';
    return true;
  });

  const STAGES = [
    { key: 'placed',     label: '1. Placed ⌛' },
    { key: 'accepted',   label: '2. Accepted 🏪' },
    { key: 'packing',    label: '3. Packing 📦' },
    { key: 'on_the_way', label: '4. On Way 🏇' },
    { key: 'delivered',  label: '5. Done 🎉' },
  ];

  const getStageIndex = status => {
    switch (status) {
      case 'pending':
      case 'confirmed':         return 0;
      case 'preparing':         return 1;
      case 'assigned':          return 2;
      case 'out_for_delivery':  return 3;
      case 'delivered':         return 4;
      default:                  return 0;
    }
  };

  const handleAdvanceStage = async (order, nextStatus) => {
    if (nextStatus === 'delivered') {
      setOtpModalOrder(order);
      setOtpInput('');
      setOtpError('');
      return;
    }
    const res = await onUpdateStatus(order._id, nextStatus);
    if (res && !res.success) alert(res.error || 'Failed to update stage');
  };

  const handleVerifyOtpSubmit = async e => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 4) {
      setOtpError('Please enter the 4-digit Delivery OTP code.');
      return;
    }
    setSubmittingOtp(true);
    setOtpError('');
    const res = await onUpdateStatus(otpModalOrder._id, 'delivered', otpInput.trim());
    setSubmittingOtp(false);
    if (res && res.success) {
      setOtpModalOrder(null);
      setOtpInput('');
    } else {
      setOtpError(res?.error || 'Incorrect OTP. Please check with the customer.');
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Header & Tabs ── */}
      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/10">
        <div>
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <span>🚚</span> Online Delivery Control Center
          </h3>
          <p className="text-xs text-slate-400">Live map · customer details · 5-stage delivery tracking</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          {[
            { id: 'active',    label: '⚡ Active' },
            { id: 'completed', label: '✅ Delivered' },
            { id: 'all',       label: '📋 All' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orders ── */}
      {loading ? (
        <div className="flex justify-center py-12"><span className="spinner h-8 w-8 text-amber-400" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl space-y-2 border border-white/5">
          <p className="text-4xl">📦</p>
          <p className="font-bold text-white text-base">No active deliveries</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filter === 'active'
              ? 'Once your manager dispatches an order, it will appear here for 5-stage tracking.'
              : 'No delivery history found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map(order => {
            const stageIdx        = getStageIndex(order.status);
            const consumerName    = order.consumerId?.name    || 'Customer';
            const consumerPhone   = order.consumerId?.phone   || order.consumerPhone || null;
            const consumerAddress = order.deliveryAddress     || order.consumerId?.address || 'Jaffna, Sri Lanka';
            const shopName        = order.shopId?.shopName    || 'Dispatch Store';
            const shopAddress     = order.shopId?.address     || 'Tellipalai, Jaffna';

            // ── Map coordinates ─────────────────────────────────
            // Shop: GeoJSON Point → coordinates = [lng, lat]
            const shopCoords = order.shopId?.location?.coordinates;
            const storeLng  = shopCoords?.[0] || 80.0380;
            const storeLat  = shopCoords?.[1] || 9.8150;
            // Consumer: deliveryLocation.lat / .lng saved at order time
            const consLat   = order.deliveryLocation?.lat && order.deliveryLocation.lat !== 0
                                ? order.deliveryLocation.lat  : 9.7845;
            const consLng   = order.deliveryLocation?.lng && order.deliveryLocation.lng !== 0
                                ? order.deliveryLocation.lng  : 80.0270;

            const storePos    = [storeLat, storeLng];
            const consumerPos = [consLat,  consLng];
            // Bike always starts at the store (pickup point)
            const bikePos  = storePos;
            const allPins  = [storePos, consumerPos];
            const mapCenter = [(storeLat + consLat) / 2, (storeLng + consLng) / 2];

            return (
              <div
                key={order._id}
                className="glass border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden flex flex-col transition-all shadow-2xl bg-slate-900/90"
              >
                {/* ── Live Map ── */}
                <div className="relative h-60 sm:h-72 w-full border-b border-white/10">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap"
                    />
                    <FitBounds positions={allPins} />

                    {/* Road route + animated bike via OSRM */}
                    <RouteWithBike
                      from={storePos}
                      to={consumerPos}
                      isMoving={order.status === 'out_for_delivery'}
                    />

                    {/* Store pin */}
                    <Marker position={storePos} icon={storeIcon}>
                      <Popup>
                        <strong>🏪 {shopName}</strong><br />{shopAddress}
                      </Popup>
                    </Marker>

                    {/* Consumer pin */}
                    <Marker position={consumerPos} icon={consumerIcon}>
                      <Popup>
                        <strong>📍 {consumerName}</strong><br />{consumerAddress}
                        {consumerPhone && <><br />📞 {consumerPhone}</>}
                      </Popup>
                    </Marker>
                  </MapContainer>

                  {/* Map Legend overlay */}
                  <div className="absolute bottom-2 left-2 z-[400] flex gap-1.5 flex-wrap pointer-events-none">
                    <span className="glass text-[10px] font-bold text-white px-2 py-1 rounded-lg border border-white/20">🏪 Store Pick-Up</span>
                    <span className="glass text-[10px] font-bold text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30">🛣️ Road Route</span>
                    <span className="glass text-[10px] font-bold text-rose-300 px-2 py-1 rounded-lg border border-rose-500/30">📍 Drop-Off</span>
                    <span className="glass text-[10px] font-bold text-orange-300 px-2 py-1 rounded-lg border border-orange-500/30 flex items-center gap-1">
                      {order.status === 'out_for_delivery'
                        ? <><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping inline-block" />🏍️ Moving — On The Way</>
                        : <>🏍️ Bike at Store</>}
                    </span>
                  </div>

                </div>

                {/* ── Card Body ── */}
                <div className="p-5 space-y-4">

                  {/* Order ID + Status + OTP badge */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400">
                          #{order._id.toString().slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {order.deliveryOtp && (
                      <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                        🔐 OTP at Drop-Off
                      </div>
                    )}
                  </div>

                  {/* 5-Stage stepper */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300 px-0.5">
                      <span>Delivery Stages</span>
                      <span className="text-amber-400">Stage {stageIdx + 1}/5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-white/10">
                      {STAGES.map((stg, idx) => {
                        const done    = idx <= stageIdx;
                        const current = idx === stageIdx;
                        return (
                          <div
                            key={stg.key}
                            className={`py-1.5 px-1 rounded-lg text-center text-[10px] font-bold transition-all ${
                              current
                                ? 'bg-amber-500 text-slate-950 font-black shadow-glow animate-pulse'
                                : done
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/5 text-slate-500 border border-white/5'
                            }`}
                          >
                            {stg.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Store + Consumer Detail Cards */}
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    {/* Store */}
                    <div className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                      <span className="text-xl shrink-0">🏪</span>
                      <div className="overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatch Store · Pick-Up</span>
                        <p className="font-bold text-white text-sm truncate">{shopName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{shopAddress}</p>
                      </div>
                    </div>

                    {/* Consumer */}
                    <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/25 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">Customer Drop-Off</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">👤</span>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-sm truncate">{consumerName}</p>
                          <p className="text-[11px] text-slate-300 truncate">{consumerAddress}</p>
                        </div>
                      </div>
                      {consumerPhone ? (
                        <a
                          href={`tel:${consumerPhone}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] hover:bg-emerald-500/35 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          📞 Call Customer &middot; {consumerPhone}
                        </a>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No phone number on file</p>
                      )}
                    </div>
                  </div>

                  {/* Items & Total */}
                  <div className="bg-white/3 p-3 rounded-xl border border-white/5 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Items ({order.items?.length || 0})</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        ${(order.totalAmount || 0).toFixed(2)} &middot; {order.paymentMethod?.toUpperCase() || 'CASH'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {order.items?.map(i => `${i.name} (${i.qty || '1'})`).join(', ') || 'Grocery delivery items'}
                    </p>
                  </div>

                  {/* Stage Control Buttons */}
                  <div className="pt-2 border-t border-white/10">
                    {order.status !== 'delivered' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {stageIdx < 1 && (
                          <button
                            onClick={() => handleAdvanceStage(order, 'preparing')}
                            className="py-2.5 px-3 rounded-xl text-white text-xs font-bold bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer"
                          >
                            Stage 2: Accept 🏪
                          </button>
                        )}
                        {stageIdx < 2 && (
                          <button
                            onClick={() => handleAdvanceStage(order, 'assigned')}
                            className="py-2.5 px-3 rounded-xl text-white text-xs font-bold bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
                          >
                            Stage 3: Packing 📦
                          </button>
                        )}
                        {stageIdx < 3 && (
                          <button
                            onClick={() => handleAdvanceStage(order, 'out_for_delivery')}
                            className="col-span-2 py-2.5 px-3 rounded-xl text-white text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer"
                          >
                            🏇 Stage 4: Start Delivery — On The Way!
                          </button>
                        )}
                        {stageIdx >= 3 && (
                          <button
                            onClick={() => handleAdvanceStage(order, 'delivered')}
                            className="col-span-2 py-3 px-4 rounded-xl text-white text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer"
                          >
                            🔒 Stage 5: Verify OTP & Complete Delivery 🎉
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full text-center py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                        🎉 Delivered — OTP Verified Successfully
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Driver Ratings Section ── */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>⭐</span> My Delivery Ratings &amp; Feedback ({driverReviews.length})
          </h3>
          <span className="text-xs text-amber-300 font-mono font-bold">
            Average: {driverAvgRating} / 5.0 ★
          </span>
        </div>
        {driverReviews.length === 0 ? (
          <div className="glass p-5 rounded-2xl border border-white/10 text-center text-slate-400 text-xs">
            No customer ratings yet. Ratings appear after customers complete drop-offs and rate your delivery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {driverReviews.map(rev => (
              <div key={rev._id} className="glass p-4 rounded-2xl border border-white/10 space-y-2 bg-slate-950/60">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">{rev.consumerName || 'Customer'}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Store: {rev.shopName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 text-xs font-extrabold">{'★'.repeat(rev.riderRating)}</span>
                    <span className="text-xs text-amber-300 ml-1 font-bold">({rev.riderRating}/5)</span>
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-300 italic bg-white/5 p-2 rounded-xl border border-white/5">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── OTP Verification Modal ── */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-up">
          <div className="glass w-full max-w-md p-6 rounded-3xl border border-white/20 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <div>
                  <h3 className="font-bold text-white text-base">Customer Delivery OTP</h3>
                  <p className="text-[11px] text-slate-400">Order #{otpModalOrder._id.toString().slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setOtpModalOrder(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            {/* Customer summary in modal */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <div>
                  <p className="font-bold text-amber-300">{otpModalOrder.consumerId?.name || 'Customer'}</p>
                  <p className="text-slate-300 text-[11px]">{otpModalOrder.deliveryAddress || 'Delivery Address'}</p>
                </div>
              </div>
              {(otpModalOrder.consumerId?.phone || otpModalOrder.consumerPhone) && (
                <a
                  href={`tel:${otpModalOrder.consumerId?.phone || otpModalOrder.consumerPhone}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] hover:bg-emerald-500/30 transition-all w-full justify-center cursor-pointer"
                >
                  📞 Call Customer to get OTP: {otpModalOrder.consumerId?.phone || otpModalOrder.consumerPhone}
                </a>
              )}
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span><span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Enter 4-Digit OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 5147"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input-dark w-full text-center text-2xl font-mono tracking-[0.5em] font-black py-3 rounded-2xl border-emerald-500/40 focus:border-emerald-400"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOtp}
                  className="flex-1 btn-glow py-3 rounded-xl text-slate-950 font-black text-xs bg-gradient-to-r from-emerald-400 to-teal-400 shadow-glow cursor-pointer disabled:opacity-50"
                >
                  {submittingOtp ? 'Verifying…' : 'Verify & Deliver 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default DriverDeliveriesWidget;

