import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import ExpiryAlert from '../components/ExpiryAlert';
import InventoryList from '../components/InventoryList';

export default function Inventory() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    foodName: '',
    category: 'fruit',
    quantity: 1,
    unit: 'pcs',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      const [invRes, expRes] = await Promise.all([
        api.get('/inventory', { params }),
        api.get('/inventory/expiring'),
      ]);
      setItems(invRes.data);
      setExpiring(expRes.data);
    } catch {
      setError(t('inventory.error'));
    }
  };

  useEffect(() => { load(); }, [category, status]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...form,
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        expiryDate: new Date(form.expiryDate).toISOString(),
      });
      setShowForm(false);
      load();
    } catch {
      setError(t('inventory.error'));
    }
  };

  const handleUpdate = async (id, data) => {
    await api.put(`/inventory/${id}`, data);
    load();
  };

  const handleDelete = async (id) => {
    await api.delete(`/inventory/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {t('inventory.addItem')}
        </button>
      </div>

      <ExpiryAlert expiringItems={expiring} />

      <div className="flex gap-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">{t('inventory.filter.category')}</option>
          {['fruit', 'vegetable', 'dairy', 'bakery', 'other'].map((c) => (
            <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">{t('inventory.filter.status')}</option>
          {['active', 'consumed', 'wasted'].map((s) => (
            <option key={s} value={s}>{t(`inventory.status.${s}`)}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-md p-6 grid grid-cols-2 gap-4">
          <input value={form.foodName} onChange={(e) => setForm({ ...form, foodName: e.target.value })}
            className="border rounded px-3 py-2 col-span-2" placeholder={t('inventory.foodName')} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded px-3 py-2">
            {['fruit', 'vegetable', 'dairy', 'bakery', 'other'].map((c) => (
              <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>
            ))}
          </select>
          <input type="number" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
            className="border rounded px-3 py-2" />
          <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="border rounded px-3 py-2" placeholder={t('inventory.unit')} />
          <input type="date" value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="border rounded px-3 py-2 col-span-2" required />
          <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded">
            {t('inventory.save')}
          </button>
        </form>
      )}

      <InventoryList items={items} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );
}
