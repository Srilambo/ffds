import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosClient';

export function DriverDeliveriesWidget({ orders, onUpdateStatus, loading }) {
  const [filter, setFilter] = useState('active'); // 'active', 'completed', 'all'
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [driverReviews, setDriverReviews] = useState([]);
  const [driverAvgRating, setDriverAvgRating] = useState(5.0);

  useEffect(() => {
    api.get('/reviews/driver')
      .then((res) => {
        setDriverReviews(res.data?.reviews || []);
        setDriverAvgRating(res.data?.avgRating || 5.0);
      })
      .catch(() => {});
  }, [orders]);

  const filteredOrders = (orders || []).filter((order) => {
    if (filter === 'active') return ['confirmed', 'preparing', 'assigned', 'out_for_delivery'].includes(order.status);
    if (filter === 'completed') return order.status === 'delivered';
    return true;
  });

  const STAGES = [
    { key: 'placed',           status: 'confirmed',        label: '1. Placed ⌛' },
    { key: 'accepted',         status: 'preparing',        label: '2. Accepted 🏪' },
    { key: 'packing',          status: 'assigned',         label: '3. Packing 📦' },
    { key: 'on_the_way',       status: 'out_for_delivery', label: '4. On Way 🏇' },
    { key: 'delivered',        status: 'delivered',        label: '5. Delivered 🎉' },
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 0;
      case 'preparing':
        return 1;
      case 'assigned':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
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
    if (res && !res.success) {
      alert(res.error || 'Failed to update order stage');
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
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
      setOtpError(res?.error || 'Incorrect OTP code. Please check with the customer.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/10">
        <div>
          <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
            <span>🚚</span> Online Delivery Control Center
          </h3>
          <p className="text-xs text-slate-400">Manage 5 delivery stages & verify customer OTPs on drop-off</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          {[
            { id: 'active', label: '⚡ Active Orders' },
            { id: 'completed', label: '✅ Delivered' },
            { id: 'all', label: '📋 All History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12"><span className="spinner h-8 w-8 text-amber-400" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl space-y-2 border border-white/5">
          <p className="text-4xl">📦</p>
          <p className="font-bold text-white text-base">No active deliveries</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filter === 'active'
              ? 'You currently have no pending online order deliveries. Once your manager dispatches an order, it will appear here for 5-stage tracking.'
              : 'No delivery history found.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const currentStageIdx = getStageIndex(order.status);
            const consumerName = order.consumerId?.name || 'Customer';
            const consumerPhone = order.consumerId?.phone || order.consumerPhone || 'N/A';
            const consumerAddress = order.deliveryAddress || order.consumerId?.address || 'Tellippalai, Jaffna';
            const shopName = order.shopId?.shopName || 'Tellippalai Fresh Supermarket';
            const shopAddress = order.shopId?.address || 'Tellippalai Main Road, Jaffna';

            return (
              <div
                key={order._id}
                className="glass border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all card-hover bg-slate-900/90 shadow-2xl"
              >
                <div className="space-y-4">
                  {/* Top Bar: Order ID & Status */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-amber-400">
                          #{order._id.toString().slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Order Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {order.deliveryOtp && (
                      <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                        <span>🔐 Security OTP:</span>
                        <span className="text-amber-200 font-semibold text-xs">Required at Drop-Off</span>
                      </div>
                    )}
                  </div>

                  {/* 5-Stage Stepper Tracker */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1">
                      <span>Delivery Lifecycle Stages (5-Stage Control)</span>
                      <span className="text-amber-400 font-mono">Stage {currentStageIdx + 1}/5</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-white/10">
                      {STAGES.map((stg, idx) => {
                        const isDone = idx <= currentStageIdx;
                        const isCurrent = idx === currentStageIdx;
                        return (
                          <div
                            key={stg.key}
                            className={`py-1.5 px-1 rounded-lg text-center text-[10px] font-bold transition-all ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 font-black shadow-glow animate-pulse'
                                : isDone
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/5 text-slate-500 border border-white/5'
                            }`}
                          >
                            <span className="truncate block">{stg.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pickup & Dropoff Route Details */}
                  <div className="space-y-2 text-xs">
                    {/* Pick Up Store Card */}
                    <div className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-white/10">
                      <span className="text-xl">🏪</span>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Dispatch Store</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">Stage 2 Pick-Up</span>
                        </div>
                        <p className="font-bold text-white text-sm truncate">{shopName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{shopAddress}</p>
                      </div>
                    </div>

                    {/* Customer Drop-off Card */}
                    <div className="flex items-start gap-2.5 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <span className="text-xl">📍</span>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-300">Customer Drop-Off</span>
                          <span className="text-[10px] text-amber-400 font-semibold">Stage 5 Final Destination</span>
                        </div>
                        <p className="font-bold text-white text-sm truncate">{consumerName}</p>
                        <p className="text-[11px] text-slate-300 truncate">{consumerAddress}</p>
                        {consumerPhone !== 'N/A' && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <a
                              href={`tel:${consumerPhone}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] hover:bg-emerald-500/30 transition-all"
                            >
                              📞 Call Customer ({consumerPhone})
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items & Payment Summary */}
                  <div className="bg-white/3 p-3 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Order Contents ({order.items?.length || 0} items)</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        ${(order.totalAmount || 0).toFixed(2)} ({order.paymentMethod?.toUpperCase() || 'CASH'})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {order.items?.map((i) => `${i.name} (${i.qty || '1'})`).join(', ') || 'Online grocery delivery items'}
                    </p>
                  </div>
                </div>

                {/* Stage Controls Button Bar */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {order.status !== 'delivered' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {currentStageIdx < 1 && (
                        <button
                          onClick={() => handleAdvanceStage(order, 'preparing')}
                          className="py-2.5 px-3 rounded-xl text-white text-xs font-bold bg-blue-600 hover:bg-blue-500 transition-all"
                        >
                          Stage 2: Accept 🏪
                        </button>
                      )}
                      {currentStageIdx < 2 && (
                        <button
                          onClick={() => handleAdvanceStage(order, 'assigned')}
                          className="py-2.5 px-3 rounded-xl text-white text-xs font-bold bg-indigo-600 hover:bg-indigo-500 transition-all"
                        >
                          Stage 3: Confirm Packing 📦
                        </button>
                      )}
                      {currentStageIdx < 3 && (
                        <button
                          onClick={() => handleAdvanceStage(order, 'out_for_delivery')}
                          className="col-span-2 py-2.5 px-3 rounded-xl text-white text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all shadow-glow flex items-center justify-center gap-2"
                        >
                          <span>🏇 Stage 4: Start Delivery (On The Way)</span>
                        </button>
                      )}
                      {currentStageIdx >= 3 && (
                        <button
                          onClick={() => handleAdvanceStage(order, 'delivered')}
                          className="col-span-2 py-3 px-4 rounded-xl text-white text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all shadow-glow flex items-center justify-center gap-2"
                        >
                          <span>🔒 Stage 5: Complete Delivery & Verify OTP 🔑</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full text-center py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                      <span>🎉 Stage 5 Completed: Drop-Off Verified with Customer OTP</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rider Ratings & Customer Compliments Section */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>⭐</span> My Delivery Ratings & Feedback ({driverReviews.length})
          </h3>
          <span className="text-xs text-amber-300 font-mono font-bold">
            Average Rider Score: {driverAvgRating} / 5.0 ★
          </span>
        </div>

        {driverReviews.length === 0 ? (
          <div className="glass p-5 rounded-2xl border border-white/10 text-center text-slate-400 text-xs">
            No customer ratings received yet. When customers complete drop-offs and rate your delivery, feedback will show here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {driverReviews.map((rev) => (
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

      {/* Delivery OTP Verification Modal */}
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
              <button
                onClick={() => setOtpModalOrder(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-300">🔑 Ask customer for 4-digit Delivery OTP:</p>
                <p className="text-slate-300 text-[11px]">
                  The customer will see their 4-digit Delivery OTP on their active order tracking screen.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Enter 4-Digit OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 5147"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="input-dark w-full text-center text-2xl font-mono tracking-[0.5em] font-black py-3 rounded-2xl border-emerald-500/40 focus:border-emerald-400"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOtp}
                  className="flex-1 btn-glow py-3 rounded-xl text-slate-950 font-black text-xs bg-gradient-to-r from-emerald-400 to-teal-400 shadow-glow"
                >
                  {submittingOtp ? 'Verifying OTP…' : 'Verify & Deliver 🎉'}
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
