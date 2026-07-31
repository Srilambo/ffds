import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosClient';

export function ManagerDriversWidget() {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Link Driver Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: 'Bicycle',
    licensePlate: '',
  });

  // Assign Order Modal State
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversRes, ordersRes] = await Promise.all([
        api.get('/manager/drivers'),
        api.get('/orders/manager'),
      ]);
      setDrivers(driversRes.data || []);
      setOrders(ordersRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load drivers and orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [addModalError, setAddModalError] = useState('');

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddModalError('');
    try {
      await api.post('/manager/drivers', driverForm);
      setShowAddModal(false);
      setAddModalError('');
      setDriverForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        vehicleType: 'Bicycle',
        licensePlate: '',
      });
      loadData();
    } catch (err) {
      setAddModalError(err.response?.data?.error || 'Failed to add driver');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleDriverStatus = async (drv) => {
    const nextStatus = drv.driverStatus === 'offline' ? 'available' : 'offline';
    try {
      await api.patch(`/manager/drivers/${drv._id}/status`, { driverStatus: nextStatus });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update driver duty status');
    }
  };

  const handleDeleteDriver = async (drv) => {
    if (!window.confirm(`Are you sure you want to delete driver "${drv.name}" (${drv.email}) from your store?`)) {
      return;
    }
    try {
      await api.delete(`/manager/drivers/${drv._id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete driver');
    }
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!selectedDriverId || !assigningOrder) return;
    setAssignLoading(true);
    try {
      await api.post(`/manager/orders/${assigningOrder._id}/assign-driver`, {
        driverId: selectedDriverId,
      });
      setAssigningOrder(null);
      setSelectedDriverId('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign driver');
    } finally {
      setAssignLoading(false);
    }
  };

  // Pending orders requiring driver assignment
  const unassignedOrders = orders.filter(
    (o) => ['confirmed', 'preparing', 'pending'].includes(o.status) && !o.driverId
  );

  return (
    <div className="space-y-6 fade-up">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🚚</span> Driver Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connect and manage online delivery drivers for your store orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 shadow-glow"
          >
            <span>+ Register / Link Driver</span>
          </button>
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Unassigned Orders Notification Banner */}
      {unassignedOrders.length > 0 && (
        <div className="glass bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">📦</span>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {unassignedOrders.length} Online {unassignedOrders.length === 1 ? 'Order' : 'Orders'} Waiting for Driver Assignment
              </p>
              <p className="text-[11px] text-slate-400">
                Assign available drivers to ensure fast 15-minute delivery to customers.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setAssigningOrder(unassignedOrders[0]);
              if (drivers.length > 0) setSelectedDriverId(drivers[0]._id);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shrink-0"
          >
            Assign Driver Now →
          </button>
        </div>
      )}

      {/* Connected Drivers Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Connected Store Drivers ({drivers.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><span className="spinner h-8 w-8 text-amber-400" /></div>
        ) : drivers.length === 0 ? (
          <div className="glass p-12 text-center text-slate-500 rounded-2xl space-y-3 border border-white/5">
            <p className="text-4xl">🛵</p>
            <p className="font-bold text-white text-base">No drivers connected to your store</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add your delivery personnel so you can assign online food orders for instant delivery.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-glow px-4 py-2 rounded-xl text-white text-xs font-semibold inline-block mt-2"
            >
              + Add First Driver
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((drv) => {
              const activeDriverOrders = orders.filter(
                (o) => o.driverId?._id === drv._id && ['assigned', 'out_for_delivery'].includes(o.status)
              );

              return (
                <div
                  key={drv._id}
                  className="glass border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between card-hover transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm">
                          {drv.name ? drv.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{drv.name}</h3>
                          <p className="text-xs text-slate-400">{drv.email}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                          drv.driverStatus === 'available'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : drv.driverStatus === 'delivering'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                        }`}
                      >
                        {drv.driverStatus || 'available'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vehicle:</span>
                        <span className="font-semibold text-white">{drv.vehicleType || 'Bicycle'}</span>
                      </div>
                      {drv.licensePlate && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Plate ID:</span>
                          <span className="font-mono text-amber-400">{drv.licensePlate}</span>
                        </div>
                      )}
                      {drv.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <a href={`tel:${drv.phone}`} className="text-amber-400 hover:underline">{drv.phone}</a>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
                        <span className="text-slate-400">Active Deliveries:</span>
                        <span className="font-bold text-emerald-400">{activeDriverOrders.length}</span>
                      </div>
                    </div>

                    {/* Driver Actions Footer (Offline Toggle & Delete) */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => handleToggleDriverStatus(drv)}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                          drv.driverStatus === 'offline'
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {drv.driverStatus === 'offline' ? '🟢 Set Available' : '🔴 Set Offline'}
                      </button>

                      <button
                        onClick={() => handleDeleteDriver(drv)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all flex items-center gap-1"
                        title="Delete Driver from Store"
                      >
                        <span>🗑️ Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Link Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/15 space-y-4 fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>🚚</span> Add Driver to Store
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleAddDriver} className="space-y-3">
              {addModalError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-semibold">
                  ⚠️ {addModalError}
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Driver Alex"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Driver Email *</label>
                <input
                  type="email"
                  placeholder="driver@example.com"
                  value={driverForm.email}
                  onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                  className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={driverForm.password}
                  onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                  className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Vehicle Type</label>
                  <select
                    value={driverForm.vehicleType}
                    onChange={(e) => setDriverForm({ ...driverForm, vehicleType: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  >
                    <option value="Bicycle">🚲 Bicycle</option>
                    <option value="Scooter">🛵 Scooter</option>
                    <option value="Motorcycle">🏍️ Motorcycle</option>
                    <option value="Van">🚐 Van</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+94..."
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 btn-glow py-2.5 rounded-xl text-white text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  {addLoading ? <span className="spinner" /> : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver to Order Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/15 space-y-4 fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>📦</span> Assign Order #{assigningOrder._id.toString().slice(-6).toUpperCase()}
              </h3>
              <button onClick={() => setAssigningOrder(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1 text-xs">
              <p className="text-slate-300"><span className="text-slate-400">Customer:</span> {assigningOrder.consumerId?.name || 'Customer'}</p>
              <p className="text-slate-300"><span className="text-slate-400">Address:</span> {assigningOrder.deliveryAddress || 'Tellippalai'}</p>
              <p className="text-emerald-400 font-bold"><span className="text-slate-400">Amount:</span> ${assigningOrder.totalAmount?.toFixed(2)}</p>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Store Driver</label>
                {drivers.length === 0 ? (
                  <p className="text-xs text-red-400">No drivers available. Please register a driver first!</p>
                ) : (
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                    required
                  >
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.vehicleType || 'Bicycle'}) - {d.driverStatus || 'available'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedDriverId}
                  className="flex-1 btn-glow py-2.5 rounded-xl text-white text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  {assignLoading ? <span className="spinner" /> : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDriversWidget;
