import React, { useState, useEffect } from 'react';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../api/axiosClient';

const ORDER_STATUS_META = {
  pending:          { label: 'Pending',          cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  confirmed:        { label: 'Confirmed',         cls: 'bg-brand-500/20 text-brand-300 border-brand-500/30' },
  preparing:        { label: 'Preparing',         cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  out_for_delivery: { label: 'Out for Delivery',  cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  delivered:        { label: 'Delivered',          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rejected:         { label: 'Rejected',           cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export function ManagerOrders() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const shopRes = await api.get('/shops/my');
        setShopId(shopRes.data._id);
        const ordRes = await api.get('/orders/manager');
        setOrders(ordRes.data);
      } catch { setOrders([]); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!socket || !shopId) return;
    socket.emit('join_shop', shopId);
    socket.on('new_order', (order) => setOrders((prev) => [order, ...prev]));
    return () => { socket.off('new_order'); socket.emit('leave_shop', shopId); };
  }, [socket, shopId]);

  const updateStatus = async (orderId, status, extra = {}) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status, ...extra });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch (err) { alert(err.response?.data?.error || 'Failed to update status'); }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const counts = { pending: 0, confirmed: 0, preparing: 0, out_for_delivery: 0, delivered: 0, rejected: 0 };
  orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm animate-pulse">Loading orders...</div>;

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">📦 Orders Queue</h1>
        </div>
        <button onClick={async () => { const r = await api.get('/orders/manager'); setOrders(r.data); }} className="text-xs text-brand-400 font-semibold">↻ Refresh</button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
          <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)} className={`glass p-3 rounded-xl border ${filter === key ? meta.cls : 'border-white/10'}`}>
            <p className="text-xl font-black text-white">{counts[key]}</p>
            <p className="text-[9px] text-slate-400 uppercase font-semibold">{meta.label}</p>
          </button>
        ))}
      </div>
      
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div key={order._id} className="glass rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-sm">{order.consumerName || 'Consumer Order'}</p>
              <p className="text-xs text-slate-400">Total: LKR {order.totalAmount}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2.5 py-1 rounded-full border ${ORDER_STATUS_META[order.status]?.cls}`}>{ORDER_STATUS_META[order.status]?.label}</span>
              {order.status === 'pending' && <button onClick={() => updateStatus(order._id, 'confirmed')} className="px-3 py-1 bg-brand-500/20 text-brand-300 text-[10px] font-bold rounded-lg hover:bg-brand-500/30">Confirm</button>}
              {order.status === 'confirmed' && <button onClick={() => updateStatus(order._id, 'preparing')} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-lg hover:bg-blue-500/30">Prepare</button>}
              {order.status === 'pending' && <button onClick={() => setRejectId(order._id)} className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20">Reject</button>}
            </div>
          </div>
        ))}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl border border-white/10 w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-white mb-4">Reject Order</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input-dark w-full p-3 text-xs rounded-xl mb-4" rows={3} placeholder="Reason..." />
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
