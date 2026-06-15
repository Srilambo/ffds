import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import ScanResult from '../components/ScanResult';

export default function Scan() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [invForm, setInvForm] = useState({
    foodName: '',
    category: 'fruit',
    quantity: 1,
    unit: 'pcs',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setScan(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScan(data);
    } catch {
      setError(t('scan.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToInventory = (scanData) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    setInvForm({
      foodName: scanData.foodType,
      category: 'fruit',
      quantity: 1,
      unit: 'pcs',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
    });
    setShowInventoryForm(true);
  };

  const submitInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...invForm,
        linkedScanId: scan?._id,
        purchaseDate: new Date(invForm.purchaseDate).toISOString(),
        expiryDate: new Date(invForm.expiryDate).toISOString(),
      });
      setShowInventoryForm(false);
    } catch {
      setError(t('inventory.error'));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('scan.title')}</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex gap-4">
          <label className="flex-1 cursor-pointer bg-green-600 text-white text-center py-3 rounded hover:bg-green-700">
            {t('scan.capture')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <label className="flex-1 cursor-pointer border border-green-600 text-green-600 text-center py-3 rounded hover:bg-green-50">
            {t('scan.upload')}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {preview && (
          <div>
            <p className="text-sm text-gray-500 mb-2">{t('scan.preview')}</p>
            <img src={preview} alt="preview" className="max-h-64 rounded border mx-auto" />
          </div>
        )}

        {error && <p className="text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? t('scan.loading') : t('scan.submit')}
        </button>
      </div>

      {scan && <ScanResult scan={scan} onAddToInventory={handleAddToInventory} />}

      {showInventoryForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-semibold mb-4">{t('result.addToInventory')}</h2>
          <form onSubmit={submitInventory} className="grid grid-cols-2 gap-4">
            <input value={invForm.foodName}
              onChange={(e) => setInvForm({ ...invForm, foodName: e.target.value })}
              className="border rounded px-3 py-2 col-span-2" placeholder={t('inventory.foodName')} />
            <select value={invForm.category}
              onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
              className="border rounded px-3 py-2">
              {['fruit', 'vegetable', 'dairy', 'bakery', 'other'].map((c) => (
                <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>
              ))}
            </select>
            <input type="number" value={invForm.quantity}
              onChange={(e) => setInvForm({ ...invForm, quantity: +e.target.value })}
              className="border rounded px-3 py-2" />
            <input value={invForm.unit}
              onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
              className="border rounded px-3 py-2" placeholder={t('inventory.unit')} />
            <input type="date" value={invForm.expiryDate}
              onChange={(e) => setInvForm({ ...invForm, expiryDate: e.target.value })}
              className="border rounded px-3 py-2 col-span-2" />
            <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded">
              {t('inventory.save')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
