import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#3b82f6'];

export default function AdminDashboard({ metrics }) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingScans, setLoadingScans] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success');

  // Load Admin detailed lists (users & scans)
  useEffect(() => {
    api.get('/admin/users')
      .then((res) => {
        setUsers(res.data);
        setLoadingUsers(false);
      })
      .catch((err) => console.error('Failed to load users', err));

    api.get('/admin/scans')
      .then((res) => {
        setScans(res.data);
        setLoadingScans(false);
      })
      .catch((err) => console.error('Failed to load scans', err));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: data.user.role } : u)));
      showStatus(t('dashboard.roleUpdated'), 'success');
    } catch (err) {
      showStatus(err.response?.data?.error || t('common.error'), 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure you want to delete this user? This will remove all their scans and inventory.'))) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      setScans(scans.filter((s) => s.userId?._id !== userId));
      showStatus(t('dashboard.userDeleted'), 'success');
    } catch (err) {
      showStatus(err.response?.data?.error || t('common.error'), 'error');
    }
  };

  const showStatus = (msg, type) => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  // CSV Exporter helper
  const triggerCSVExport = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Language', 'Created At'];
    const rows = users.map((u) => [
      u._id,
      u.name,
      u.email,
      u.role,
      u.language,
      u.createdAt
    ]);
    triggerCSVExport('ffds_users_report.csv', headers, rows);
  };

  const exportScansCSV = () => {
    const headers = ['Scan ID', 'User Name', 'User Email', 'Food Type', 'Freshness', 'Confidence %', 'NH3 (ppm)', 'H2S (ppm)', 'Ethylene (ppm)', 'Created At'];
    const rows = scans.map((s) => [
      s._id,
      s.userId?.name || 'Deleted User',
      s.userId?.email || 'N/A',
      s.foodType,
      s.label,
      s.confidence,
      s.gasReadings?.nh3,
      s.gasReadings?.h2s,
      s.gasReadings?.ethylene,
      s.createdAt
    ]);
    triggerCSVExport('ffds_scans_report.csv', headers, rows);
  };

  // Prepare Chart Data
  const roleChartData = [
    { name: t('auth.role.consumer'), value: metrics.usersByRole.consumer },
    { name: t('auth.role.manager'), value: metrics.usersByRole.manager },
    { name: t('auth.role.admin'), value: metrics.usersByRole.admin },
  ].filter(d => d.value > 0);

  const scanChartData = [
    { name: t('label.Fresh'), count: metrics.scansByLabel.Fresh },
    { name: t('label.Borderline'), count: metrics.scansByLabel.Borderline },
    { name: t('label.Spoiled'), count: metrics.scansByLabel.Spoiled },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">
            {t('dashboard.title.admin')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            System overview, operational metrics, user administration and reports.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportUsersCSV}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition shadow"
          >
            {t('dashboard.exportUsers')}
          </button>
          <button
            onClick={exportScansCSV}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shadow"
          >
            {t('dashboard.exportScans')}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-md text-sm border font-medium ${
          statusType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.totalScans'), value: metrics.totalScans, icon: '🔍', color: 'from-blue-500 to-cyan-500' },
          { label: t('dashboard.spoiledCount'), value: metrics.scansByLabel.Spoiled, icon: '⚠️', color: 'from-amber-500 to-red-500' },
          { label: 'Registered Users', value: metrics.totalUsers, icon: '👥', color: 'from-indigo-500 to-purple-500' },
          { label: 'Pantry Items Tracked', value: metrics.totalInventory, icon: '🍎', color: 'from-emerald-500 to-teal-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between hover:shadow-md transition">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${card.color} text-white flex items-center justify-center text-xl shadow-sm`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.scansByLabel')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scanChartData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(22, 163, 74, 0.05)' }} />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]}>
                  {scanChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Users Role Distribution</h3>
          <div className="h-64 flex flex-col justify-between">
            <div className="h-4/5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                    paddingAngle={3}
                    label
                  >
                    {roleChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-lg">{t('dashboard.systemUsers')}</h3>
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            {users.length} active users
          </span>
        </div>
        <div className="overflow-x-auto">
          {loadingUsers ? (
            <p className="p-6 text-center text-gray-500">{t('common.loading')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b">
                <tr>
                  <th className="p-4 text-left font-medium">User Details</th>
                  <th className="p-4 text-left font-medium">Access Role</th>
                  <th className="p-4 text-left font-medium">Language</th>
                  <th className="p-4 text-left font-medium">Joined Date</th>
                  <th className="p-4 text-center font-medium">{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-gray-400 text-xs">{u.email}</div>
                    </td>
                    <td className="p-4">
                      {u._id === currentUser._id ? (
                        <span className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs capitalize">
                          {u.role} (You)
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="border rounded bg-white text-xs px-2 py-1 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="consumer">Consumer (Regular)</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="p-4 text-xs font-medium uppercase text-gray-500">
                      {u.language}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={u._id === currentUser._id}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-30 px-2 py-1 rounded hover:bg-red-50"
                      >
                        {t('dashboard.deleteUser')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Global System Scan Logs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-lg">{t('dashboard.allScans')}</h3>
          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
            {scans.length} total scans
          </span>
        </div>
        <div className="overflow-x-auto">
          {loadingScans ? (
            <p className="p-6 text-center text-gray-500">{t('common.loading')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Scanned Food</th>
                  <th className="p-4 text-left font-medium">User</th>
                  <th className="p-4 text-left font-medium">Freshness</th>
                  <th className="p-4 text-left font-medium">Gas Sensor Readings</th>
                  <th className="p-4 text-left font-medium">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {scans.slice(0, 25).map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 flex items-center gap-3">
                      {s.imageUrl && (
                        <img
                          src={s.imageUrl.startsWith('/') ? `${api.defaults.baseURL || ''}${s.imageUrl}` : s.imageUrl}
                          alt={s.foodType}
                          className="h-10 w-10 object-cover rounded shadow-sm border"
                          onError={(e) => { e.target.src = 'https://placehold.co/40x40?text=Food' }}
                        />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{s.foodType}</div>
                        <div className="text-gray-400 text-xs">Confidence: {s.confidence}%</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{s.userId?.name || 'Deleted User'}</div>
                      <div className="text-xs text-gray-400">{s.userId?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        s.label === 'Fresh' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        s.label === 'Borderline' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {t(`label.${s.label}`)}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-500">
                      NH3: {s.gasReadings?.nh3} ppm | H2S: {s.gasReadings?.h2s} ppm | C2H4: {s.gasReadings?.ethylene} ppm
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Backend Health Diagnostics */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-gray-800 text-lg border-b pb-3 mb-4">{t('dashboard.healthStatus')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400 block text-xs uppercase font-medium">API Server Status</span>
            <span className="inline-flex items-center gap-1.5 mt-1 font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Online
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-medium">Database Connection</span>
            <span className="font-semibold text-gray-800 mt-1 block">Mongoose Connected</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-medium">Uptime</span>
            <span className="font-semibold text-gray-800 mt-1 block">{(metrics.health?.uptime / 3600).toFixed(2)} hours</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-medium">Runtime</span>
            <span className="font-semibold text-gray-800 mt-1 block font-mono text-xs">{metrics.health?.nodeVersion || 'Node.js'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
