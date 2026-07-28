import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosClient';
import ScanResult from '../../../components/ScanResult';

const CATEGORIES = ['fruit', 'vegetable', 'dairy', 'bakery', 'other', 'meat', 'bread'];

export function ManagerScan() {
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
    location: 'warehouse',
  });

  const applyFile = (selected) => {
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
    setScan(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScan(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Scan analysis failed');
      setScan(null);
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
      location: 'warehouse',
    });
    setShowInventoryForm(true);
  };

  const submitInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/manager/inventory', {
        ...invForm,
        linkedScanId: scan?._id,
        purchaseDate: new Date(invForm.purchaseDate).toISOString(),
        expiryDate: new Date(invForm.expiryDate).toISOString(),
      });
      setShowInventoryForm(false);
    } catch {
      setError('Failed to add to business inventory');
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>🔍</span> Manager Batch Audit Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Perform high-speed AI audits on received shipments and add results directly to business stock.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-6 space-y-5 rounded-2xl border border-white/10">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              applyFile(e.dataTransfer.files[0]);
            }}
            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              preview ? 'py-6' : 'py-12'
            } border-white/15 hover:border-brand-500/50 hover:bg-white/5`}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="max-h-56 max-w-full rounded-xl shadow-lg border border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setScan(null);
                  }}
                  className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                  🍎
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Drop sample image here</p>
                  <p className="text-slate-400 text-xs mt-0.5">Supports PNG, JPG, WEBP — Max 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer btn-glow text-white text-xs font-semibold">
              📷 Capture Photo
              <input type="file" accept="image/*" capture="environment" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            </label>
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border border-brand-500/40 text-brand-300 text-xs font-semibold hover:bg-brand-500/10 transition-all">
              📁 Choose File
              <input type="file" accept="image/*" onChange={(e) => applyFile(e.target.files[0])} className="hidden" />
            </label>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">⚠️ {error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            {loading ? <><span className="spinner" /> Analyzing Produce...</> : <><span>🔬</span> Run CNN & Gas Telemetry</>}
          </button>
        </div>

        <div>
          {scan ? (
            <ScanResult scan={scan} onAddToInventory={handleAddToInventory} />
          ) : (
            <div className="glass p-8 h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/15 rounded-2xl">
              <div className="text-6xl">🥬</div>
              <div>
                <p className="text-white font-bold text-base">Ready for Batch Scan</p>
                <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                  Upload produce sample photos to instantly classify freshness & log gas sensor metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4 fade-up">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-white text-base">Add Scanned Item to Stock</h2>
              <button onClick={() => setShowInventoryForm(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={submitInventory} className="space-y-3">
              <input
                value={invForm.foodName}
                onChange={(e) => setInvForm({ ...invForm, foodName: e.target.value })}
                className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                placeholder="Food name"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={invForm.category}
                  onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                  className="input-dark px-3 py-2 text-xs rounded-xl"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={invForm.quantity}
                  onChange={(e) => setInvForm({ ...invForm, quantity: +e.target.value })}
                  className="input-dark px-3 py-2 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={invForm.expiryDate}
                  onChange={(e) => setInvForm({ ...invForm, expiryDate: e.target.value })}
                  className="input-dark w-full px-3 py-2 text-xs rounded-xl"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInventoryForm(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-glow py-2 rounded-xl text-white text-xs font-semibold">
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ManagerScan;
