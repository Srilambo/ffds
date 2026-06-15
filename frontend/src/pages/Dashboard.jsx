import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from '../components/ManagerDashboard';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'manager') return;
    api.get('/manager/dashboard')
      .then(({ data: d }) => setData(d))
      .catch(() => setError(t('dashboard.error')))
      .finally(() => setLoading(false));
  }, [user, t]);

  if (user?.role !== 'manager') {
    return <Navigate to="/scan" replace />;
  }

  if (loading) return <p>{t('common.loading')}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return <ManagerDashboard data={data} />;
}
