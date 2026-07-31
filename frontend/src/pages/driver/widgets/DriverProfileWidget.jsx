import React, { useState } from 'react';
import api from '../../../api/axiosClient';

export function DriverProfileWidget({ driver, manager, onUpdateProfile }) {
  const [form, setForm] = useState({
    vehicleType: driver?.vehicleType || 'Bicycle',
    licensePlate: driver?.licensePlate || '',
    phone: driver?.phone || '',
    driverStatus: driver?.driverStatus || 'available',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await api.patch('/driver/status', form);
      setMsg({ type: 'success', text: 'Driver profile updated successfully!' });
      if (onUpdateProfile) onUpdateProfile(data.user);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{driver?.name || 'Driver Profile'}</h2>
            <p className="text-xs text-slate-400">{driver?.email}</p>
          </div>
        </div>

        {/* Manager Connection Info Card */}
        <div className="bg-slate-900/70 p-4 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Connected Manager</span>
              <p className="text-sm font-bold text-white">{manager ? manager.name : 'No Manager Linked'}</p>
              {manager?.email && <p className="text-xs text-slate-400">{manager.email}</p>}
            </div>
          </div>
          {manager && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Connected ✓
            </span>
          )}
        </div>

        {/* Vehicle & Duty Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Vehicle & Delivery Settings</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle Type</label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
              >
                <option value="Bicycle">🚲 Bicycle</option>
                <option value="Scooter">🛵 Scooter / E-Bike</option>
                <option value="Motorcycle">🏍️ Motorcycle</option>
                <option value="Van">🚐 Delivery Van</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">License Plate / Vehicle ID</label>
              <input
                type="text"
                placeholder="e.g. NP-1234"
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +94 77 123 4567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duty Status</label>
              <select
                value={form.driverStatus}
                onChange={(e) => setForm({ ...form, driverStatus: e.target.value })}
                className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
              >
                <option value="available">🟢 Available for Deliveries</option>
                <option value="delivering">🟡 On Delivery Job</option>
                <option value="offline">🔴 Offline / Off-Duty</option>
              </select>
            </div>
          </div>

          {msg.text && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 shadow-glow"
          >
            {loading ? <><span className="spinner" /> Saving…</> : 'Save Profile Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DriverProfileWidget;
