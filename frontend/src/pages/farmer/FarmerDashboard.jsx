import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosClient';

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className={`glass bg-gradient-to-br ${color} border p-5 rounded-2xl flex flex-col justify-between`}>
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</span>
      <div className="my-2">
        <span className="text-3xl font-black">{value}</span>
      </div>
      <span className="text-[10px] opacity-65">{sub}</span>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function QualityGauge({ score, label }) {
  const strokeColor = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="120" height="120">
        <circle
          cx="60" cy="60" r="45"
          stroke="#1e293b" strokeWidth="10" fill="none"
        />
        <circle
          cx="60" cy="60" r="45"
          stroke={strokeColor} strokeWidth="10" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-bold text-white">{score}%</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/farmer/dashboard');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">🚜 {t('nav.dashboard', 'Farmer Dashboard')}</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time harvest batch quality analysis & crop valuation.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Harvest Mode Active</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          title="Today's Batches"
          value={data?.totalBatches || 0}
          sub={`${data?.totalScans || 0} total crop scans`}
          color="from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300"
        />
        <StatCard
          icon="⭐"
          title="Avg Batch Quality"
          value={`${data?.avgQualityScore || 0}%`}
          sub={data?.avgQualityScore >= 80 ? 'Grade A Premium' : data?.avgQualityScore >= 50 ? 'Grade B Standard' : 'Needs Improvement'}
          color="from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 text-emerald-300"
        />
        <StatCard
          icon="💰"
          title="Estimated Crops Value"
          value={formatCurrency(data?.recentBatches?.reduce((sum, b) => sum + (b.estimatedValue || 0), 0) || 0)}
          sub="Based on current freshness"
          color="from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300"
        />
        <StatCard
          icon="🗑️"
          title="Post-Harvest Waste"
          value="—"
          sub="Track in Loss Tracker"
          color="from-red-600/20 to-red-800/20 border-red-500/30 text-red-300"
        />
      </div>

      {/* Quality Gauge & Recent Batches */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl md:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-white">Current Batch Quality</h3>
          <QualityGauge 
            score={data?.recentBatches?.[0]?.qualityScore || 0} 
            label="Quality Score" 
          />
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            {data?.recentBatches?.[0] && (
              <>
                <p className="text-sm font-semibold text-white">
                  {data.recentBatches[0].batchName} ({data.recentBatches[0].foodType})
                </p>
                <p className="text-xs text-slate-400">
                  {data.recentBatches[0].freshCount} Fresh · {data.recentBatches[0].borderlineCount} Borderline · {data.recentBatches[0].spoiledCount} Spoiled
                </p>
                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold border ${
                  (data.recentBatches[0].qualityScore || 0) >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  (data.recentBatches[0].qualityScore || 0) >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                  'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>
                  {data?.recommendation || 'No batches yet'}
                </span>
              </>
            )}
            {!data?.recentBatches?.[0] && (
              <p className="text-slate-500 text-center py-8">No batches scanned yet. Go to Batch Scan to start.</p>
            )}
          </div>
        </div>

        {/* Recent Batches */}
        <div className="glass p-6 rounded-2xl md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white">Recent Harvest Batches</h3>
          {data?.recentBatches?.length > 0 ? (
            <div className="space-y-3">
              {data.recentBatches.map((b) => (
                <div key={b._id} className="p-3 rounded-xl border border-white/5 bg-white/2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{b.batchName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      b.qualityScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      b.qualityScore >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {b.qualityScore >= 80 ? '🟢 Sell Now' : b.qualityScore >= 50 ? '🟡 Sell Soon' : '🔴 Hold/Discount'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {b.foodType} · Quality: {b.qualityScore}% · {b.totalItems} items · {formatCurrency(b.estimatedValue)} {b.currency}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No batches yet. Start your first batch scan!</p>
          )}
        </div>
      </div>
    </div>
  );
}