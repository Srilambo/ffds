import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axiosClient';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function ConsumerDashboard({ data }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const barData = [
    { name: t('label.Fresh'), count: data.scansByLabel.Fresh },
    { name: t('label.Borderline'), count: data.scansByLabel.Borderline },
    { name: t('label.Spoiled'), count: data.scansByLabel.Spoiled },
  ];

  const pieData = [
    { name: t('inventory.status.active'), value: data.activeItems || (data.totalInventoryItems - data.wastedItems) },
    { name: t('inventory.status.consumed'), value: data.consumedItems || 0 },
    { name: t('inventory.status.wasted'), value: data.wastedItems || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-sm text-white p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold">Welcome back, {user?.name}!</h1>
          <p className="text-emerald-100 text-sm mt-2 max-w-lg">
            Track your personal kitchen freshness, minimize food waste, and check real-time sensor analysis of your products.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <p className="text-xs uppercase tracking-wider font-semibold text-emerald-200">SDG Goal 12 Target</p>
          <p className="text-xl font-bold mt-1">Responsible Consumption</p>
        </div>
      </div>

      {/* Expiry alerts banner */}
      {data.expiringItems && data.expiringItems.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
          <span className="text-xl">⏰</span>
          <div>
            <h4 className="font-bold text-sm text-amber-800">{t('inventory.expiringSoon')}</h4>
            <p className="text-xs mt-0.5 text-amber-700">
              You have {data.expiringItems.length} food items expiring in less than 2 days! Please review your pantry to avoid waste.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Scanned Foods', value: data.totalScans, icon: '🔍', color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Pantry Items', value: data.totalInventoryItems, icon: '🍎', color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Wasted Items', value: data.wastedItems, icon: '🗑️', color: 'bg-rose-50 text-rose-700' },
          { label: 'Food Waste Rate', value: data.wasteRate, icon: '📊', color: 'bg-teal-50 text-teal-700' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
              <span className={`p-1.5 rounded-lg text-sm ${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Graphical Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.scansByLabel')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Pantry Status Distribution</h3>
          <div className="h-64">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No inventory items to display. Add some items to populate this chart!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={3}
                    label
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i === 0 ? 0 : i === 1 ? 3 : 2)]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Pantry View */}
      {data.expiringItems && data.expiringItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between bg-red-50/50">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              ⚠️ {t('dashboard.expiringItems')}
            </h3>
            <span className="text-xs bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">
              Urgent Attention
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b">
                <tr>
                  <th className="p-4 text-left font-medium">{t('inventory.foodName')}</th>
                  <th className="p-4 text-left font-medium">{t('inventory.category')}</th>
                  <th className="p-4 text-left font-medium">{t('inventory.expiryDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {data.expiringItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-900">{item.foodName}</td>
                    <td className="p-4 capitalize text-gray-500">{t(`inventory.category.${item.category}`)}</td>
                    <td className="p-4 text-red-600 font-bold">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Scans View */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-lg">{t('dashboard.recentScans')}</h3>
        </div>
        <div className="overflow-x-auto">
          {data.recentScans && data.recentScans.length === 0 ? (
            <p className="p-6 text-center text-gray-400 text-sm">
              No recent scans found. Head over to the Scan tab to check food freshness!
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b">
                <tr>
                  <th className="p-4 text-left font-medium">{t('result.foodType')}</th>
                  <th className="p-4 text-left font-medium">{t('result.label')}</th>
                  <th className="p-4 text-left font-medium">{t('result.confidence')}</th>
                  <th className="p-4 text-left font-medium">{t('dashboard.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {data.recentScans.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-900">{s.foodType}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        s.label === 'Fresh' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        s.label === 'Borderline' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {t(`label.${s.label}`)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{s.confidence}%</td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
