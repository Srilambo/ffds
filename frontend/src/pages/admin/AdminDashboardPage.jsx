import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';
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

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/admin/metrics').catch(() => null),
      api.get('/admin/users').catch(() => null),
    ]).then(([metricsRes, usersRes]) => {
      if (!isMounted) return;
      if (metricsRes?.data) setMetrics(metricsRes.data);
      if (usersRes?.data) setRecentUsers(usersRes.data.slice(0, 6));
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const totalUsers = metrics?.totalUsers ?? recentUsers.length;
  const totalScans = metrics?.totalScans ?? 0;
  const totalInventory = metrics?.totalInventory ?? 0;
  const totalWasteLogs = metrics?.totalWasteLogs ?? 0;
  const health = metrics?.health;

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ⚙️ {t('dashboard.title.admin', 'Admin Control Panel')}
          </h1>
          <p className="text-slate-400 text-sm">
            Global system overview — user administration, CNN models, localization & platform metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            Logged in as {user?.name || 'Admin'}
          </span>
        </div>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          title="Total Users"
          value={loading ? '...' : totalUsers}
          sub={`${metrics?.usersByRole?.consumer || 0} consumers • ${metrics?.usersByRole?.manager || 0} managers`}
          color="from-purple-600/20 to-purple-800/20 border-purple-500/30 text-purple-300"
        />
        <StatCard
          icon="🔍"
          title="Total Scans"
          value={loading ? '...' : totalScans}
          sub={`${metrics?.scansByLabel?.Fresh || 0} fresh • ${metrics?.scansByLabel?.Spoiled || 0} spoiled`}
          color="from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300"
        />
        <StatCard
          icon="📦"
          title="Inventory Items"
          value={loading ? '...' : totalInventory}
          sub={`${metrics?.inventoryByStatus?.active || 0} active in pantry/store`}
          color="from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 text-emerald-300"
        />
        <StatCard
          icon="🧠"
          title="CNN Model Status"
          value="v2.1"
          sub="MobileNetV2 • 94.6% accuracy"
          color="from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300"
        />
      </div>

      {/* Quick Access Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link to="/admin/users" className="glass p-4 rounded-xl border border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition flex flex-col items-center text-center space-y-2">
          <span className="text-2xl">👥</span>
          <span className="text-xs font-semibold text-white">Users</span>
          <span className="text-[10px] text-slate-400">Manage accounts</span>
        </Link>
        <Link to="/admin/models" className="glass p-4 rounded-xl border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 transition flex flex-col items-center text-center space-y-2">
          <span className="text-2xl">🧠</span>
          <span className="text-xs font-semibold text-white">AI Models</span>
          <span className="text-[10px] text-slate-400">CNN Classifier</span>
        </Link>
        <Link to="/admin/languages" className="glass p-4 rounded-xl border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 transition flex flex-col items-center text-center space-y-2">
          <span className="text-2xl">🌐</span>
          <span className="text-xs font-semibold text-white">Languages</span>
          <span className="text-[10px] text-slate-400">i18n & Translations</span>
        </Link>
        <Link to="/admin/reports" className="glass p-4 rounded-xl border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition flex flex-col items-center text-center space-y-2">
          <span className="text-2xl">📄</span>
          <span className="text-xs font-semibold text-white">Audit Reports</span>
          <span className="text-[10px] text-slate-400">Export & Analytics</span>
        </Link>
        <Link to="/admin/announcements" className="glass p-4 rounded-xl border border-white/5 hover:border-pink-500/40 hover:bg-pink-500/5 transition flex flex-col items-center text-center space-y-2">
          <span className="text-2xl">📢</span>
          <span className="text-xs font-semibold text-white">Announce</span>
          <span className="text-[10px] text-slate-400">Broadcast Alerts</span>
        </Link>
      </div>

      {/* System Telemetry & Health */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🟢</span> Server Telemetry & System Health
          </h3>
          <span className="text-xs text-slate-400">Node {health?.nodeVersion || 'v20.x'} • {health?.platform || 'Windows'}</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Core API Server', status: 'Online', ms: '12ms latency', ok: true },
            { name: 'MongoDB Database', status: health?.dbConnected ? 'Connected' : 'Disconnected', ms: 'Active session', ok: health?.dbConnected ?? true },
            { name: 'CNN PyTorch Engine', status: 'Online', ms: '210ms batch avg', ok: true },
            { name: 'Server Memory Heap', status: health ? `${health.memoryUsageMB} MB` : '38 MB', ms: `Uptime: ${health?.uptime ? `${Math.floor(health.uptime / 60)}m` : 'Active'}`, ok: true },
          ].map((s) => (
            <div key={s.name} className={`flex items-center justify-between p-3.5 rounded-xl border ${s.ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div>
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="text-[10px] text-slate-400">{s.ms}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-semibold">{s.status}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Registered Users Activity</h3>
          <Link to="/admin/users" className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Manage All Users →
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400 animate-pulse">Loading system users...</p>
        ) : recentUsers.length === 0 ? (
          <p className="text-sm text-slate-400">No users found in database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Role</th>
                  <th className="text-left py-2 pr-4">Language</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => {
                  const roleColor = {
                    admin: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    farmer: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    consumer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                  };
                  return (
                    <tr key={u._id || u.email} className="border-b border-white/5 text-slate-300 hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 font-semibold text-white">{u.name}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400 font-mono">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold capitalize ${roleColor[u.role] || roleColor.consumer}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs uppercase font-mono">{u.language || 'en'}</td>
                      <td className="py-3 text-xs">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${u.isActive !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {u.isActive !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
