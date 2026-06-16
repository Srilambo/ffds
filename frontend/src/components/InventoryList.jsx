import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  active:   { cls: 'bg-brand-500/15 text-brand-400 border-brand-500/30',   label: 'Active' },
  consumed: { cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30',    label: 'Consumed' },
  wasted:   { cls: 'bg-red-500/15 text-red-400 border-red-500/30',          label: 'Wasted' },
};

const CAT_ICONS = {
  fruit: '🍎', vegetable: '🥦', dairy: '🥛', bakery: '🍞', other: '📦',
};

function daysUntilExpiry(expiryDate) {
  const diff = new Date(expiryDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function InventoryList({ items, onUpdate, onDelete }) {
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <div className="glass py-16 flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">🛒</span>
        <p className="text-white font-medium">No inventory items yet</p>
        <p className="text-slate-500 text-sm">Add your first food item to start tracking freshness</p>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full dark-table">
          <thead>
            <tr>
              <th className="text-left">Food</th>
              <th className="text-left hidden sm:table-cell">Category</th>
              <th className="text-left hidden md:table-cell">Quantity</th>
              <th className="text-left">Expiry</th>
              <th className="text-left">Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const days = daysUntilExpiry(item.expiryDate);
              const cfg  = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
              return (
                <tr key={item._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{CAT_ICONS[item.category] || '📦'}</span>
                      <span className="font-semibold text-white">{item.foodName}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="capitalize text-slate-400">
                      {t(`inventory.category.${item.category}`)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell text-slate-400 font-mono text-xs">
                    {item.quantity} {item.unit}
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className={`text-xs font-mono font-bold ${
                        days <= 0 ? 'text-red-400' : days <= 2 ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </span>
                      {days <= 3 && item.status === 'active' && (
                        <span className={`text-[10px] mt-0.5 ${days <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                          {days <= 0 ? '⚠️ Expired' : `⏰ ${days}d left`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => onUpdate(item._id, { status: e.target.value })}
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold bg-transparent cursor-pointer ${cfg.cls}`}
                    >
                      {['active','consumed','wasted'].map(s => (
                        <option key={s} value={s} className="bg-surface-3 text-white">
                          {t(`inventory.status.${s}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => onDelete(item._id)}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                    >
                      {t('inventory.delete')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
