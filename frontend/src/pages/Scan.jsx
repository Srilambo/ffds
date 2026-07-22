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
    setLoading(true); setError(''); setScan(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post('/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setScan(data);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || t('scan.error');
      setError(errorMsg);
      setScan(null);
    }
    finally { setLoading(false); }
  };

  const handleAddToInventory = (scanData) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    setInvForm({ foodName: scanData.foodType, category: 'fruit', quantity: 1,
      unit: 'pcs', location: 'fridge', purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0] });
    setShowInventoryForm(true);
  };

  const submitInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', { ...invForm, location: 'fridge', linkedScanId: scan?._id,
        purchaseDate: new Date(invForm.purchaseDate).toISOString(),
        expiryDate: new Date(invForm.expiryDate).toISOString() });
      setShowInventoryForm(false);
    } catch { setError(t('inventory.error')); }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>🔍</span> {t('scan.title')}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload or capture a food photo for instant AI freshness analysis, gas telemetry & shelf-life prediction.
            </p>
          </div>
          <div className="flex gap-2 stagger-children shrink-0">
            {['🔬 CNN', '🌡️ Gas Sensor', '🤖 AI Advisor'].map((tag) => (
              <span key={tag} className="text-[11px] px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive layout: stack on mobile, side-by-side on lg */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload card */}
        <div className="glass p-4 md:p-6 space-y-5 card-hover animate-fade-up delay-100">
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
              preview ? 'py-6' : 'py-10 md:py-14'
            } ${
              dragging
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : 'border-white/10 hover:border-brand-600/50 hover:bg-white/[0.02]'
            }`}
          >
            {preview ? (
              <div className="relative animate-scale-in">
                <img src={preview} alt="preview" className="max-h-48 md:max-h-64 max-w-full rounded-xl shadow-lg border border-white/10" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); setScan(null); }}
                  className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                >✕</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl md:text-4xl animate-bounce-gentle">
                  🍎
                </div>
                <div>
                  <p className="text-white font-semibold text-sm md:text-base">Drop an image here</p>
                  <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP — max 10MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              id="scan-capture-btn"
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer btn-glow text-white text-sm font-semibold"
            >
              📷 {t('scan.capture')}
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            </label>
            <label
              id="scan-upload-btn"
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer border border-brand-600/40 text-brand-400 text-sm font-semibold hover:bg-brand-600/10 transition-all"
            >
              📁 {t('scan.upload')}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-shake">
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

        {/* Result panel — shows placeholder on desktop when no scan */}
        <div className="animate-fade-up delay-200">
          {scan ? (
            <ScanResult scan={scan} onAddToInventory={handleAddToInventory} />
          ) : (
            <div className="glass p-6 md:p-8 h-full min-h-[340px] flex flex-col justify-between space-y-6 border border-white/10 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />
              
              <div className="text-center space-y-3 pt-4">
                <div className="inline-flex h-20 w-20 rounded-3xl bg-gradient-to-tr from-brand-500/20 to-emerald-500/10 border border-brand-500/30 items-center justify-center text-4xl shadow-glow animate-float-slow mx-auto">
                  🥬
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-lg">Ready for AI Analysis</h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                    Upload or snap a photo of any fruit or vegetable to classify freshness and estimate remaining shelf life.
                  </p>
                </div>
              </div>

              {/* 3 Step Process Guide */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-center">
                <div className="space-y-1">
                  <span className="text-base">📸</span>
                  <p className="text-[10px] font-bold text-white">1. Capture</p>
                  <p className="text-[9px] text-slate-500">Upload photo</p>
                </div>
                <div className="space-y-1">
                  <span className="text-base">🤖</span>
                  <p className="text-[10px] font-bold text-white">2. Analyze</p>
                  <p className="text-[9px] text-slate-500">CNN + Gas AI</p>
                </div>
                <div className="space-y-1">
                  <span className="text-base">🧊</span>
                  <p className="text-[10px] font-bold text-white">3. Save</p>
                  <p className="text-[9px] text-slate-500">Track in fridge</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-2 pb-2">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Classification:</span>
                {['Fresh', 'Borderline', 'Spoiled'].map((label) => (
                  <span key={label} className={`text-[10px] px-2.5 py-1 rounded-full font-bold badge-${label.toLowerCase()}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights / AI Workflow section */}
      <div className="grid sm:grid-cols-3 gap-4 pt-2 animate-fade-up delay-300">
        <div className="glass p-4 rounded-2xl border border-white/10 space-y-2 card-hover">
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-lg font-bold">
            📷
          </div>
          <h4 className="text-sm font-bold text-white">Computer Vision AI</h4>
          <p className="text-xs text-slate-400">
            CNN multi-class deep learning model trained to detect food visual degradation & surface decay.
          </p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10 space-y-2 card-hover">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold">
            🧪
          </div>
          <h4 className="text-sm font-bold text-white">Gas Telemetry Sensor</h4>
          <p className="text-xs text-slate-400">
            Monitors Ammonia (NH₃), Hydrogen Sulfide (H₂S), and Ethylene levels to prevent spoilage early.
          </p>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/10 space-y-2 card-hover">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg font-bold">
            ❄️
          </div>
          <h4 className="text-sm font-bold text-white">Smart Fridge Management</h4>
          <p className="text-xs text-slate-400">
            Seamlessly save scanned produce to your fridge to get automated expiration alerts and recipe ideas.
          </p>
        </div>
      </div>

      {/* Add to inventory modal */}
      {showInventoryForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm drawer-overlay">
          <div className="glass w-full sm:max-w-md p-6 shadow-2xl rounded-t-3xl sm:rounded-2xl animate-fade-up safe-bottom">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
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
