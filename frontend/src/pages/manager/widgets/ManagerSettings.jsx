import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axiosClient';

export function ManagerSettings() {
  const { user, updateUser } = useAuth();
  
  // User profile state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Shop details state
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  // Alert preferences
  const [alerts, setAlerts] = useState({
    expiryDays: 3,
    gasSpikeAlerts: true,
    emailNotifications: true,
    soundAlerts: false,
  });

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  // Fetch shop details for manager
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/shops/my');
        setShop(data);
      } catch {
        setShop(null);
      } finally {
        setShopLoading(false);
      }
    })();
  }, []);

  // Sync profileForm if user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true); setStatus('');
    try {
      await api.patch('/users/profile', profileForm);
      if (updateUser) updateUser({ ...user, ...profileForm });
      setStatus('✅ Account profile updated successfully!');
      setTimeout(() => setStatus(''), 4000);
    } catch (err) {
      setStatus('⚠️ ' + (err.response?.data?.error || 'Failed to update profile settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('⚠️ New passwords do not match');
      return;
    }
    setSavingPassword(true); setPasswordStatus('');
    try {
      await api.patch('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordStatus('✅ Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus(''), 4000);
    } catch (err) {
      setPasswordStatus('⚠️ ' + (err.response?.data?.error || 'Failed to change password'));
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'M';

  return (
    <div className="space-y-6 max-w-5xl mx-auto fade-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>👤</span> Manager Profile & Shop Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account credentials, role authorization, and linked shop profile details.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/manager/shop-profile"
            className="btn-glow px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2"
          >
            <span>🏪</span> Edit Shop Profile & Map Pin
          </Link>
        </div>
      </div>

      {/* Main Grid: User Profile + Shop Profile Card */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Manager Profile Summary & Edit Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* User Badge Banner */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center gap-4 relative overflow-hidden">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/20 shrink-0 border border-white/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white truncate">{user?.name || 'Manager Account'}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider">
                  {user?.role || 'MANAGER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Active Session
                </span>
                <span>•</span>
                <span>Phone: {user?.phone || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {/* Account Profile Form */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>⚙️</span> Personal Profile Details
              </h3>
              <span className="text-[10px] text-slate-400">Update account info</span>
            </div>

            {status && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold ${status.includes('⚠️') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                {status}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">Full Name *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                    placeholder="Manager Name"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input-dark w-full px-3.5 py-2.5 text-xs rounded-xl"
                  placeholder="manager@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-glow w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow"
              >
                {saving ? <><span className="spinner" /> Saving Profile...</> : '💾 Save Profile Settings'}
              </button>
            </form>
          </div>

          {/* Change Password Box */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🔒</span> Security & Password
              </h3>
            </div>

            {passwordStatus && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold ${passwordStatus.includes('⚠️') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                {passwordStatus}
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input-dark w-full px-3.5 py-2 text-xs rounded-xl"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-dark w-full px-3.5 py-2 text-xs rounded-xl"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-dark w-full px-3.5 py-2 text-xs rounded-xl"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                {savingPassword ? 'Updating Password...' : '🔑 Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Linked Shop Details Card & Quick Overview */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Shop Card */}
          <div className="glass p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🏪</span> Linked Shop Details
              </h3>
              {shop?.isVerified && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ Verified Shop
                </span>
              )}
            </div>

            {shopLoading ? (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                Loading shop details...
              </div>
            ) : shop ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Shop Name</span>
                  <h4 className="text-xl font-extrabold text-white">{shop.shopName}</h4>
                  <p className="text-xs text-slate-300">{shop.address || 'No address set'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Category</span>
                    <span className="font-bold text-white capitalize">{shop.category || 'Grocery'}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Status</span>
                    <span className={`font-bold ${shop.isOpen !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                      {shop.isOpen !== false ? '🟢 Open Now' : '🔴 Closed'}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Phone</span>
                    <span className="font-bold text-slate-200">{shop.phone || 'N/A'}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Hours</span>
                    <span className="font-bold text-slate-200">{shop.hours || '8am - 9pm'}</span>
                  </div>
                </div>

                {/* Pin location coordinates */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <span>📍</span> Map Pin Location:
                    </span>
                    <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                      {shop.location?.coordinates && (shop.location.coordinates[0] !== 0 || shop.location.coordinates[1] !== 0)
                        ? `${shop.location.coordinates[1].toFixed(4)}, ${shop.location.coordinates[0].toFixed(4)}`
                        : 'Default (Jaffna)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Pin marker is visible to consumers on the main interactive store map.
                  </p>
                </div>

                {/* Stock summary */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Consumer Stock Products:</span>
                    <span className="text-cyan-300 font-bold">{shop.stockSummary?.length || 0} Products</span>
                  </div>
                  {shop.stockSummary && shop.stockSummary.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {shop.stockSummary.map((item, idx) => (
                        <span key={idx} className="text-[10px] px-2.5 py-1 rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30 font-medium">
                          🛍️ {item.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No shop products linked yet.</p>
                  )}
                </div>

                <Link
                  to="/manager/shop-profile"
                  className="btn-glow w-full py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 block text-center shadow-glow"
                >
                  <span>✏️</span> Manage Shop Profile & Products
                </Link>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="text-4xl">🏪</div>
                <p className="text-white font-bold text-sm">No Shop Profile Created Yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Set up your business shop pin location, hours, and consumer products.
                </p>
                <Link
                  to="/manager/shop-profile"
                  className="btn-glow px-4 py-2.5 rounded-xl text-white font-bold text-xs inline-flex items-center gap-2"
                >
                  <span>🚀</span> Create Shop Profile Now
                </Link>
              </div>
            )}
          </div>

          {/* Manager Notification Preferences Card */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🔔</span> Notification Preferences
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-white">Gas Sensor Spike Alerts</p>
                  <p className="text-[10px] text-slate-400">Receive alerts when Ethylene/NH3 exceeds threshold</p>
                </div>
                <input
                  type="checkbox"
                  checked={alerts.gasSpikeAlerts}
                  onChange={(e) => setAlerts({ ...alerts, gasSpikeAlerts: e.target.checked })}
                  className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold text-white">Stock Expiry Warning</p>
                  <p className="text-[10px] text-slate-400">Highlight items expiring within 3 days</p>
                </div>
                <input
                  type="checkbox"
                  checked={alerts.emailNotifications}
                  onChange={(e) => setAlerts({ ...alerts, emailNotifications: e.target.checked })}
                  className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ManagerSettings;
