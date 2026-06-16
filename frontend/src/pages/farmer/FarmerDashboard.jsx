import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FarmerDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">🚜 {t('nav.dashboard', 'Farmer Dashboard')}</h1>
          <p className="text-slate-400 text-sm">Real-time harvest batch quality analysis & crop valuation.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Harvest Mode Active</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Today's Scanned Batches", value: "12", desc: "480 total crop scans", color: "from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300" },
          { title: "Average Batch Quality", value: "94.2%", desc: "Grade A Premium", color: "from-emerald-600/20 to-emerald-800/20 border-emerald-500/30 text-emerald-300" },
          { title: "Estimated Crops Value", value: "$4,850", desc: "Based on current freshness", color: "from-amber-600/20 to-amber-800/20 border-amber-500/30 text-amber-300" },
          { title: "Post-Harvest Waste", value: "2.4%", desc: "Target below 5%", color: "from-red-600/20 to-red-800/20 border-red-500/30 text-red-300" },
        ].map((s) => (
          <div key={s.title} className={`glass bg-gradient-to-br ${s.color} border p-5 rounded-2xl flex flex-col justify-between`}>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{s.title}</span>
            <div className="my-2">
              <span className="text-3xl font-black">{s.value}</span>
            </div>
            <span className="text-[10px] opacity-65">{s.desc}</span>
          </div>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quality Chart Placeholder */}
        <div className="glass p-6 rounded-2xl md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white">Freshness Distribution Trend</h3>
          <div className="h-64 rounded-xl border border-white/5 bg-white/2 flex flex-col items-center justify-center text-slate-500 gap-2">
            <span>📊 Freshness distribution bar chart loading...</span>
            <div className="w-1/2 bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[80%]" />
            </div>
          </div>
        </div>

        {/* Sell / Not Ready Suggestions */}
        <div className="glass p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white">Harvest Actions</h3>
          <div className="space-y-3">
            {[
              { batch: "Batch #104 (Mangoes)", action: "Sell Immediately", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", detail: "Freshness score: 98% (Ethylene levels high)" },
              { batch: "Batch #103 (Carrots)", action: "Transport Cold Storage", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", detail: "Freshness score: 85% (Ethylene rising)" },
              { batch: "Batch #102 (Tomatoes)", action: "Not Ready (Wait 2 days)", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", detail: "Freshness score: 72% (Unripe/Green)" },
              { batch: "Batch #101 (Lettuce)", action: "Discard / Bio-Gas", color: "text-red-400 bg-red-500/10 border-red-500/20", detail: "Spoiled verdict: 10% (NH3 levels high)" },
            ].map((a) => (
              <div key={a.batch} className="p-3 rounded-xl border border-white/5 bg-white/2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{a.batch}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${a.color}`}>{a.action}</span>
                </div>
                <p className="text-[10px] text-slate-400">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
