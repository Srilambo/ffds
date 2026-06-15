import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'consumer',
    language: 'en',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      i18n.changeLanguage(form.language);
      localStorage.setItem('ffds_language', form.language);
      login(data.token, data.user);
      navigate('/scan');
    } catch {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-6">{t('auth.register')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.name')}</label>
            <input name="name" value={form.name} onChange={handleChange}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.role')}</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full border rounded px-3 py-2">
              <option value="consumer">{t('auth.role.consumer')}</option>
              <option value="manager">{t('auth.role.manager')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.language')}</label>
            <select name="language" value={form.language} onChange={handleChange}
              className="w-full border rounded px-3 py-2">
              <option value="en">{t('auth.lang.en')}</option>
              <option value="si">{t('auth.lang.si')}</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-green-600 hover:underline">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
