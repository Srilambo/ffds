import { useState } from 'react';

function PageHeader({ icon, title, subtitle, children }) {
  return (
    <div className="page-header animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1>{icon} {title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

const statusStyles = {
  fresh:    { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Fresh' },
  expiring: { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-500',   label: 'Expiring Soon' },
  spoiled:  { border: 'border-red-500/30',     bg: 'bg-red-500/5',     badge: 'text-red-400 bg-red-500/10 border-red-500/20',         dot: 'bg-red-500',     label: 'Spoiled' },
};

const PANTRY_ITEMS = [
  { name: 'Apples', qty: '6', unit: 'pcs', days: 4, status: 'fresh', emoji: '🍎' },
  { name: 'Milk 1L', qty: '2', unit: 'bottles', days: 1, status: 'expiring', emoji: '🥛' },
  { name: 'Yogurt', qty: '3', unit: 'cups', days: -1, status: 'spoiled', emoji: '🫙' },
  { name: 'Carrots', qty: '500', unit: 'g', days: 5, status: 'fresh', emoji: '🥕' },
  { name: 'Bread Loaf', qty: '1', unit: 'loaf', days: 2, status: 'expiring', emoji: '🍞' },
  { name: 'Orange Juice', qty: '1', unit: 'carton', days: 3, status: 'fresh', emoji: '🧃' },
];

export function ConsumerPantry() {
  const [activeTab, setActiveTab] = useState('fridge');

  const stats = [
    { label: 'Total Items', value: '12', icon: '📦' },
    { label: 'Expiring Soon', value: '3', icon: '⚠️' },
    { label: 'Fresh', value: '8', icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🍎"
        title="My Pantry"
        subtitle="Track everything in your fridge and pantry."
      >
        <button className="btn-glow px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2">
          <span>+</span> Add Item
        </button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 animate-fade-up delay-100">
        {stats.map((s) => (
          <div key={s.label} className="stat-card text-center">
            <span className="text-xl md:text-2xl">{s.icon}</span>
            <p className="text-xl md:text-2xl font-extrabold text-white mt-1">{s.value}</p>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 animate-fade-up delay-200">
        {[
          { id: 'fridge', label: '🧊 Fridge' },
          { id: 'pantry', label: '🗄️ Pantry' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 shadow-glow/20'
                : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 stagger-children">
        {PANTRY_ITEMS.map((item) => {
          const s = statusStyles[item.status];
          return (
            <div key={item.name} className={`glass ${s.bg} border ${s.border} rounded-2xl p-4 space-y-3 card-hover`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.qty} {item.unit}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${s.badge}`}>{s.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.dot} animate-pulse`} />
                <span className="text-xs text-slate-400">
                  {item.days > 0 ? `Expires in ${item.days} day${item.days > 1 ? 's' : ''}` : item.days === 0 ? 'Expires today' : 'Expired'}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill bg-gradient-to-r ${item.status === 'fresh' ? 'from-brand-600 to-brand-400' : item.status === 'expiring' ? 'from-amber-600 to-amber-400' : 'from-red-700 to-red-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, (item.days / 7) * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const HISTORY_ITEMS = [
  { food: 'Strawberries', label: 'Fresh', confidence: 94, date: 'Today, 2:30 PM', emoji: '🍓' },
  { food: 'Banana', label: 'Borderline', confidence: 72, date: 'Yesterday', emoji: '🍌' },
  { food: 'Lettuce', label: 'Spoiled', confidence: 88, date: 'Mar 12', emoji: '🥬' },
  { food: 'Tomato', label: 'Fresh', confidence: 91, date: 'Mar 11', emoji: '🍅' },
  { food: 'Milk', label: 'Borderline', confidence: 68, date: 'Mar 10', emoji: '🥛' },
];

const labelBadge = {
  Fresh: 'badge-fresh',
  Borderline: 'badge-borderline',
  Spoiled: 'badge-spoiled',
};

export function ConsumerHistory() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="📜"
        title="Scan History"
        subtitle="Past food scans with freshness results and AI summaries."
      />

      {/* Desktop table */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden animate-fade-up delay-100">
        <table className="w-full dark-table">
          <thead>
            <tr>
              <th>Food</th>
              <th>Result</th>
              <th>Confidence</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY_ITEMS.map((item) => (
              <tr key={item.food + item.date} className="cursor-pointer">
                <td>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="font-medium text-white capitalize">{item.food}</span>
                  </span>
                </td>
                <td>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${labelBadge[item.label]}`}>
                    {item.label}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar w-20">
                      <div className="progress-fill" style={{ width: `${item.confidence}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-400">{item.confidence}%</span>
                  </div>
                </td>
                <td className="text-slate-500">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3 stagger-children">
        {HISTORY_ITEMS.map((item) => (
          <div key={item.food + item.date} className="glass rounded-2xl p-4 flex items-center gap-4 card-hover">
            <span className="text-3xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white capitalize truncate">{item.food}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${labelBadge[item.label]}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500">{item.date}</span>
                <span className="text-xs font-mono text-brand-400">{item.confidence}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RECIPES = [
  { name: 'French Toast', time: '15 min', uses: ['Bread Loaf', 'Eggs', 'Milk'], icon: '🍞', difficulty: 'Easy' },
  { name: 'Bread Pudding', time: '45 min', uses: ['Bread Loaf', 'Milk', 'Sugar'], icon: '🍮', difficulty: 'Medium' },
  { name: 'Milk Rice Porridge', time: '20 min', uses: ['Milk', 'Rice', 'Honey'], icon: '🥣', difficulty: 'Easy' },
  { name: 'Banana Smoothie', time: '5 min', uses: ['Milk', 'Banana', 'Honey'], icon: '🥤', difficulty: 'Easy' },
];

export function ConsumerRecipes() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="🍳"
        title="Recipe Suggestions"
        subtitle="AI-powered recipes using your borderline pantry items."
      />

      <div className="glass border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 md:p-5 flex items-start gap-4 animate-fade-up delay-100">
        <span className="text-2xl animate-bounce-gentle">⚠️</span>
        <div>
          <p className="font-semibold text-amber-300 text-sm">Use before spoiling!</p>
          <p className="text-xs text-slate-400 mt-0.5">Tailored for borderline items: Milk, Bread Loaf.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 stagger-children">
        {RECIPES.map((r) => (
          <div key={r.name} className="glass border border-white/8 rounded-2xl p-5 space-y-3 card-hover cursor-pointer group">
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">{r.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-white group-hover:text-brand-300 transition-colors">{r.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400">⏱ {r.time}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{r.difficulty}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.uses.map((ing) => (
                <span key={ing} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">{ing}</span>
              ))}
            </div>
            <button className="w-full text-xs font-semibold text-brand-400 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl py-2.5 transition-all">
              View Full Recipe (AI-Generated)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const SHOPPING_ITEMS = [
  { name: 'Eggs', qty: '1 dozen', reason: 'Low stock', checked: false, emoji: '🥚' },
  { name: 'Bananas', qty: '6 pcs', reason: 'Used in recipes', checked: false, emoji: '🍌' },
  { name: 'Butter', qty: '250g', reason: 'Expired', checked: true, emoji: '🧈' },
  { name: 'Spinach', qty: '1 bag', reason: 'Weekly staple', checked: false, emoji: '🥬' },
  { name: 'Chicken Breast', qty: '500g', reason: 'Meal prep', checked: false, emoji: '🍗' },
];

export function ConsumerShoppingList() {
  const [items, setItems] = useState(SHOPPING_ITEMS);

  const toggleItem = (name) => {
    setItems((prev) => prev.map((i) => i.name === name ? { ...i, checked: !i.checked } : i));
  };

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📋"
        title="Shopping List"
        subtitle="Auto-generated from low and expired pantry items."
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{checkedCount}/{items.length} done</span>
          <button className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all">
            Share
          </button>
        </div>
      </PageHeader>

      <div className="glass rounded-2xl p-4 animate-fade-up delay-100">
        <div className="progress-bar mb-4">
          <div className="progress-fill" style={{ width: `${(checkedCount / items.length) * 100}%` }} />
        </div>
        <div className="space-y-2 stagger-children">
          {items.map((item) => (
            <button
              key={item.name}
              onClick={() => toggleItem(item.name)}
              className={`w-full flex items-center gap-4 p-3 md:p-4 rounded-xl transition-all text-left ${
                item.checked
                  ? 'bg-white/[0.02] opacity-60'
                  : 'bg-white/5 hover:bg-white/8 border border-white/5'
              }`}
            >
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                item.checked ? 'bg-brand-500 border-brand-500' : 'border-slate-600'
              }`}>
                {item.checked && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${item.checked ? 'line-through text-slate-500' : 'text-white'}`}>
                  {item.name}
                </p>
                <p className="text-xs text-slate-500">{item.qty} · {item.reason}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConsumerSettings() {
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [language, setLanguage] = useState('en');

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  const sections = [
    {
      title: 'Profile',
      items: [
        { label: 'Display Name', type: 'input', value: 'John Doe', placeholder: 'Your name' },
        { label: 'Email', type: 'input', value: 'john@example.com', placeholder: 'Email address' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Language', type: 'select', value: language, options: [
          { v: 'en', l: 'English' }, { v: 'si', l: 'Sinhala' }, { v: 'ta', l: 'Tamil' },
        ]},
        { label: 'Expiry Reminders', type: 'toggle', value: reminders, onChange: setReminders },
        { label: 'Push Notifications', type: 'toggle', value: notifications, onChange: setNotifications },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="⚙️"
        title="Settings & Profile"
        subtitle="Manage your account, language, and notification preferences."
      />

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {sections.map((section, si) => (
          <div
            key={section.title}
            className="glass rounded-2xl p-5 md:p-6 space-y-4 animate-fade-up"
            style={{ animationDelay: `${(si + 1) * 100}ms` }}
          >
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{section.title}</h3>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <label className="text-sm text-slate-300 font-medium shrink-0">{item.label}</label>
                  {item.type === 'toggle' && <Toggle value={item.value} onChange={item.onChange} />}
                  {item.type === 'input' && (
                    <input
                      defaultValue={item.value}
                      placeholder={item.placeholder}
                      className="input-dark px-3 py-2 text-sm flex-1 max-w-[200px] text-right"
                    />
                  )}
                  {item.type === 'select' && (
                    <select
                      value={item.value}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="input-dark px-3 py-2 text-sm flex-1 max-w-[160px]"
                    >
                      {item.options.map((o) => (
                        <option key={o.v} value={o.v}>{o.l}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Account actions */}
        <div className="glass rounded-2xl p-5 md:p-6 space-y-4 animate-fade-up delay-300 md:col-span-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-glow flex-1 py-3 rounded-xl text-white text-sm font-semibold">
              Save Changes
            </button>
            <button className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-all">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
