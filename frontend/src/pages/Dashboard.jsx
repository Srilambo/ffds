import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from '../components/ManagerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import ConsumerDashboard from '../components/ConsumerDashboard';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        if (user.role === 'admin') {
          const { data: metrics } = await api.get('/admin/metrics');
          setData(metrics);
        } else if (user.role === 'manager') {
          const { data: dashboardData } = await api.get('/manager/dashboard');
          setData(dashboardData);
        } else {
          // Consumer role - fetch scans and inventory to build client-side dashboard stats
          const [scansRes, inventoryRes] = await Promise.all([
            api.get('/scans'),
            api.get('/inventory'),
          ]);
          
          const scans = scansRes.data;
          const items = inventoryRes.data;
          
          const scansByLabel = { Fresh: 0, Borderline: 0, Spoiled: 0 };
          scans.forEach((s) => {
            if (scansByLabel[s.label] !== undefined) scansByLabel[s.label]++;
          });

          const wastedItems = items.filter((i) => i.status === 'wasted').length;
          const consumedItems = items.filter((i) => i.status === 'consumed').length;
          const activeItems = items.filter((i) => i.status === 'active').length;
          const totalInventoryItems = items.length;
          const wasteRate =
            totalInventoryItems > 0
              ? `${((wastedItems / totalInventoryItems) * 100).toFixed(1)}%`
              : '0.0%';

          const recentScans = scans.slice(0, 10).map((s) => ({
            _id: s._id,
            foodType: s.foodType,
            label: s.label,
            confidence: s.confidence,
            createdAt: s.createdAt,
          }));

          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() + 2);
          cutoff.setHours(23, 59, 59, 999);

          const expiringItems = items.filter(
            (i) => i.status === 'active' && new Date(i.expiryDate) <= cutoff
          );

          setData({
            totalScans: scans.length,
            scansByLabel,
            totalInventoryItems,
            wastedItems,
            consumedItems,
            activeItems,
            wasteRate,
            recentScans,
            expiringItems,
          });
        }
      } catch (err) {
        console.error('Dashboard data load error:', err);
        setError(t('dashboard.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, t]);

  if (loading) return <p className="p-4 text-center text-gray-600">{t('common.loading')}</p>;
  if (error) return <p className="p-4 text-center text-red-600 font-semibold">{error}</p>;
  if (!data) return null;

  if (user?.role === 'admin') {
    return <AdminDashboard metrics={data} />;
  }
  if (user?.role === 'manager') {
    return <ManagerDashboard data={data} />;
  }
  return <ConsumerDashboard data={data} />;
}
