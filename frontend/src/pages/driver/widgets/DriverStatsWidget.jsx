import React from 'react';

export function DriverStatsWidget({ stats, driver, manager, onStatusToggle }) {
  const activeCount = stats?.activeCount || 0;
  const completedToday = stats?.completedToday || 0;
  const totalDelivered = stats?.totalDelivered || 0;

  const currentStatus = driver?.driverStatus || 'available';

  const statusStyles = {
    available: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    delivering: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
    offline: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Duty Toggle & Vehicle Info */}
      <div className="glass p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-glow">
            🚚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{driver?.name || 'Driver'}</h2>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${statusStyles[currentStatus]}`}>
                {currentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vehicle: <span className="text-slate-200 font-semibold">{driver?.vehicleType || 'Bicycle'}</span> 
              {driver?.licensePlate && ` (${driver.licensePlate})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusToggle && onStatusToggle(currentStatus === 'available' ? 'offline' : 'available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              currentStatus === 'available'
                ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {currentStatus === 'available' ? '🔴 Go Offline' : '🟢 Go Online'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Active Deliveries</span>
          <p className="text-3xl font-black text-amber-400 mt-1">{activeCount}</p>
          <span className="text-[10px] text-slate-400">Needs dropoff</span>
        </div>

        <div className="glass p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Completed Today</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">{completedToday}</p>
          <span className="text-[10px] text-slate-400">Delivered today</span>
        </div>

        <div className="glass p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Total Delivered</span>
          <p className="text-3xl font-black text-cyan-400 mt-1">{totalDelivered}</p>
          <span className="text-[10px] text-slate-400">All time</span>
        </div>

        <div className="glass p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Assigned Manager</span>
          {manager ? (
            <div>
              <p className="text-sm font-bold text-white truncate">{manager.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{manager.email}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No manager linked</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverStatsWidget;
