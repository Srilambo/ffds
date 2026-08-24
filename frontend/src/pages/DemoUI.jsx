import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample Dataset for AI Scanner Simulator
const SAMPLE_FOODS = [
  {
    id: 'tomatoes',
    name: 'Overripe Tomatoes',
    category: 'Produce',
    freshnessScore: 42,
    status: 'warning',
    shelfLifeDays: 2,
    spoilageRisk: 'High (Soft texture & enzymatic breakdown)',
    recommendedAction: 'Mark down by 45% or process into tomato sauce/soup',
    icon: '🍅',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
    color: '#ef4444',
  },
  {
    id: 'apples',
    name: 'Crisp Honeycrisp Apples',
    category: 'Produce',
    freshnessScore: 94,
    status: 'fresh',
    shelfLifeDays: 14,
    spoilageRisk: 'Very Low (Optimal firmness & hydration)',
    recommendedAction: 'Store in cool ambient rack (38°F - 42°F)',
    icon: '🍎',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
    color: '#22c55e',
  },
  {
    id: 'berries',
    name: 'Organic Strawberries',
    category: 'Berries',
    freshnessScore: 68,
    status: 'warning',
    shelfLifeDays: 4,
    spoilageRisk: 'Moderate (Slight surface softening)',
    recommendedAction: 'Promote in bakery combo or flash discount 25%',
    icon: '🍓',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80',
    color: '#f59e0b',
  },
  {
    id: 'bananas',
    name: 'Golden Bananas',
    category: 'Produce',
    freshnessScore: 82,
    status: 'fresh',
    shelfLifeDays: 6,
    spoilageRisk: 'Low (Sugar ripening phase starting)',
    recommendedAction: 'Ideal for raw retail display or smoothie bundles',
    icon: '🍌',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
    color: '#eab308',
  },
  {
    id: 'bread',
    name: 'Artisan Whole Wheat Sourdough',
    category: 'Bakery',
    freshnessScore: 35,
    status: 'expiring',
    shelfLifeDays: 1,
    spoilageRisk: 'Severe (Stale crust & moisture loss)',
    recommendedAction: 'Convert to garlic croutons or breadcrumbs today',
    icon: '🍞',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
    color: '#f97316',
  },
  {
    id: 'spinach',
    name: 'Baby Leaf Spinach',
    category: 'Greens',
    freshnessScore: 88,
    status: 'fresh',
    shelfLifeDays: 8,
    spoilageRisk: 'Low (Crisp leaves & full turgor pressure)',
    recommendedAction: 'Maintain sealed refrigeration (34°F)',
    icon: '🥬',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80',
    color: '#10b981',
  },
];

// Waste Analytics Demo Data
const MONTHLY_WASTE_TREND = [
  { label: 'Jan 2026', cost: 420, items: 38 },
  { label: 'Feb 2026', cost: 350, items: 29 },
  { label: 'Mar 2026', cost: 490, items: 44 },
  { label: 'Apr 2026', cost: 280, items: 22 },
  { label: 'May 2026', cost: 195, items: 17 },
  { label: 'Jun 2026', cost: 140, items: 11 },
  { label: 'Jul 2026', cost: 85, items: 7 },
];

const WEEKLY_WASTE_TREND = [
  { label: 'Week 1', cost: 45, items: 4 },
  { label: 'Week 2', cost: 30, items: 3 },
  { label: 'Week 3', cost: 25, items: 2 },
  { label: 'Week 4', cost: 15, items: 1 },
];

const CATEGORY_LOSS_PIE = [
  { name: 'Overripe Produce', value: 45, color: '#ef4444' },
  { name: 'Bakery & Grains', value: 25, color: '#f97316' },
  { name: 'Dairy & Eggs', value: 18, color: '#3b82f6' },
  { name: 'Prepared Foods', value: 12, color: '#a855f7' },
];

// Delivery Tracker Steps
const DELIVERY_STEPS = [
  { title: 'Order Confirmed', time: '08:30 AM', status: 'completed', desc: 'Batch #8041 prepared at distribution hub' },
  { title: 'Cold Storage Loaded', time: '09:15 AM', status: 'completed', desc: 'Refrigerated van temp locked at 36°F' },
  { title: 'In Transit', time: '10:05 AM', status: 'active', desc: 'Driver Alex M. en route to Market #4' },
  { title: 'Store Delivery', time: 'Estimated 10:45 AM', status: 'pending', desc: 'Final receiving check & sign-off' },
];

export default function DemoUI() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRole, setSelectedRole] = useState('manager');
  const [selectedFood, setSelectedFood] = useState(SAMPLE_FOODS[0]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [turnoverRate, setTurnoverRate] = useState(25);
  const [recipeQuery, setRecipeQuery] = useState('Overripe Tomatoes');
  const [aiRecipe, setAiRecipe] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerateRecipe = (ingredient) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiRecipe({
        title: `Zero-Waste Roasted Tomato & Basil Bisque`,
        prepTime: '20 mins',
        servings: 4,
        wasteSavingsScore: '98%',
        ingredients: [
          `${ingredient} (3-4 pieces, soft & sweet)`,
          'Fresh Basil Leaves (1/2 cup)',
          'Garlic Clove (3 minced)',
          'Olive Oil & Vegetable Broth (2 cups)',
        ],
        steps: [
          'Roast soft tomatoes at 400°F for 15 minutes to intensify natural sugars.',
          'Sauté minced garlic in olive oil until golden.',
          'Blend roasted tomatoes, sautéed garlic, and vegetable broth until smooth.',
          'Simmer for 8 minutes, season with salt/pepper, and garnish with fresh basil.',
        ],
        storageTip: 'Can be refrigerated for up to 5 days or frozen for 3 months.',
      });
      setIsAnalyzing(false);
    }, 600);
  };

  const calculateSavings = () => {
    const currentCost = 85;
    return Math.round((currentCost * turnoverRate) / 100 * 12);
  };

  const filteredInventory = SAMPLE_FOODS.filter((item) => {
    if (inventoryFilter === 'all') return true;
    return item.status === inventoryFilter;
  });

  return (
    <div className="min-h-screen bg-mesh text-slate-100 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="glass p-6 sm:p-8 rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-900/40 via-surface-2 to-surface-3 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-3 uppercase tracking-wider">
              <span>⚡ Interactive Demo Showcase</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Food Freshness AI <span className="gradient-text">Frontend Demo</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Explore the full interactive capability of FFDS across role workflows: AI Spoilage Scanner, Financial Analytics, Smart Inventory, Cold-Chain Tracking, and AI Waste Prevention.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-all shadow-sm"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-glow px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-all"
            >
              Launch Live App 🚀
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-white/10">
          {[
            { id: 'overview', label: '🌐 System Overview', icon: '✨' },
            { id: 'scanner', label: '📸 AI Vision Scanner', icon: '🧠' },
            { id: 'analytics', label: '📉 Financial Waste Analytics', icon: '📊' },
            { id: 'inventory', label: '🍎 Smart Pantry & Stock', icon: '📦' },
            { id: 'logistics', label: '🚚 Driver Delivery Tracker', icon: '📍' },
            { id: 'assistant', label: '🤖 AI Recipe Assistant', icon: '🍳' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 border border-brand-400/50 scale-[1.02]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 fade-up">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span>🎭</span> Multi-Role Workflow Switcher
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { role: 'manager', title: 'Retail / Store Manager', badge: '💼 Operations & Yield', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300', desc: 'Track store spoilage loss, automate markdown prices, oversee driver shipments, and export compliance reports.', link: '/manager/dashboard' },
                { role: 'consumer', title: 'Household Consumer', badge: '🍏 Pantry & Meal AI', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', desc: 'Scan grocery items, track shelf expiry, receive notification alerts, and generate zero-waste recipes.', link: '/consumer/pantry' },
                { role: 'admin', title: 'System Administrator', badge: '⚡ Platform Control', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300', desc: 'Manage AI model versions, language translations, multi-store governance, and global audit logs.', link: '/admin/dashboard' },
                { role: 'driver', title: 'Cold-Chain Delivery Driver', badge: '🚚 Route Logistics', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300', desc: 'View assigned store deliveries, log ambient temperature telemetry, and update status in real-time.', link: '/driver/dashboard' },
              ].map((card) => (
                <div
                  key={card.role}
                  onClick={() => setSelectedRole(card.role)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all space-y-3 relative ${
                    selectedRole === card.role ? 'border-brand-400 bg-white/10 shadow-xl ring-2 ring-brand-500/40' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${card.color}`}>
                    {card.badge}
                  </span>
                  <h3 className="text-base font-extrabold text-white">{card.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
