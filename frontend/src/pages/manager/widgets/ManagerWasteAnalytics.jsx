import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className={`glass bg-gradient-to-br ${color} border p-5 rounded-2xl flex flex-col justify-between space-y-2 card-hover transition-all`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>{icon}</span> {title}
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        {sub && <p className="text-[10px] opacity-70 mt-0.5 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

export function ManagerWasteAnalytics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/manager/waste-analytics', { params: { period } });
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [period]);

  if (loading) {
    return (
      <div className="glass p-8 rounded-2xl animate-pulse space-y-4">
        <div className="h-8 w-1/3 bg-white/10 rounded" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📉</span> Waste Financial Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Weekly and monthly financial loss trends with downloadable compliance PDF report.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
          {['weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                period === p ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon="💰"
          title="Total Waste Cost"
          value={formatCurrency(data?.totalCost || 0)}
          sub="All logged spoilage losses"
          color="from-red-600/20 via-red-700/15 to-red-900/20 border-red-500/30 text-red-300"
        />
        <StatCard
          icon="📦"
          title="Highest Loss Item"
          value={data?.mostWastedItem?.name || 'N/A'}
          sub={`${formatCurrency(data?.mostWastedItem?.cost || 0)} total financial loss`}
          color="from-amber-600/20 via-amber-700/15 to-amber-900/20 border-amber-500/30 text-amber-300"
        />
        <StatCard
          icon="📊"
          title="Analytics Scope"
          value={period.charAt(0).toUpperCase() + period.slice(1)}
          sub={`${data?.labels?.length || 0} period intervals tracked`}
          color="from-blue-600/20 via-blue-700/15 to-blue-900/20 border-blue-500/30 text-blue-300"
        />
      </div>

      {/* Interactive Recharts Chart */}
      <div className="glass p-6 rounded-2xl space-y-4 border border-white/10">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📈</span> Financial Loss Trend ({period.charAt(0).toUpperCase() + period.slice(1)})
        </h3>
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.labels?.map((l, i) => ({ label: l, value: data.values[i] })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="label" stroke="#ffffff60" fontSize={11} tickMargin={10} />
              <YAxis stroke="#ffffff60" fontSize={11} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Waste Cost']}
                contentStyle={{ backgroundColor: '#161b27', border: '1px solid #253044', borderRadius: '12px' }}
              />
              <Bar dataKey="value" fill="url(#wasteGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.15} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PDF Export Banner */}
      <div className="glass p-6 rounded-2xl text-center border border-brand-500/30 bg-brand-500/10 space-y-3">
        <p className="text-white font-bold text-base">Download Enterprise Waste Audit Report</p>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Generate an official compliance-ready PDF report detailing all financial loss records for executive presentation.
        </p>
        <a
          href="/api/manager/waste-report/pdf"
          className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-xs"
        >
          📄 Export PDF Report
        </a>
      </div>
    </div>
  );
}
export default ManagerWasteAnalytics;
