import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosClient';

function StatCard({ icon, title, value, sub, color, badge }) {
  return (
    <div className={`glass bg-gradient-to-br ${color} border p-5 rounded-2xl flex flex-col justify-between space-y-3 card-hover transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span className="text-base">{icon}</span> {title}
        </div>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-white/10 text-white border border-white/10">
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        {sub && <p className="text-[11px] opacity-70 mt-1 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export default function ManagerDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/manager/dashboard');
        setData(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 fade-up">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-6 rounded-2xl animate-pulse space-y-3">
              <div className="h-4 w-1/3 bg-white/10 rounded" />
              <div className="h-8 w-1/2 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <p className="text-sm font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📊</span> Business Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="text-white font-bold">{user?.name}</span> — live stock, spoilage risks, & AI diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/manager/scan"
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2"
          >
            <span>🔍 New Audit Scan</span>
          </Link>
          <Link
            to="/manager/inventory"
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-semibold hover:bg-white/5 transition-all"
          >
            <span>🍎 Manage Stock</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          title="Total Stock"
          value={data?.totalItems || 0}
          sub="Active inventory items"
          color="from-blue-600/20 via-blue-700/15 to-blue-900/20 border-blue-500/30 text-blue-300"
          badge="Live"
        />
        <StatCard
          icon="⚠️"
          title="Expiring (2 Days)"
          value={data?.expiringSoon || 0}
          sub="Action required"
          color="from-amber-600/20 via-amber-700/15 to-amber-900/20 border-amber-500/30 text-amber-300"
          badge="Urgent"
        />
        <StatCard
          icon="💸"
          title="Monthly Waste"
          value={formatCurrency(data?.wasteCostThisMonth || 0)}
          sub={data?.wasteCostThisMonth ? 'Tracked waste loss' : 'No loss logged'}
          color="from-red-600/20 via-red-700/15 to-red-900/20 border-red-500/30 text-red-300"
          badge="Cost"
        />
        <StatCard
          icon="🔬"
          title="Total Scans"
          value={data?.totalScans || 0}
          sub="CNN + Gas Sensor audits"
          color="from-emerald-600/20 via-emerald-700/15 to-emerald-900/20 border-emerald-500/30 text-emerald-300"
          badge="Audit"
        />
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/manager/inventory"
          className="glass p-5 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xl">
              🍎
            </div>
            <div>
              <p className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                Inventory Control
              </p>
              <p className="text-xs text-slate-400">Bulk import CSV & manage status</p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link
          to="/manager/waste"
          className="glass p-5 rounded-2xl border border-white/10 hover:border-amber-500/40 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
              📉
            </div>
            <div>
              <p className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                Waste Analytics
              </p>
              <p className="text-xs text-slate-400">Financial loss charts & PDF export</p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link
          to="/manager/chatbot"
          className="glass p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <p className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                AI Business Advisor
              </p>
              <p className="text-xs text-slate-400">Gemini inventory optimization</p>
            </div>
          </div>
          <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Recent Audit Log */}
      <div className="glass p-6 rounded-2xl space-y-4 border border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📜</span> Recent Audit Scans
          </h3>
          <Link
            to="/manager/scans"
            className="text-xs text-brand-400 hover:text-white font-semibold flex items-center gap-1"
          >
            View All Scans →
          </Link>
        </div>

        {data?.recentScans?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4">Produce</th>
                  <th className="text-left py-3 px-4">Freshness Label</th>
                  <th className="text-left py-3 px-4 font-mono">Confidence</th>
                  <th className="text-left py-3 px-4">Inspector ID</th>
                  <th className="text-left py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.recentScans.map((s) => (
                  <tr key={s._id} className="border-b border-white/5 text-slate-300 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white capitalize">{s.foodType}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          s.label === 'Fresh'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : s.label === 'Borderline'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{s.confidence}%</td>
                    <td className="py-3 px-4 font-mono text-slate-400">usr_{s.userId?.slice(-6) || 'system'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <span className="text-3xl">🔍</span>
            <p className="text-xs">No audit scans logged yet for this business.</p>
          </div>
        )}
      </div>
    </div>
  );
}