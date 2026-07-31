import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';

import DriverStatsWidget from './widgets/DriverStatsWidget';
import DriverDeliveriesWidget from './widgets/DriverDeliveriesWidget';
import DriverProfileWidget from './widgets/DriverProfileWidget';

export function DriverDashboardPage() {
  const { socket } = useSocket();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('deliveries'); // 'dashboard', 'deliveries', 'profile'

  useEffect(() => {
    if (location.pathname.includes('/profile')) {
      setActiveTab('profile');
    } else if (location.pathname.includes('/deliveries')) {
      setActiveTab('deliveries');
    } else if (location.pathname.includes('/dashboard')) {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const loadDashboard = async () => {
    try {
      const { data: res } = await api.get('/driver/dashboard');
      setData(res);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load driver dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Refresh interval every 15s
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  // Listen to socket order status updates
  useEffect(() => {
    if (!socket) return;
    socket.on('order_status_update', () => {
      loadDashboard();
    });
    socket.on('new_order', () => {
      loadDashboard();
    });
    return () => {
      socket.off('order_status_update');
      socket.off('new_order');
    };
  }, [socket]);

  const handleUpdateStatus = async (orderId, newStatus, otp) => {
    try {
      await api.patch(`/driver/orders/${orderId}/status`, { status: newStatus, otp });
      await loadDashboard();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update delivery status';
      return { success: false, error: msg };
    }
  };

  const handleDutyToggle = async (newDutyStatus) => {
    try {
      await api.patch('/driver/status', { driverStatus: newDutyStatus });
      loadDashboard();
    } catch (err) {
      alert('Failed to update duty status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <span className="spinner h-10 w-10 text-amber-400" />
        <p className="text-xs text-slate-400 font-semibold">Loading Driver Portal…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Top Banner Stats */}
      <DriverStatsWidget
        stats={data?.stats}
        driver={data?.driver}
        manager={data?.manager}
        onStatusToggle={handleDutyToggle}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📊 Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'deliveries'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🚚 My Deliveries</span>
          {data?.stats?.activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {data.stats.activeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>👤 Profile & Vehicle Settings</span>
        </button>

        <button
          onClick={loadDashboard}
          className="ml-auto p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
          title="Refresh Data"
        >
          🔄
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'profile' ? (
        <DriverProfileWidget
          driver={data?.driver}
          manager={data?.manager}
          onUpdateProfile={loadDashboard}
        />
      ) : (
        <DriverDeliveriesWidget
          orders={data?.recentOrders}
          onUpdateStatus={handleUpdateStatus}
          loading={loading}
        />
      )}
    </div>
  );
}

export default DriverDashboardPage;
