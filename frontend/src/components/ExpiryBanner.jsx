import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import ExpiryAlert from './ExpiryAlert';

export default function ExpiryBanner() {
  const { t } = useTranslation();
  const { expiringItems, unreadCount, preferences } = useNotifications();

  if (!preferences.expiryReminders || !expiringItems?.length) return null;

  return (
    <div className="mb-6 space-y-3 animate-fade-up">
      <ExpiryAlert expiringItems={expiringItems} />
      {unreadCount > 0 && (
        <div className="flex items-center justify-between glass border border-brand-500/20 bg-brand-500/5 rounded-xl px-4 py-2.5">
          <p className="text-xs text-brand-300">
            🔔 {t('notifications.unreadAlerts', { count: unreadCount, defaultValue: '{{count}} unread expiry alert(s)' })}
          </p>
          <Link
            to="/consumer/settings"
            className="text-[10px] font-semibold text-brand-400 hover:text-white transition-colors"
          >
            {t('notifications.manage', 'Manage alerts')} →
          </Link>
        </div>
      )}
    </div>
  );
}
