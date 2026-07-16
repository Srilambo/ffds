import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosClient';

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
        setError(err.response?.data?.error || 'Failed to load dashboard');
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
          {[1,2,3,4].map(i => (
            <div key={i} className="glass p-5 rounded-2xl animate-pulse">
              <div className="h-4 w-1/3 bg-white/10 rounded mb-2" />
              <div className="h-8 w-1/2 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 rounded-2xl border border-red-500/30 bg-red-500/10">
        <p className="text-red-400">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">📊 {t('nav.dashboard')}</h1>
          <p className="text-slate-400 text-sm mt-1">
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
        <StatCard
          icon="🍎"
          title="Total Inventory"
          value={data?.totalItems || 0}
          sub="Active stock items"
          color="from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300"
        />
        <StatCard
          icon="⚠️"
          title="Expiring (2 days)"
          value={data?.expiringSoon || 0}
          sub="Needs urgent action"
          color="from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300"
        />
        <StatCard
          icon="🗑️"
          title="Waste This Month"
          value={formatCurrency(data?.wasteCostThisMonth || 0)}
          sub={data?.wasteCostThisMonth ? 'Tracked from waste logs' : 'No waste data'}
          color="from-red-600/20 to-red-800/20 border-red-500/30 text-red-300"
        />
        <StatCard
          icon="🔍"
          title="Total Scans"
          value={data?.totalScans || 0}
          sub="All staff scans"
          color="from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 text-emerald-300"
        />
      </div>

      {/* Recent Scans */}
      <div className="glass p-6 rounded-2xl space-y-3">
        <h3 className="text-lg font-bold text-white">{t('nav.manager.scans')}</h3>
        {data?.recentScans?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                  <th className="text-left py-2 pr-4">{t('result.foodType')}</th>
                  <th className="text-left py-2 pr-4">{t('label.Fresh')}</th>
                  <th className="text-left py-2 pr-4">{t('result.confidence')}</th>
                  <th className="text-left py-2 pr-4">Scanned By</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentScans.map((s) => (
                  <tr key={s._id} className="border-b border-white/5 text-slate-300">
                    <td className="py-2.5 pr-4 font-medium text-white">{s.foodType}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.label === 'Fresh' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        s.label === 'Borderline' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {t(`label.${s.label}`)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{s.confidence}%</td>
                    <td className="py-2.5 pr-4 text-slate-400">{s.userId?.slice(-6) || 'N/A'}</td>
                    <td className="py-2.5 text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No recent scans</p>
        )}
      </div>
    </div>
  );
}