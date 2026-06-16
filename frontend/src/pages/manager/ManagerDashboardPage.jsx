import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className={`glass bg-gradient-to-br ${color} border p-5 rounded-2xl flex flex-col gap-2`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70">
        <span>{icon}</span> {title}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <span className="text-[10px] opacity-60">{sub}</span>}
    </div>
  );
}

export default function ManagerDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">📊 Manager Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span> — here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Business Mode</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🍎" title="Total Inventory" value="134" sub="Active stock items" color="from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300" />
        <StatCard icon="⚠️" title="Expiring (2 days)" value="8" sub="Needs urgent action" color="from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300" />
        <StatCard icon="🗑️" title="Waste This Week" value="$124" sub="Down 12% from last week" color="from-red-600/20 to-red-800/20 border-red-500/30 text-red-300" />
        <StatCard icon="👥" title="Staff Active Today" value="5" sub="Out of 8 team members" color="from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 text-emerald-300" />
      </div>

      {/* Alerts Panel */}
      <div className="glass border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
        <h3 className="text-base font-bold text-amber-300 mb-3">⚠️ Expiring Soon — Needs Action</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Organic Milk 2L", exp: "Expires in 1 day", qty: "3 units" },
            { name: "Mixed Salad Bag", exp: "Expires in 2 days", qty: "6 units" },
            { name: "Sliced Ham 200g", exp: "Expires in 2 days", qty: "2 units" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-3 bg-white/5 border border-amber-500/20 rounded-xl p-3">
              <span className="text-xl">🕐</span>
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-[10px] text-amber-400">{item.exp} · {item.qty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Activity */}
      <div className="glass p-6 rounded-2xl space-y-3">
        <h3 className="text-lg font-bold text-white">Staff Scan Activity Today</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                <th className="text-left py-2 pr-4">Staff Member</th>
                <th className="text-left py-2 pr-4">Scans Done</th>
                <th className="text-left py-2 pr-4">Fresh</th>
                <th className="text-left py-2 pr-4">Spoiled</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Priya K.", scans: 24, fresh: 20, spoiled: 2, active: true },
                { name: "Rajan M.", scans: 18, fresh: 15, spoiled: 1, active: true },
                { name: "Thilak A.", scans: 12, fresh: 12, spoiled: 0, active: true },
                { name: "Kumari P.", scans: 0, fresh: 0, spoiled: 0, active: false },
              ].map((s) => (
                <tr key={s.name} className="border-b border-white/5 text-slate-300">
                  <td className="py-2.5 pr-4 font-medium text-white">{s.name}</td>
                  <td className="py-2.5 pr-4">{s.scans}</td>
                  <td className="py-2.5 pr-4 text-emerald-400">{s.fresh}</td>
                  <td className="py-2.5 pr-4 text-red-400">{s.spoiled}</td>
                  <td className="py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500'}`}>
                      {s.active ? 'Active' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
