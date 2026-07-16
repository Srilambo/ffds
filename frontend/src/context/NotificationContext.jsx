import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axiosClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 60 * 1000;

function showBrowserNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'ffds-expiry',
    });
  } catch {
    // ignore unsupported environments
  }
}

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expiringItems, setExpiringItems] = useState([]);
  const [preferences, setPreferences] = useState({
    expiryReminders: true,
    pushEnabled: true,
    reminderDays: 2,
  });
  const [loading, setLoading] = useState(false);
  const prevUnreadRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const [notifRes, expiringRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/inventory/expiring'),
      ]);
      setNotifications(notifRes.data);
      setExpiringItems(expiringRes.data);
      const unread = notifRes.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);

      if (preferences.pushEnabled && unread > prevUnreadRef.current) {
        const latest = notifRes.data.find((n) => !n.isRead && n.type === 'expiry');
        if (latest) showBrowserNotification(latest.title || 'Food Expiry Alert', latest.message);
      }
      prevUnreadRef.current = unread;
    } catch {
      // API may be offline during dev
    }
  }, [token, preferences.pushEnabled]);

  const fetchPreferences = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/notifications/preferences');
      setPreferences(data);
    } catch {
      // use defaults
    }
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await api.post('/notifications/sync');
      await fetchNotifications();
    } finally {
      setLoading(false);
    }
  }, [token, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const { data } = await api.patch('/notifications/preferences', prefs);
    setPreferences(data);
    await fetchNotifications();
    return data;
  }, [fetchNotifications]);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setExpiringItems([]);
      return undefined;
    }

    fetchPreferences();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token, fetchPreferences, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        expiringItems,
        preferences,
        loading,
        refresh,
        markRead,
        markAllRead,
        updatePreferences,
        requestPushPermission,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
