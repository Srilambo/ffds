import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const severityStyles = {
  danger: 'border-red-500/30 bg-red-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
  info: 'border-brand-500/30 bg-brand-500/10',
};

const severityIcon = {
  danger: '🔴',
  warning: '⏰',
  info: '🔔',
};

export default function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleClick = async (notification) => {
    if (!notification.isRead) await markRead(notification._id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label={t('notifications.title', 'Notifications')}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass border border-white/10 rounded-2xl shadow-2xl z-[70] animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">
              {t('notifications.title', 'Notifications')}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold"
              >
                {t('notifications.markAllRead', 'Mark all read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="text-3xl">🔔</span>
                <p className="text-sm text-slate-500 mt-2">
                  {t('notifications.empty', 'No notifications yet')}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-white/5 ${
                    !n.isRead ? 'bg-white/[0.03]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{severityIcon[n.severity] || '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                          {n.title || t('notifications.expiryAlert', 'Expiry Alert')}
                        </p>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/5 flex gap-2">
            <Link
              to="/consumer/pantry"
              onClick={() => setOpen(false)}
              className="flex-1 text-center text-xs font-semibold text-brand-400 hover:text-white py-2 rounded-lg hover:bg-brand-500/10 transition-all"
            >
              {t('notifications.viewPantry', 'View Pantry')}
            </Link>
            <Link
              to="/consumer/settings"
              onClick={() => setOpen(false)}
              className="flex-1 text-center text-xs font-semibold text-slate-400 hover:text-white py-2 rounded-lg hover:bg-white/5 transition-all"
            >
              {t('notifications.settings', 'Alert Settings')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
