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

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ⚙️ {t('dashboard.title.admin', 'Admin Control Panel')}
          </h1>
          <p className="text-slate-400 text-sm">
            Global system overview — all users, scans, and platform health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">System Admin</span>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" title="Total Users" value="1,284" sub="Worldwide" color="from-purple-600/20 to-purple-800/20 border-purple-500/30 text-purple-300" />
        <StatCard icon="🔍" title="Scans Today" value="347" sub="+22% vs yesterday" color="from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300" />
        <StatCard icon="🌍" title="Active Countries" value="14" sub="Across 5 continents" color="from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 text-emerald-300" />
        <StatCard icon="🧠" title="CNN Model" value="v2.1" sub="94.6% accuracy" color="from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300" />
      </div>

      {/* System Health */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">🟢 System Health Status</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Core API', status: 'Online', ms: '48ms', ok: true },
            { name: 'CNN Service', status: 'Online', ms: '210ms', ok: true },
            { name: 'MongoDB Atlas', status: 'Online', ms: '32ms', ok: true },
            { name: 'Gemini API', status: 'Online', ms: '820ms', ok: true },
          ].map((s) => (
            <div key={s.name} className={`flex items-center justify-between p-3 rounded-xl border ${s.ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div>
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="text-[10px] text-slate-400">{s.ms} avg latency</p>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
            </div>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Registered Users</h3>
          <a href="/admin/users" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View All →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 pr-4">Role</th>
                <th className="text-left py-2 pr-4">Language</th>
                <th className="text-left py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Srilam B.', email: 'srilam@example.com', role: 'admin', lang: 'EN', joined: 'Today' },
                { name: 'Priya K.', email: 'priya@freshco.lk', role: 'manager', lang: 'TA', joined: 'Yesterday' },
                { name: 'Mohamed A.', email: 'moh@agri.ae', role: 'farmer', lang: 'AR', joined: 'Jun 14' },
                { name: 'Yuki T.', email: 'yuki@home.jp', role: 'consumer', lang: 'JA', joined: 'Jun 13' },
              ].map((u) => {
                const roleColor = { admin: 'text-purple-400 bg-purple-500/10 border-purple-500/20', manager: 'text-blue-400 bg-blue-500/10 border-blue-500/20', farmer: 'text-amber-400 bg-amber-500/10 border-amber-500/20', consumer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
                return (
                  <tr key={u.email} className="border-b border-white/5 text-slate-300">
                    <td className="py-2.5 pr-4 font-semibold text-white">{u.name}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${roleColor[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs">{u.lang}</td>
                    <td className="py-2.5 text-xs text-slate-500">{u.joined}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
