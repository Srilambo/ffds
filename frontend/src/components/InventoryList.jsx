import { useTranslation } from 'react-i18next';

export default function InventoryList({ items, onUpdate, onDelete }) {
  const { t } = useTranslation();

  if (!items.length) {
    return <p className="text-gray-500 text-center py-8">{t('inventory.filter.all')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border bg-white rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">{t('inventory.foodName')}</th>
            <th className="p-3 text-left">{t('inventory.category')}</th>
            <th className="p-3 text-left">{t('inventory.quantity')}</th>
            <th className="p-3 text-left">{t('inventory.expiryDate')}</th>
            <th className="p-3 text-left">{t('inventory.status')}</th>
            <th className="p-3 text-left">{t('inventory.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} className="border-t">
              <td className="p-3">{item.foodName}</td>
              <td className="p-3">{t(`inventory.category.${item.category}`)}</td>
              <td className="p-3">{item.quantity} {item.unit}</td>
              <td className="p-3">{new Date(item.expiryDate).toLocaleDateString()}</td>
              <td className="p-3">
                <select
                  value={item.status}
                  onChange={(e) => onUpdate(item._id, { status: e.target.value })}
                  className="border rounded px-2 py-1 text-xs"
                >
                  {['active', 'consumed', 'wasted'].map((s) => (
                    <option key={s} value={s}>{t(`inventory.status.${s}`)}</option>
                  ))}
                </select>
              </td>
              <td className="p-3">
                <button
                  onClick={() => onDelete(item._id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  {t('inventory.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
