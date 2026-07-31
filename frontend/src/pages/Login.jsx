import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

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
          : data.user?.role === 'manager' || data.user?.role === 'farmer'
          ? '/manager/dashboard'
          : data.user?.role === 'driver'
          ? '/driver/dashboard'
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
      title={t('auth.login')}
      subtitle="Welcome back — sign in to continue"
      variant="login"
    >
      {/* ── Login Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-fade-up delay-100">
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

        <div className="animate-fade-up delay-200">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm animate-shake">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2 animate-fade-up delay-300"
        >
          {loading ? <><span className="spinner" /> Signing in…</> : t('auth.login')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 animate-fade-up delay-400">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          {t('auth.register')}
        </Link>
      </p>
    </AuthLayout>
  );
}
