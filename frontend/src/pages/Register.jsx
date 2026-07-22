import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const ROLES = [
  { value: 'consumer', label: 'Regular User',       icon: '🏠', desc: 'Scan food & manage pantry' },
  { value: 'manager',  label: 'Business / Producer', icon: '🏪', desc: 'Manage inventory, harvest batches & waste' },
  { value: 'admin',    label: 'Admin',               icon: '⚙️', desc: 'System access & control' },
];

export default function Register() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'consumer', language: 'en',
  });
  const [error,    setError]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [showPass, setShowPass]= useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      i18n.changeLanguage(form.language);
      localStorage.setItem('ffds_language', form.language);
      login(data.token, data.user);

      const dest =
        data.user.role === 'admin'
          ? '/admin/dashboard'
          : data.user.role === 'manager'
          ? '/manager/dashboard'
          : data.user.role === 'farmer'
          ? '/farmer/dashboard'
          : '/home';
      navigate(dest);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.request && !err.response) {
        setError(t('auth.serverError', 'Cannot reach server. Run npm run dev from the project root and ensure the API is on port 5000.'));
      } else {
        setError(t('auth.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register')}
      subtitle="Create your FFDS account to get started"
      variant="register"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-up delay-100">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('auth.name')}
            </label>
            <input
              id="reg-name"
              value={form.name}
              onChange={set('name')}
              className="input-dark w-full px-4 py-3 text-sm"
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('auth.email')}
            </label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              className="input-dark w-full px-4 py-3 text-sm"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div className="animate-fade-up delay-200">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              className="input-dark w-full px-4 py-3 pr-12 text-sm"
              placeholder="Min. 8 characters"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="animate-fade-up delay-300">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t('auth.role')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-300 ${
                  form.role === value
                    ? 'bg-brand-600/20 border-brand-500/50 text-white shadow-glow/30 scale-[1.02]'
                    : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/5 hover:border-white/15'
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
                <span className="text-[10px] text-slate-500 leading-tight hidden sm:block">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up delay-400">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t('auth.language')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { value: 'en', label: '🇬🇧 English' },
              { value: 'si', label: '🇱🇰 සිංහල' },
              { value: 'ta', label: '🇱🇰 தமிழ்' },
              { value: 'ar', label: '🇸🇦 العربية' },
              { value: 'fr', label: '🇫🇷 Français' },
              { value: 'ja', label: '🇯🇵 日本語' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, language: value })}
                className={`py-2 px-1.5 rounded-xl border text-xs font-medium transition-all duration-300 ${
                  form.language === value
                    ? 'bg-brand-600/20 border-brand-500/50 text-white scale-[1.02]'
                    : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm animate-shake">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          id="reg-submit"
          type="submit"
          disabled={loading}
          className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 animate-fade-up delay-500"
        >
          {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
        </button>

        <p className="text-center text-sm text-slate-500 pt-1 animate-fade-up delay-500">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            {t('auth.login')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
