import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import ChatBot from '../../components/ChatBot';

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

// ────────────────────────────────────────────────────────────
// CONSUMER PANTRY
// ────────────────────────────────────────────────────────────
export function ConsumerPantry() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('fridge'); // 'fridge' or 'pantry'

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory', { params: { status: 'active' } });
      setItems(data);
      setError('');
    } catch (err) {
      setError('Failed to load pantry items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/inventory/${id}`, { status: newStatus });
      loadItems();
    } catch (err) {
      setError('Failed to update item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/inventory/${id}`);
      loadItems();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const filteredItems = items.filter(item => {
    const loc = (item.location || 'pantry').toLowerCase();
    return loc === activeTab;
  });

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">🍎 My Pantry</h1>
          <p className="text-slate-400 text-sm mt-1">Track everything in your fridge and pantry.</p>
        </div>
        <button 
          onClick={loadItems}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {[
          { key: 'fridge', label: '🧊 Fridge' },
          { key: 'pantry', label: '🗄️ Pantry' }
        ].map((tab) => (
          <button 
            key={tab.key} 
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="spinner h-8 w-8" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="font-semibold text-white">No active items here</p>
          <p className="text-xs mt-1">Use the Scan page to analyze and add food to your pantry.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            let status = 'fresh';
            if (daysLeft <= 0) {
              status = 'spoiled';
            } else if (daysLeft <= 2) {
              status = 'expiring';
            }

            const statusStyles = {
              fresh:    { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Fresh' },
              expiring: { border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-500',   label: 'Expiring Soon' },
              spoiled:  { border: 'border-red-500/30',     bg: 'bg-red-500/5',     badge: 'text-red-400 bg-red-500/10 border-red-500/20',         dot: 'bg-red-500',     label: 'Spoiled' },
            };
            const s = statusStyles[status];

            return (
              <div key={item._id} className={`glass ${s.bg} border ${s.border} rounded-2xl p-4 space-y-4 flex flex-col justify-between`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white text-lg capitalize">{item.foodName}</p>
                      <p className="text-xs text-slate-400">{item.quantity} {item.unit}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${s.badge}`}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <span className="text-xs text-slate-400">
                      {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}` : daysLeft === 0 ? 'Expires today' : 'Expired'}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => handleUpdateStatus(item._id, 'consumed')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all"
                  >
                    🍴 Consumed
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(item._id, 'wasted')}
                    className="flex-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all"
                  >
                    🗑️ Wasted
                  </button>
                  <button 
                    onClick={() => handleDeleteItem(item._id)}
                    className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-xs transition-all"
                    title="Delete item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONSUMER HISTORY
// ────────────────────────────────────────────────────────────
export function ConsumerHistory() {
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  const loadScans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/scans');
      setScans(data);
      setError('');
    } catch (err) {
      setError('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const labelConfig = {
    Fresh:      { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: '✅' },
    Borderline: { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: '⚠️' },
    Spoiled:    { badge: 'text-red-400 bg-red-500/10 border-red-500/20', icon: '❌' },
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">📜 Scan History</h1>
          <p className="text-slate-400 text-sm mt-1">Review all your previous freshness checks and AI reports.</p>
        </div>
        <button 
          onClick={loadScans}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="spinner h-8 w-8" />
        </div>
      ) : scans.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl">
          <p className="text-4xl mb-2">📸</p>
          <p className="font-semibold text-white">No scans recorded yet</p>
          <p className="text-xs mt-1">Head to the Scan page and scan a food item to start tracking history.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map((scan) => {
            const cfg = labelConfig[scan.label] || labelConfig.Fresh;
            return (
              <div 
                key={scan._id} 
                className="glass border border-white/10 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-all flex flex-col justify-between cursor-pointer group"
                onClick={() => setSelectedScan(scan)}
              >
                {/* Image & label overlay */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img 
                    src={scan.imageUrl} 
                    alt={scan.foodType} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className="text-xs">{cfg.icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badge.split(' ')[0]}`}>
                      {scan.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white capitalize text-base">{scan.foodType}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Confidence</p>
                      <p className="font-bold text-white font-mono">{scan.confidence}%</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    "{scan.chatbotExplanation || 'No summary available.'}"
                  </p>

                  <div className="pt-2">
                    <button 
                      className="w-full py-2 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 hover:text-white rounded-xl text-xs font-semibold border border-brand-500/20 transition-all"
                    >
                      💬 View AI Details & Chat
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Chat Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass w-full max-w-2xl my-8 rounded-2xl overflow-hidden shadow-2xl fade-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/2">
              <div>
                <h2 className="font-bold text-white text-lg capitalize flex items-center gap-2">
                  <span>{labelConfig[selectedScan.label]?.icon}</span>
                  {selectedScan.foodType} Report
                </h2>
                <p className="text-[10px] text-slate-500 font-mono">
                  Scanned on {new Date(selectedScan.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedScan(null)} 
                className="text-slate-500 hover:text-white text-2xl h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Overview strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img 
                  src={selectedScan.imageUrl} 
                  alt={selectedScan.foodType} 
                  className="rounded-xl object-cover h-48 w-full border border-white/10"
                />
                <div className="space-y-4 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Freshness Assessment</span>
                    <p className="text-3xl font-extrabold text-white capitalize flex items-center gap-2">
                      {selectedScan.label}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${labelConfig[selectedScan.label]?.badge}`}>
                        {selectedScan.confidence}% confidence
                      </span>
                    </p>
                  </div>
                  
                  {/* Gas sensor mock values */}
                  {selectedScan.gasReadings && (
                    <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">🌡️ Gas Sensor Readings</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/3 rounded-lg py-1.5 px-1">
                          <p className="text-xs text-slate-500">NH₃</p>
                          <p className="font-bold text-white font-mono text-sm">{selectedScan.gasReadings.nh3} ppm</p>
                        </div>
                        <div className="bg-white/3 rounded-lg py-1.5 px-1">
                          <p className="text-xs text-slate-500">H₂S</p>
                          <p className="font-bold text-white font-mono text-sm">{selectedScan.gasReadings.h2s} ppm</p>
                        </div>
                        <div className="bg-white/3 rounded-lg py-1.5 px-1">
                          <p className="text-xs text-slate-500">Ethylene</p>
                          <p className="font-bold text-white font-mono text-sm">{selectedScan.gasReadings.ethylene} ppm</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chatbot conversation */}
              <div className="border-t border-white/5 pt-4">
                <ChatBot scanId={selectedScan._id} initialExplanation={selectedScan.chatbotExplanation} />
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CONSUMER RECIPES (DYNAMICALLY FILTERED BY PANTRY ITEMS)
// ────────────────────────────────────────────────────────────
export function ConsumerRecipes() {
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPantry = async () => {
      try {
        const { data } = await api.get('/inventory', { params: { status: 'active' } });
        setPantryItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPantry();
  }, []);

  const recipes = [
    { name: 'French Toast', time: '15 min', uses: ['Bread', 'Milk', 'Eggs'], icon: '🍞' },
    { name: 'Bread Pudding', time: '45 min', uses: ['Bread', 'Milk', 'Sugar'], icon: '🍮' },
    { name: 'Milk Rice Porridge', time: '20 min', uses: ['Milk', 'Rice', 'Honey'], icon: '🥣' },
    { name: 'Banana Smoothie', time: '5 min', uses: ['Milk', 'Banana', 'Honey'], icon: '🥤' },
    { name: 'Apple Cinnamon Oatmeal', time: '10 min', uses: ['Apple', 'Oats', 'Milk'], icon: '🍎' },
    { name: 'Vegetable Soup', time: '30 min', uses: ['Carrots', 'Potatoes', 'Onion'], icon: '🍲' },
  ];

  // Helper to check if user has item in pantry (by name substring matching)
  const hasPantryItem = (itemName) => {
    return pantryItems.some(i => i.foodName.toLowerCase().includes(itemName.toLowerCase()));
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">🍳 Recipe Suggestions</h1>
        <p className="text-slate-400 text-sm mt-1">Recipes powered by Gemini AI using your active pantry items.</p>
      </div>

      {!loading && pantryItems.length > 0 && (
        <div className="glass border border-brand-500/20 bg-brand-500/5 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-brand-300 text-sm">Matching pantry ingredients found!</p>
            <p className="text-xs text-slate-400">
              Ingredients you currently have: {pantryItems.map(i => i.foodName).join(', ')}.
            </p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {recipes.map((r) => {
          // Count matched ingredients
          const matches = r.uses.filter(ing => hasPantryItem(ing));
          const matchPercent = Math.round((matches.length / r.uses.length) * 100);

          return (
            <div key={r.name} className="glass border border-white/8 rounded-2xl p-5 space-y-3 hover:border-brand-500/30 transition-all cursor-pointer group flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{r.icon}</span>
                  <div>
                    <p className="font-bold text-white group-hover:text-brand-300 transition-colors text-base">{r.name}</p>
                    <p className="text-xs text-slate-400">⏱ {r.time}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.uses.map((ing) => {
                    const matched = hasPantryItem(ing);
                    return (
                      <span 
                        key={ing} 
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                          matched 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold' 
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {ing} {matched ? '✓' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500">
                  {matches.length} of {r.uses.length} matching ingredients
                </span>
                <button className="text-xs font-semibold text-brand-400 hover:text-white bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl py-2 px-3.5 transition-all">
                  View Full Recipe
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConsumerShoppingList() {
  return <PlaceholderPage icon="📋" title="Shopping List" description="Auto-generated from low and expired pantry items. Check off items while you shop and share with family." />;
}

// ────────────────────────────────────────────────────────────
// CONSUMER SETTINGS / PROFILE DETAILS
// ────────────────────────────────────────────────────────────
export function ConsumerSettings() {
  const { t } = useTranslation();
  const { user, token, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language: 'en'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        language: user.language || 'en'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const { data } = await api.put('/auth/profile', formData);
      // Re-sign token & store updated profile details in AuthContext
      login(data.token, data.user);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <span className="spinner h-8 w-8" />
      </div>
    );
  }

  const languages = [
    { code: 'en', name: '🇬🇧 English' },
    { code: 'si', name: '🇱🇰 Sinhala (සිංහල)' },
    { code: 'ta', name: '🇱🇰 Tamil (தமிழ்)' },
    { code: 'ar', name: '🇸🇦 Arabic (العربية)' },
    { code: 'fr', name: '🇫🇷 French (Français)' },
    { code: 'ja', name: '🇯🇵 Japanese (日本語)' }
  ];

  return (
    <div className="space-y-6 max-w-xl mx-auto fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">👤 Profile & Account</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="glass p-6 space-y-6">
        
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-black shadow-glow">
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg capitalize">{user.name}</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
            <span className="mt-1.5 inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {user.role} role
            </span>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
              ✅ {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Language Preference</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-sm"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="spinner" /> Saving...</>
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
