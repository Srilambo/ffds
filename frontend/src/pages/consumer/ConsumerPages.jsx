import React from 'react';

function PlaceholderPage({ icon, title, description, accent = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 border-brand-500/30 bg-brand-500/10',
    green: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 fade-up">
      <div className="text-7xl mb-2">{icon}</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-slate-400 text-sm max-w-sm">{description}</p>
      <span className={`text-xs border px-3 py-1 rounded-full ${colors[accent] || colors.brand}`}>Consumer Feature</span>
    </div>
  );
}

export function ConsumerPantry() {
  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">🍎 My Pantry</h1>
        <p className="text-slate-400 text-sm mt-1">Track everything in your fridge and pantry.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {['🧊 Fridge', '🗄️ Pantry'].map((tab) => (
          <button key={tab} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all first:bg-brand-600/20 first:border-brand-500/40 first:text-brand-300">
            {tab}
          </button>
        ))}
      </div>

      {/* Sample items grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Apples', qty: '6', unit: 'pcs', days: 4, status: 'fresh' },
          { name: 'Milk 1L', qty: '2', unit: 'bottles', days: 1, status: 'expiring' },
          { name: 'Yogurt', qty: '3', unit: 'cups', days: -1, status: 'spoiled' },
          { name: 'Carrots', qty: '500', unit: 'g', days: 5, status: 'fresh' },
          { name: 'Bread Loaf', qty: '1', unit: 'loaf', days: 2, status: 'expiring' },
          { name: 'Orange Juice', qty: '1', unit: 'carton', days: 3, status: 'fresh' },
        ].map((item) => {
          const statusStyles = {
            fresh:    { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Fresh' },
            expiring: { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-500',   label: 'Expiring Soon' },
            spoiled:  { border: 'border-red-500/30',     bg: 'bg-red-500/5',     badge: 'text-red-400 bg-red-500/10 border-red-500/20',         dot: 'bg-red-500',     label: 'Spoiled' },
          };
          const s = statusStyles[item.status];
          return (
            <div key={item.name} className={`glass ${s.bg} border ${s.border} rounded-2xl p-4 space-y-3`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.qty} {item.unit}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${s.badge}`}>{s.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <span className="text-xs text-slate-400">
                  {item.days > 0 ? `Expires in ${item.days} day${item.days > 1 ? 's' : ''}` : item.days === 0 ? 'Expires today' : 'Expired'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConsumerHistory() {
  return <PlaceholderPage icon="📜" title="Scan History" description="View all past food scans with photo thumbnails, dates, freshness results, and AI chat summaries." />;
}

export function ConsumerRecipes() {
  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">🍳 Recipe Suggestions</h1>
        <p className="text-slate-400 text-sm mt-1">Recipes powered by Gemini AI using your borderline pantry items.</p>
      </div>

      <div className="glass border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 flex items-start gap-4">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-semibold text-amber-300 text-sm">Use before spoiling!</p>
          <p className="text-xs text-slate-400">These recipes are tailored to use your borderline items: Milk, Bread Loaf.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { name: 'French Toast', time: '15 min', uses: ['Bread Loaf', 'Eggs', 'Milk'], icon: '🍞' },
          { name: 'Bread Pudding', time: '45 min', uses: ['Bread Loaf', 'Milk', 'Sugar'], icon: '🍮' },
          { name: 'Milk Rice Porridge', time: '20 min', uses: ['Milk', 'Rice', 'Honey'], icon: '🥣' },
          { name: 'Banana Smoothie', time: '5 min', uses: ['Milk', 'Banana', 'Honey'], icon: '🥤' },
        ].map((r) => (
          <div key={r.name} className="glass border border-white/8 rounded-2xl p-5 space-y-3 hover:border-brand-500/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{r.icon}</span>
              <div>
                <p className="font-bold text-white group-hover:text-brand-300 transition-colors">{r.name}</p>
                <p className="text-xs text-slate-400">⏱ {r.time}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.uses.map((ing) => (
                <span key={ing} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">{ing}</span>
              ))}
            </div>
            <button className="w-full text-xs font-semibold text-brand-400 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl py-2 transition-all">
              View Full Recipe (AI-Generated)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConsumerShoppingList() {
  return <PlaceholderPage icon="📋" title="Shopping List" description="Auto-generated from low and expired pantry items. Check off items while you shop and share with family." />;
}

export function ConsumerSettings() {
  return <PlaceholderPage icon="⚙️" title="Settings & Profile" description="Update your profile, select language, manage expiry reminders, push notifications, and family sharing." />;
}
