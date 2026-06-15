import { useTranslation } from 'react-i18next';

export default function ExpiryAlert({ expiringItems }) {
  const { t } = useTranslation();

  if (!expiringItems?.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-amber-800">{t('inventory.expiringSoon')}</h3>
      <p className="text-amber-700 text-sm">
        {t('inventory.expiringMessage', { count: expiringItems.length })}
      </p>
      <ul className="mt-2 text-sm text-amber-800">
        {expiringItems.map((item) => (
          <li key={item._id}>
            {item.foodName} — {new Date(item.expiryDate).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
