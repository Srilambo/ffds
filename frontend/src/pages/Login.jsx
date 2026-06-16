import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user?.language) i18n.changeLanguage(data.user.language);
      login(data.token, data.user);
      const dest =
        data.user?.role === 'admin'
          ? '/admin/dashboard'
          : data.user?.role === 'manager'
          ? '/manager/dashboard'
          : data.user?.role === 'farmer'
          ? '/farmer/dashboard'
          : '/home';
      navigate(dest);
    } catch {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 glass overflow-hidden shadow-2xl fade-up">

        {/* ── Left panel ── */}
        <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-900/60 to-surface-3">
          <div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-8">
              <span className="text-white text-xl font-black">FF</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Food Freshness<br />
              <span className="gradient-text">Detection System</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              AI-powered food quality analysis combining CNN vision models with gas sensor data — helping reduce food waste globally.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🔬', label: 'CNN Image Classification' },
              { icon: '🌡️', label: 'Multi-Gas Sensor Analysis' },
              { icon: '🤖', label: 'Gemini AI Chatbot' },
              { icon: '📊', label: 'Inventory & Waste Tracking' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-base">{icon}</span>
                {label}
              </div>
            ))}
            <p className="text-xs text-slate-600 pt-2">UN SDG Goal 12 — Responsible Consumption & Production</p>
          </div>

          {/* Decorative gradient orb */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        </div>

        {/* ── Right panel (form) ── */}
        <div className="flex flex-col justify-center p-8 md:p-10 bg-surface-2/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">{t('auth.login')}</h2>
            <p className="text-slate-500 text-sm">Welcome back — sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('auth.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark w-full px-4 py-3 text-sm"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full px-4 py-3 pr-12 text-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><span className="spinner" /> Signing in…</> : t('auth.login')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
