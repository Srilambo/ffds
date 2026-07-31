import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../api/axiosClient';

const ORDER_STATUS_META = {
  pending:          { label: 'Pending',          cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  confirmed:        { label: 'Confirmed',         cls: 'bg-brand-500/20 text-brand-300 border-brand-500/30' },
  preparing:        { label: 'Preparing',         cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  assigned:         { label: 'Assigned Driver',   cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  out_for_delivery: { label: 'Out for Delivery',  cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  delivered:        { label: 'Delivered',          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rejected:         { label: 'Rejected',           cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export function ManagerOrders() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedDriverMap, setSelectedDriverMap] = useState({});

  const [shopName, setShopName] = useState('');

  const [reviews, setReviews] = useState([]);

  const loadOrdersAndDrivers = async () => {
    try {
      const [ordRes, drvRes, shopRes, revRes] = await Promise.allSettled([
        api.get('/orders/manager'),
        api.get('/manager/drivers'),
        api.get('/shops/my'),
        api.get('/reviews/manager'),
      ]);

      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.data || []);
      if (drvRes.status === 'fulfilled') setDrivers(drvRes.value.data || []);
      if (shopRes.status === 'fulfilled') {
        setShopId(shopRes.value.data?._id);
        setShopName(shopRes.value.data?.shopName || '');
      }
      if (revRes.status === 'fulfilled') setReviews(revRes.value.data || []);
    } catch {
      // ignore fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersAndDrivers();
  }, []);

  useEffect(() => {
    if (!socket) return;
    if (shopId) socket.emit('join_shop', shopId);

    const handleNewOrder = () => loadOrdersAndDrivers();
    const handleStatusUpdate = () => loadOrdersAndDrivers();

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_update', handleStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_update', handleStatusUpdate);
      if (shopId) socket.emit('leave_shop', shopId);
    };
  }, [socket, shopId]);

  const updateStatus = async (orderId, status, extra = {}) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status, ...extra });
      loadOrdersAndDrivers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAssignDriver = async (orderId) => {
    const driverId = selectedDriverMap[orderId];
    if (!driverId) {
      alert('Please select a driver from the dropdown to assign');
      return;
    }
    try {
      await api.post(`/manager/orders/${orderId}/assign-driver`, { driverId });
      loadOrdersAndDrivers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign driver');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const counts = { pending: 0, confirmed: 0, preparing: 0, assigned: 0, out_for_delivery: 0, delivered: 0, rejected: 0 };
  orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">Loading orders queue...</div>;

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            📦 Orders Queue {shopName ? <span className="text-emerald-400 text-lg font-bold">({shopName})</span> : ''}
          </h1>
          <p className="text-xs text-slate-400">Accept customer orders, assign store drivers, and track live deliveries</p>
        </div>
        <button onClick={loadOrdersAndDrivers} className="text-xs text-brand-400 font-semibold px-3 py-1.5 rounded-xl border border-brand-500/20 bg-brand-500/10 hover:bg-brand-500/20 transition-all">
          ↻ Refresh Orders
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
          <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)} className={`glass p-3 rounded-xl border transition-all text-left ${filter === key ? meta.cls : 'border-white/10'}`}>
            <p className="text-xl font-black text-white">{counts[key] || 0}</p>
            <p className="text-[9px] text-slate-400 uppercase font-semibold truncate">{meta.label}</p>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="glass rounded-2xl p-8 border border-white/10 text-center text-slate-400 space-y-2">
          <p className="text-2xl">📦</p>
          <p className="text-sm font-semibold text-white">No orders found in queue</p>
          <p className="text-xs">When consumers place online grocery orders, they will appear here live for manager assignment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order._id} className="glass rounded-2xl p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <p className="font-bold text-white text-base">{order.consumerName || order.consumerId?.name || 'Customer'}</p>
                  <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">#{order._id.toString().slice(-6)}</span>
                  {order.deliveryOtp && (
                    <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      🔐 OTP Protected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  Total: <span className="font-bold text-white">${order.totalAmount?.toFixed(2)}</span> · Items: <span className="font-semibold">{order.items?.length || 0}</span> · Payment: <span className="uppercase text-amber-300 font-semibold">{order.paymentMethod || 'cash'}</span>
                </p>
                {order.driverId ? (
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                    <span>🚚 Assigned Rider:</span>
                    <span className="text-white font-semibold">{order.driverId.name}</span>
                    <span className="text-slate-400">({order.driverId.phone || order.driverId.vehicleType || 'Driver'})</span>
                  </p>
                ) : (
                  <p className="text-xs text-amber-400 font-medium italic pt-1">
                    ⚠️ Awaiting Driver Assignment
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${ORDER_STATUS_META[order.status]?.cls}`}>
                  {ORDER_STATUS_META[order.status]?.label || order.status}
                </span>

                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order._id, 'confirmed')} className="px-3.5 py-1.5 bg-brand-500/20 text-brand-300 text-xs font-bold rounded-xl hover:bg-brand-500/30 border border-brand-500/40 transition-all">
                    Confirm Order
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button onClick={() => updateStatus(order._id, 'preparing')} className="px-3.5 py-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-xl hover:bg-blue-500/30 border border-blue-500/40 transition-all">
                    Prepare Packing
                  </button>
                )}

                {/* Inline Driver Selection & Assign Button */}
                {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                  <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
                    <select
                      value={selectedDriverMap[order._id] || (order.driverId?._id || '')}
                      onChange={(e) => setSelectedDriverMap({ ...selectedDriverMap, [order._id]: e.target.value })}
                      className="input-dark px-2.5 py-1 text-xs rounded-lg"
                    >
                      <option value="">-- Select Store Driver --</option>
                      {drivers.map((d) => (
                        <option key={d._id} value={d._id}>
                          🚚 {d.name} ({d.driverStatus || 'available'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignDriver(order._id)}
                      className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold rounded-lg border border-amber-500/40 transition-all"
                    >
                      Assign Driver
                    </button>
                  </div>
                )}

                {order.status === 'pending' && (
                  <button onClick={() => setRejectId(order._id)} className="px-3.5 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 border border-red-500/30 transition-all">
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Reviews & Produce Quality Ratings Section */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>⭐</span> Customer Reviews & Delivery Feedback ({reviews.length})
          </h2>
          <span className="text-xs text-amber-300 font-mono font-bold">
            Average Shop Rating: {reviews.length > 0 ? (reviews.reduce((s, r) => s + r.storeRating, 0) / reviews.length).toFixed(1) : '5.0'} / 5.0 ★
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="glass p-6 rounded-2xl border border-white/10 text-center text-slate-400 text-xs">
            No customer reviews submitted yet. When consumers complete orders and rate produce freshness, reviews will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev._id} className="glass p-4 rounded-2xl border border-white/10 space-y-2 bg-slate-900/60">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">{rev.consumerName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Order #{rev.orderId?.toString().slice(-6) || 'Review'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 text-xs font-extrabold">{'★'.repeat(rev.storeRating)}</span>
                    <p className="text-[10px] text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px]">🚴 Rider Rating</span>
                    <span className="text-amber-300 font-bold">{rev.riderRating}/5 ★ ({rev.driverName || rev.driverId?.name || 'Rider'})</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px]">🍎 Produce Freshness</span>
                    <span className="text-emerald-300 font-bold">{rev.freshnessRating || rev.storeRating}/5 ★</span>
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl border border-white/10 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Reject Order</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-dark w-full p-3 text-xs rounded-xl" rows={3} placeholder="Reason for rejection..." />
            <div className="flex gap-3">
              <button onClick={async () => { await updateStatus(rejectId, 'rejected', { rejectionReason: rejectReason }); setRejectId(null); }} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold">Reject</button>
              <button onClick={() => setRejectId(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 text-xs font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerOrders;
