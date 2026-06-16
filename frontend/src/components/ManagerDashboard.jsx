import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#6b7280'];

export default function ManagerDashboard({ data }) {
  const { t } = useTranslation();

  const barData = [
    { name: t('label.Fresh'), count: data.scansByLabel.Fresh },
    { name: t('label.Borderline'), count: data.scansByLabel.Borderline },
    { name: t('label.Spoiled'), count: data.scansByLabel.Spoiled },
  ];

  const statusCounts = { active: 0, consumed: 0, wasted: 0 };
  data.expiringItems?.forEach(() => {});
  const pieData = [
    { name: t('inventory.status.active'), value: data.totalInventoryItems - data.wastedItems },
    { name: t('inventory.status.wasted'), value: data.wastedItems },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.totalScans'), value: data.totalScans },
          { label: t('dashboard.spoiledCount'), value: data.scansByLabel.Spoiled },
          { label: t('dashboard.totalInventory'), value: data.totalInventoryItems },
          { label: t('dashboard.wasteRate'), value: data.wasteRate },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-green-600">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold mb-4">{t('dashboard.scansByLabel')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold mb-4">{t('dashboard.inventoryStatus')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="font-semibold mb-4">{t('dashboard.recentScans')}</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">{t('result.foodType')}</th>
              <th className="p-2 text-left">{t('result.label')}</th>
              <th className="p-2 text-left">{t('result.confidence')}</th>
              <th className="p-2 text-left">{t('dashboard.date')}</th>
            </tr>
          </thead>
          <tbody>
            {data.recentScans.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.foodType}</td>
                <td className="p-2">{t(`label.${s.label}`)}</td>
                <td className="p-2">{s.confidence}%</td>
                <td className="p-2">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="font-semibold mb-4">{t('dashboard.expiringItems')}</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">{t('inventory.foodName')}</th>
              <th className="p-2 text-left">{t('inventory.category')}</th>
              <th className="p-2 text-left">{t('inventory.expiryDate')}</th>
            </tr>
          </thead>
          <tbody>
            {data.expiringItems.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-2">{item.foodName}</td>
                <td className="p-2">{t(`inventory.category.${item.category}`)}</td>
                <td className="p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
