import { useTranslation } from 'react-i18next';

export default function ExpiryAlert({ expiringItems }) {
  const { t } = useTranslation();
  if (!expiringItems?.length) return null;

  return (
    <div className="flex gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
      <div className="shrink-0 h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">
        ⏰
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-amber-300">{t('inventory.expiringSoon')}</h3>
          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-semibold">
            {expiringItems.length}
          </span>
        </div>
        <p className="text-amber-400/80 text-xs mb-2">
          {t('inventory.expiringMessage', { count: expiringItems.length })}
        </p>
        <div className="flex flex-wrap gap-2">
          {expiringItems.map((item) => {
            const days = Math.ceil((new Date(item.expiryDate) - new Date()) / 86400000);
            return (
              <span key={item._id}
                className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full">
                <span className="font-semibold">{item.foodName}</span>
                <span className="text-amber-500/70">·</span>
                <span className={days <= 0 ? 'text-red-400 font-bold' : ''}>
                  {days <= 0 ? 'Today!' : `${days}d`}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
