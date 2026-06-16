import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosClient';
import ScanResult from '../components/ScanResult';

export default function Scan() {
  const { t } = useTranslation();
  const [file, setFile]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [scan, setScan]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [invForm, setInvForm] = useState({
    foodName: '', category: 'fruit', quantity: 1,
    unit: 'pcs', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '',
  });
  const dropRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const applyFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setScan(null); setError('');
  };

  const handleFileChange = (e) => applyFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    applyFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError('');
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScan(data);
    } catch { setError(t('scan.error')); }
    finally { setLoading(false); }
  };

  const handleAddToInventory = (scanData) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    setInvForm({ foodName: scanData.foodType, category: 'fruit', quantity: 1,
      unit: 'pcs', purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0] });
    setShowInventoryForm(true);
  };

  const submitInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', { ...invForm, linkedScanId: scan?._id,
        purchaseDate: new Date(invForm.purchaseDate).toISOString(),
        expiryDate: new Date(invForm.expiryDate).toISOString() });
      setShowInventoryForm(false);
    } catch { setError(t('inventory.error')); }
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('scan.title')}</h1>
        <p className="text-slate-500 text-sm mt-1">Upload or capture a food photo for AI freshness analysis</p>
      </div>

      {/* Upload card */}
      <div className="glass p-6 space-y-5">
        {/* Drag-drop zone */}
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 transition-all cursor-pointer ${
            dragging
              ? 'border-brand-400 bg-brand-500/10'
              : 'border-white/10 hover:border-brand-600/50 hover:bg-white/2'
          }`}
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="preview" className="max-h-56 max-w-full rounded-lg shadow-lg border border-white/10" />
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); setScan(null); }}
                className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
              >✕</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                🍎
              </div>
              <div>
                <p className="text-white font-medium text-sm">Drop an image here</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP — max 10MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload buttons */}
        <div className="grid grid-cols-2 gap-3">
          <label
            id="scan-capture-btn"
            className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer btn-glow text-white text-sm font-semibold"
          >
            📷 {t('scan.capture')}
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
          </label>
          <label
            id="scan-upload-btn"
            className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border border-brand-600/40 text-brand-400 text-sm font-semibold hover:bg-brand-600/10 transition-all"
          >
            📁 {t('scan.upload')}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          id="scan-submit-btn"
          onClick={handleSubmit}
          disabled={!file || loading}
          className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="spinner" /> {t('scan.loading')}</>
          ) : (
            <><span>🔬</span> {t('scan.submit')}</>
          )}
        </button>
      </div>

      {/* Scan result */}
      {scan && <ScanResult scan={scan} onAddToInventory={handleAddToInventory} />}

      {/* Add to inventory modal */}
      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 shadow-2xl fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg">{t('result.addToInventory')}</h2>
              <button onClick={() => setShowInventoryForm(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={submitInventory} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={invForm.foodName}
                  onChange={(e) => setInvForm({ ...invForm, foodName: e.target.value })}
                  className="input-dark px-3 py-2.5 text-sm col-span-2"
                  placeholder={t('inventory.foodName')}
                />
                <select
                  value={invForm.category}
                  onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                  className="input-dark px-3 py-2.5 text-sm"
                >
                  {['fruit','vegetable','dairy','bakery','other'].map((c) => (
                    <option key={c} value={c}>{t(`inventory.category.${c}`)}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number" value={invForm.quantity}
                    onChange={(e) => setInvForm({ ...invForm, quantity: +e.target.value })}
                    className="input-dark px-3 py-2.5 text-sm w-20"
                  />
                  <input
                    value={invForm.unit}
                    onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                    className="input-dark px-3 py-2.5 text-sm flex-1"
                    placeholder={t('inventory.unit')}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">{t('inventory.expiryDate')}</label>
                  <input
                    type="date" value={invForm.expiryDate}
                    onChange={(e) => setInvForm({ ...invForm, expiryDate: e.target.value })}
                    className="input-dark px-3 py-2.5 text-sm w-full"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInventoryForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all">
                  {t('inventory.cancel')}
                </button>
                <button type="submit"
                  className="flex-1 btn-glow py-2.5 rounded-xl text-white text-sm font-semibold">
                  {t('inventory.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
