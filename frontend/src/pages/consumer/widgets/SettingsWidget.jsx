import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axiosClient';
import ShoppingMapWidget from './ShoppingMapWidget';
import { SRI_LANKA_POSTAL_CODES } from './ShoppingHelpers';

export default function SettingsWidget() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    language: 'en',
    address: '',
    cardHolderName: '',
    cardNumberMasked: '',
    expiryDate: '',
  });

  const [pinPos, setPinPos] = useState([9.7833, 80.0167]);
  const [postalSearchQuery, setPostalSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        postalCode: user.postalCode || '',
        language: user.language || 'en',
        address: user.address || '',
        cardHolderName: user.cardDetails?.cardHolderName || '',
        cardNumberMasked: user.cardDetails?.cardNumberMasked || '',
        expiryDate: user.cardDetails?.expiryDate || '',
      });
      if (user.location?.coordinates && user.location.coordinates.length === 2) {
        setPinPos([user.location.coordinates[1], user.location.coordinates[0]]);
      }
    }
  }, [user]);

  const handleSelectPostalCode = (item) => {
    if (!item) return;
    setFormData((prev) => ({
      ...prev,
      postalCode: item.code,
      address: prev.address ? prev.address : `${item.name}, ${item.district}`,
    }));
    setPinPos(item.coords);
    setSuccess(`📍 Set map location to ${item.name} (${item.code}, ${item.district})! Save profile to store.`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const filteredPostalCodes = SRI_LANKA_POSTAL_CODES.filter((item) => {
    const q = postalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.code.includes(q) ||
      item.district.toLowerCase().includes(q)
    );
  });

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPinPos([pos.coords.latitude, pos.coords.longitude]);
          setSuccess('📍 Current location detected via GPS!');
          setTimeout(() => setSuccess(''), 4000);
        },
        () => setError('Unable to retrieve GPS location.')
      );
    }
  };

  const handleSearchAddressLocation = async () => {
    if (!formData.address || !formData.address.trim()) {
      setError('Please enter a street address to search on the map.');
      return;
    }
    setSearchingAddress(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address.trim()
        )}`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        setPinPos([lat, lon]);
        setSuccess(`📍 Found map location for "${formData.address}"! Save profile to store changes.`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Location not found. Try adding details like city or country (e.g. Jaffna, Sri Lanka).');
      }
    } catch {
      setError('Failed to search location.');
    } finally {
      setSearchingAddress(false);
    }
  };

  const formatCardDisplayNumber = (raw) => {
    if (!raw) return '•••• •••• •••• 4242';
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 16);
    if (!digitsOnly) {
      const cleaned = raw.replace(/[^\d•]/g, '').slice(0, 19);
      if (!cleaned) return '•••• •••• •••• 4242';
      return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    }
    return digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
  };

  const getCardBrandInfo = (raw) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('5')) {
      return { name: 'MASTERCARD', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 border-amber-500/30' };
    }
    if (digits.startsWith('3')) {
      return { name: 'AMEX', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/20 border-cyan-500/30' };
    }
    if (digits.startsWith('4')) {
      return { name: 'VISA', color: 'text-blue-400', badgeBg: 'bg-blue-500/20 border-blue-500/30' };
    }
    return { name: 'DEBIT / CREDIT', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 border-emerald-500/30' };
  };

  const cardBrand = getCardBrandInfo(formData.cardNumberMasked);

  const handleExpiryDateChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 4) raw = raw.slice(0, 4);

    let formatted = '';
    if (raw.length > 0) {
      let m = raw.slice(0, 2);
      if (raw.length === 1 && parseInt(raw[0], 10) > 1) {
        m = '0' + raw[0];
        raw = m;
      } else if (m.length === 2) {
        const monthNum = parseInt(m, 10);
        if (monthNum < 1) m = '01';
        if (monthNum > 12) m = '12';
      }
      formatted = m;
      if (raw.length > 2) {
        formatted += '/' + raw.slice(2, 4);
      } else if (raw.length === 2 && e.nativeEvent.inputType !== 'deleteContentBackward') {
        formatted += '/';
      }
    }
    setFormData((prev) => ({ ...prev, expiryDate: formatted }));
  };

  const handleCardNumberChange = (e) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 16);
    const formatted = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly;
    setFormData((prev) => ({ ...prev, cardNumberMasked: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        postalCode: formData.postalCode,
        language: formData.language,
        address: formData.address,
        location: { type: 'Point', coordinates: [pinPos[1], pinPos[0]] },
        cardDetails: {
          cardHolderName: formData.cardHolderName,
          cardNumberMasked: formData.cardNumberMasked,
          expiryDate: formData.expiryDate,
        },
      };
      const { data } = await api.put('/auth/profile', payload);
      login(data.token, data.user);
      setSuccess('Profile & delivery preferences updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-up pb-16">
      {/* Profile Hero Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-glow">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-emerald-300">
                {formData.name ? formData.name.charAt(0).toUpperCase() : '👤'}
              </div>
            </div>
            <span
              className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full text-xs font-bold shadow-md"
              title="Verified Account"
            >
              ✓
            </span>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formData.name || 'Consumer Profile'}
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                🍏 Verified Consumer
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Configure your profile details, home location pin for grocery store dispatch, and saved payment options.
            </p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <span>📧</span> {formData.email || 'No email set'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <span>🇱🇰</span> {formData.phone || 'No phone set'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-bold">
                <span>📍</span> Pin: {pinPos[0].toFixed(3)}, {pinPos[1].toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Alerts */}
        {error && (
          <div className="glass p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-up">
            <span className="text-xl">⚠️</span>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}
        {success && (
          <div className="glass p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-up shadow-glow">
            <span className="text-xl">🎉</span>
            <div className="flex-1 font-medium">{success}</div>
          </div>
        )}

        {/* Card 1: Account Details */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5 bg-slate-900/60 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-lg font-bold">
              👤
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Account & Contact Details</h3>
              <p className="text-xs text-slate-400">Personal details used for delivery invoices & notifications</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>👤</span> Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
                placeholder="e.g. S. Lambotharan"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>📧</span> Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-medium opacity-80"
                placeholder="consumer@example.com"
                disabled
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>📞</span> Mobile Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
                placeholder="+94 77 123 4567"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>🌐</span> Preferred App Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="bg-slate-950 text-white w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-white/15 font-medium"
              >
                <option value="en">English (US)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="si">Sinhala (සිංහල)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Saved Home Location & Map Picker */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5 bg-slate-900/60 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-lg font-bold">
                📍
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delivery Location & House Pin</h3>
                <p className="text-xs text-slate-400">Set exact Sri Lanka delivery pin for store dispatches</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDetectLocation}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>🎯</span> GPS Detect
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>🏠</span> Street Address / Building Details
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-dark flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
                  placeholder="e.g. 142 KKS Road, Tellippalai, Jaffna"
                />
                <button
                  type="button"
                  onClick={handleSearchAddressLocation}
                  disabled={searchingAddress}
                  className="px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0"
                  title="Find location on map"
                >
                  {searchingAddress ? '...' : '🔍 Map'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>📮</span> Postal Code / District Preset
              </label>
              <select
                value={formData.postalCode}
                onChange={(e) => {
                  const sel = SRI_LANKA_POSTAL_CODES.find((c) => c.code === e.target.value);
                  if (sel) handleSelectPostalCode(sel);
                }}
                className="bg-slate-950 text-white w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-white/15 font-medium"
              >
                <option value="">-- Select Sri Lanka District / Postal Code --</option>
                {filteredPostalCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} - {item.name} ({item.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Map Picker */}
          <ShoppingMapWidget
            userLat={pinPos[0]}
            userLng={pinPos[1]}
            onLocationSelect={(lat, lng) => setPinPos([lat, lng])}
            onEnableGps={handleDetectLocation}
            savedAddressLabel={formData.address}
            heightClass="h-72 sm:h-80"
          />
        </div>

        {/* Card 3: Saved Payment Cards */}
        <div className="glass p-6 sm:p-7 rounded-2xl border border-white/10 space-y-5 bg-slate-900/60 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-lg font-bold">
                💳
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Saved Payment Cards</h3>
                <p className="text-xs text-slate-400">Save credit/debit card for 1-click grocery checkout</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${cardBrand.badgeBg} ${cardBrand.color}`}>
              {cardBrand.name}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>👤</span> Cardholder Name
              </label>
              <input
                type="text"
                value={formData.cardHolderName}
                onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-medium"
                placeholder="e.g. S. Lambotharan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>💳</span> Card Number (Masked)
              </label>
              <input
                type="text"
                value={formData.cardNumberMasked}
                onChange={handleCardNumberChange}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-mono"
                placeholder="4532 •••• •••• 8892"
                maxLength={19}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                <span>📅</span> Expiry Date (MM/YY)
              </label>
              <input
                type="text"
                value={formData.expiryDate}
                onChange={handleExpiryDateChange}
                className="input-dark w-full px-4 py-3 text-xs sm:text-sm rounded-xl font-mono"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full bg-slate-950 animate-ping" />
                Saving Changes...
              </>
            ) : (
              <>
                <span>💾</span> Save Profile Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
