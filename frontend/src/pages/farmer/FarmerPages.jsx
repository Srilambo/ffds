import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// ============================================
// SHARED HELPERS
// ============================================
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

// ============================================
// BATCH SCAN - Multi-file upload with progress
// ============================================
export function BatchScan() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [batchName, setBatchName] = useState('');
  const [foodType, setFoodType] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const fileInputRef = useRef(null);

  const handleFiles = (selectedFiles) => {
    const arr = Array.from(selectedFiles).slice(0, 50);
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
    setError('');
    setResult(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    if (!batchName || !foodType) {
      setError('Batch name and food type are required');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('batchName', batchName);
    fd.append('foodType', foodType);
    if (estimatedValue) fd.append('estimatedValue', estimatedValue);
    fd.append('currency', currency);

    try {
      const { data } = await api.post('/farmer/batch-scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 100))),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Batch scan failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateReport = async (batchId) => {
    try {
      const { data } = await api.post(`/farmer/buyer-report/${batchId}`);
      window.open(data.reportUrl, '_blank');
    } catch (err) {
      alert('Failed to generate report: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.farmer.batchScan', 'Batch Scan')}</h1>
          <p className="text-slate-500 text-sm mt-1">Upload 20-50 harvest images at once. Get quality scores and PDF reports for buyers.</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="glass p-4 md:p-6 space-y-5 card-hover animate-fade-up">
        {/* Batch Info */}
        <div className="grid sm:grid-cols-3 gap-4">
          <input
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Batch name (e.g., Mango Harvest #42)"
            className="input-dark px-3 py-2.5 text-sm"
          />
          <input
            value={foodType}
            onChange={(e) => setFoodType(e.target.value)}
            placeholder="Food type (e.g., Mango, Tomato)"
            className="input-dark px-3 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="Est. total value"
              className="input-dark px-3 py-2.5 text-sm w-40"
            />
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-dark px-3 py-2.5 text-sm w-28">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* File Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            previews.length > 0 ? 'py-6' : 'py-10 md:py-14'
          } ${files.length > 0 ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:border-brand-600/50 hover:bg-white/[0.02]'}`}
        >
          {previews.length > 0 ? (
            <div className="w-full">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg"
                    >✕</button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 text-center">{files.length}/50 images selected</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl md:text-4xl animate-bounce-gentle">📦</div>
              <div>
                <p className="text-white font-semibold text-sm md:text-base">Drop 20-50 harvest images here</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP — max 5MB each</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer btn-glow text-white text-sm font-semibold">
            📷 {t('scan.capture', 'Capture')}
            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFiles(e.target.files)} className="hidden" multiple />
          </label>
          <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl cursor-pointer border border-brand-600/40 text-brand-400 text-sm font-semibold hover:bg-brand-600/10 transition-all">
            📁 {t('scan.upload', 'Upload')}
            <input type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" multiple />
          </label>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-shake">⚠️ {error}</div>}

        <button onClick={handleSubmit} disabled={files.length === 0 || uploading || !batchName || !foodType}
          className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2">
          {uploading ? (
            <>
              <span className="spinner" /> Uploading & Analyzing... {progress}%
              <div className="w-1/2 h-1.5 bg-white/10 rounded-full overflow-hidden ml-4">
                <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>🔬 {t('scan.submit', 'Analyze Batch')}</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-fade-up delay-200 space-y-6">
          {/* Batch Summary */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">📊 {t('nav.farmer.batchScan', 'Batch')} Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Items', value: result.batch.totalItems, color: 'text-white' },
                { label: 'Fresh', value: result.batch.freshCount, color: 'text-emerald-400' },
                { label: 'Borderline', value: result.batch.borderlineCount, color: 'text-amber-400' },
                { label: 'Spoiled', value: result.batch.spoiledCount, color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality Score</p>
                <p className="text-3xl font-black text-white">{result.batch.qualityScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Value</p>
                <p className="text-2xl font-bold text-amber-400">{formatCurrency(result.batch.estimatedValue)} {result.batch.currency}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                result.batch.qualityScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                result.batch.qualityScore >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
                {result.batch.recommendation}
              </span>
            </div>
          </div>

          {/* Per-Image Results Grid */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Per-Image Results ({result.scans.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {result.scans.map((scan, i) => (
                <div key={scan.scanId} className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <img src={scan.imageUrl} alt={scan.foodType} className="w-full h-28 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-xs font-semibold text-white truncate">{scan.foodType}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      scan.label === 'Fresh' ? 'bg-emerald-500/20 text-emerald-400' :
                      scan.label === 'Borderline' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {scan.label} {scan.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Buyer Report */}
          <div className="glass p-6 rounded-2xl text-center border border-brand-500/30 bg-brand-500/10">
            <p className="text-slate-400 mb-4">Generate a shareable PDF report with QR code for buyer verification</p>
            <button
              onClick={() => handleGenerateReport(result.batch._id)}
              className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
            >
              📜 Generate Buyer Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// FARMER CALENDAR - Calendar/timeline view of batches
// ============================================
export function FarmerCalendar() {
  const { t } = useTranslation();
  const [data, setData] = useState({ byDate: {}, byMonth: {} });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('monthly'); // 'monthly' | 'calendar'

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/farmer/calendar');
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return <div className="glass p-8 rounded-2xl animate-pulse"><div className="h-8 w-1/3 bg-white/10 rounded mb-4" /><div className="h-64 bg-white/5 rounded" /></div>;

  const sortedDates = Object.keys(data.byDate || {}).sort().reverse();

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.farmer.calendar', 'Harvest Calendar')}</h1>
          <p className="text-slate-500 text-sm mt-1">View past batches, get best sell time recommendations, and seasonal freshness trends.</p>
        </div>
        <div className="flex gap-2">
          {['monthly', 'calendar'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === v ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
          ))}
        </div>
      </div>

      {view === 'monthly' && (
        <>
          {/* Seasonal Trend Chart */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Seasonal Quality Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Object.entries(data.byMonth || {}).map(([k, v]) => ({ month: k, quality: v.avgQuality, count: v.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#ffffff60" fontSize={11} tickMargin={10} />
                  <YAxis stroke="#ffffff60" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="quality" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Avg Quality %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Monthly Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                    <th className="text-left py-2 pr-4">Month</th>
                    <th className="text-left py-2 pr-4">Batches</th>
                    <th className="text-left py-2 pr-4">Total Items</th>
                    <th className="text-left py-2">Avg Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.byMonth || {}).sort((a, b) => b[0].localeCompare(a[0])).map(([month, stats]) => (
                    <tr key={month} className="border-b border-white/5 text-slate-300">
                      <td className="py-2.5 pr-4 font-medium text-white">{month}</td>
                      <td className="py-2.5 pr-4">{stats.count}</td>
                      <td className="py-2.5 pr-4">{stats.totalItems}</td>
                      <td className="py-2.5 font-mono text-lg">{stats.avgQuality}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'calendar' && (
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4">Batches by Date</h3>
          {sortedDates.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No batches recorded yet</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {sortedDates.map((date) => (
                <div key={date} className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{formatDate(date)}</span>
                    <span className="text-xs text-slate-500">{data.byDate[date].length} batch(es)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.byDate[date].map((b) => (
                      <div key={b._id} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs flex items-center gap-1.5">
                        <span className="text-base">{b.foodType === 'Mango' ? '🥭' : b.foodType === 'Tomato' ? '🍅' : b.foodType === 'Carrot' ? '🥕' : '🌿'}</span>
                        <span className="font-medium text-white">{b.batchName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          b.qualityScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          b.qualityScore >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>
                          {b.qualityScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// LOSS TRACKING - Harvest vs Sold vs Wasted
// ============================================
export function LossTracking() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    harvestDate: new Date().toISOString().split('T')[0],
    foodType: '',
    harvestedQty: '',
    soldQty: '',
    wastedQty: '',
    unit: 'kg',
    estimatedCostPerUnit: '',
    currency: 'USD',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/farmer/loss');
        setHistory(res.data.logs || []);
        if (res.data.monthlyLoss) setHistory(prev => ({ logs: prev, monthlyLoss: res.data.monthlyLoss }));
      } catch (e) { console.error(e); }
      finally { setHistoryLoading(false); }
    }
    fetch();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/farmer/loss', form);
      setResult(res.data);
      setForm({ ...form, harvestedQty: '', soldQty: '', wastedQty: '', estimatedCostPerUnit: '', reason: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log loss');
    } finally {
      setLoading(false);
    }
  };

  const financialLoss = form.harvestedQty && form.estimatedCostPerUnit
    ? (form.harvestedQty - form.soldQty) * form.estimatedCostPerUnit
    : 0;

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.farmer.lossTracking', 'Loss Tracker')}</h1>
          <p className="text-slate-500 text-sm mt-1">Record harvest vs sold vs wasted quantities. Track financial losses with monthly charts.</p>
        </div>
      </div>

      {/* Log Form */}
      <div className="glass p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Log New Loss Entry</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Harvest Date</label>
            <input type="date" value={form.harvestDate} onChange={(e) => setForm({...form, harvestDate: e.target.value})}
              className="input-dark px-3 py-2.5 text-sm w-full" required />
          </div>
          <input value={form.foodType} onChange={(e) => setForm({...form, foodType: e.target.value})}
            placeholder="Food Type (e.g., Tomato)" className="input-dark px-3 py-2.5 text-sm" required />
          <div className="flex gap-2">
            <input type="number" step="0.1" min="0" value={form.harvestedQty} onChange={(e) => setForm({...form, harvestedQty: e.target.value})}
              placeholder="Harvested" className="input-dark px-3 py-2.5 text-sm w-24" required />
            <input type="number" step="0.1" min="0" value={form.soldQty} onChange={(e) => setForm({...form, soldQty: e.target.value})}
              placeholder="Sold" className="input-dark px-3 py-2.5 text-sm w-24" required />
            <input type="number" step="0.1" min="0" value={form.wastedQty} onChange={(e) => setForm({...form, wastedQty: e.target.value})}
              placeholder="Wasted" className="input-dark px-3 py-2.5 text-sm w-24" required />
          </div>
          <select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="input-dark px-3 py-2.5 text-sm">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
            <option value="pcs">pcs</option>
            <option value="tons">tons</option>
          </select>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Est. Cost/Unit</label>
            <input type="number" step="0.01" min="0" value={form.estimatedCostPerUnit} onChange={(e) => setForm({...form, estimatedCostPerUnit: e.target.value})}
              placeholder="Cost per unit" className="input-dark px-3 py-2.5 text-sm w-full" />
          </div>
          <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} className="input-dark px-3 py-2.5 text-sm">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <input value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})}
            placeholder="Reason (e.g., spoilage, transport damage)" className="input-dark px-3 py-2.5 text-sm col-span-2 lg:col-span-3" />
          {financialLoss > 0 && (
            <div className="col-span-1 lg:col-span-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">Est. Financial Loss: <span className="font-bold text-white">{formatCurrency(financialLoss)} {form.currency}</span></p>
            </div>
          )}
          <div className="col-span-1 lg:col-span-3 flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-glow px-6 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2">
              {loading ? <><span className="spinner w-4 h-4" /> Logging...</> : '📉 Log Loss Entry'}
            </button>
            {error && <span className="text-red-400 text-sm self-center">⚠️ {error}</span>}
          </div>
        </form>

        {result && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <p className="text-emerald-400 font-semibold">✅ Loss logged successfully</p>
            <p className="text-xs text-slate-400">Harvested: {result.harvestedQty} {form.unit} · Sold: {result.soldQty} · Wasted: {result.wastedQty} · Remaining: {result.remainingQty}</p>
            <p className="text-xs text-slate-400">Financial Loss: {formatCurrency(result.financialLoss)} {result.currency}</p>
          </div>
        )}
      </div>

      {/* Monthly Loss Chart */}
      <div className="glass p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Monthly Financial Loss</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history.monthlyLoss?.labels?.map((l, i) => ({ month: l, loss: history.monthlyLoss.values[i] })) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#ffffff60" fontSize={11} tickMargin={10} />
              <YAxis stroke="#ffffff60" fontSize={11} tickFormatter={v => formatCurrency(v)} />
              <Tooltip formatter={v => [formatCurrency(v), 'Loss']} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="loss" fill="url(#lossGradient)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-500 mt-3 text-right">Total Loss: <span className="font-bold text-red-400">{formatCurrency(history.monthlyLoss?.values?.reduce((a, b) => a + b, 0) || 0)}</span></p>
      </div>

      {/* History Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full dark-table">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Food</th>
                <th className="text-left hidden sm:table-cell py-2 pr-4">Harvested</th>
                <th className="text-left hidden sm:table-cell py-2 pr-4">Sold</th>
                <th className="text-left py-2 pr-4">Wasted</th>
                <th className="text-left py-2 pr-4">Loss</th>
                <th className="text-left py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.logs?.slice(0, 50).map((log) => (
                <tr key={log._id} className="border-b border-white/5 text-slate-300">
                  <td className="py-2.5 pr-4 text-xs">{formatDate(log.createdAt)}</td>
                  <td className="py-2.5 pr-4 font-medium text-white">{log.foodName}</td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell text-slate-400 font-mono text-xs">{log.quantity} {log.unit}</td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell text-slate-400 font-mono text-xs">—</td>
                  <td className="py-2.5 pr-4 text-red-400 font-mono text-xs">{log.quantity} {log.unit}</td>
                  <td className="py-2.5 pr-4 text-red-400 font-bold font-mono text-sm">{formatCurrency(log.estimatedCost)} {log.currency}</td>
                  <td className="py-2.5 text-xs text-slate-500 truncate max-w-xs">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!history.logs?.length && !historyLoading && (
          <div className="glass py-16 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">📉</span>
            <p className="text-white font-medium">No loss entries yet</p>
            <p className="text-slate-500 text-sm">Log your first harvest vs sold vs wasted entry above</p>
          </div>
        )}
        {historyLoading && <div className="glass p-8 animate-pulse"><div className="h-8 w-1/3 bg-white/10 rounded" /></div>}
      </div>
    </div>
  );
}

// ============================================
// BUYER REPORTS - List generated reports with QR
// ============================================
export function BuyerReports() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/farmer/batches');
        setBatches(res.data.filter(b => b.buyerReportUrl));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  const handleGenerate = async (batchId) => {
    setGenerating(batchId);
    try {
      await api.post(`/farmer/buyer-report/${batchId}`);
      // Refresh
      const res = await api.get('/farmer/batches');
      setBatches(res.data.filter(b => b.buyerReportUrl));
    } catch (e) { alert('Failed to generate report'); }
    finally { setGenerating(null); }
  };

  if (loading) return <div className="glass p-8 rounded-2xl animate-pulse"><div className="h-8 w-1/3 bg-white/10 rounded" /></div>;

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('nav.farmer.buyerReports', 'Buyer Reports')}</h1>
          <p className="text-slate-500 text-sm mt-1">Generate shareable batch quality certificates with QR codes for buyer verification.</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="glass p-12 rounded-2xl text-center">
          <span className="text-6xl mb-4 block">📜</span>
          <h3 className="text-xl font-semibold text-white mb-2">No Buyer Reports Yet</h3>
          <p className="text-slate-500 mb-6">Complete a batch scan, then generate a report for buyers.</p>
          <a href="/farmer/batch-scan" className="btn-glow inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold">
            📦 Go to Batch Scan
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch._id} className="glass p-5 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white">{batch.batchName}</h3>
                  <p className="text-sm text-slate-400">{batch.foodType} · {batch.totalItems} items · Quality: {batch.qualityScore}%</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {batch.buyerReportUrl && (
                    <>
                      <a href={batch.buyerReportUrl} target="_blank" rel="noopener noreferrer"
                        className="btn-glow px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5">
                        📄 Download PDF
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/verify/batch/${batch._id}`)}
                        className="px-3 py-2 rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-semibold hover:bg-brand-500/20 transition-all"
                      >
                        🔗 Copy Verify Link
                      </button>
                    </>
                  )}
                  {!batch.buyerReportUrl && (
                    <button onClick={() => handleGenerate(batch._id)} disabled={generating === batch._id}
                      className="btn-glow px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5">
                    {generating === batch._id ? <><span className="spinner w-4 h-4" /> Generating...</> : '📜 Generate Report'}
                  </button>
                  )}
                </div>
              </div>
              {batch.buyerReportQR && (
                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                  <img src={batch.buyerReportQR} alt="QR Code" className="w-24 h-24 rounded-lg bg-white p-1" />
                  <div className="text-xs text-slate-400">
                    <p>Scan to verify: <code className="text-white break-all">{window.location.origin}/verify/batch/{batch._id}</code></p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// FARMER CHATBOT - Agricultural advisor
// ============================================
export function FarmerChatbot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your agricultural advisor. Ask me about post-harvest handling, storage temperatures, transport logistics, or sell/hold decisions." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput(''); setLoading(true);
    setMessages(p => [...p, { role: 'user', text: q }]);
    try {
      const { data } = await api.post('/farmer/chat', { question: q, language: user?.language || 'en' });
      setMessages(p => [...p, { role: 'assistant', text: data.reply }]);
    } catch { setMessages(p => [...p, { role: 'assistant', text: 'Error: Could not reach AI advisor.' }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden h-[600px] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/3 border-b border-white/8">
        <div className="h-6 w-6 rounded-md bg-emerald-600/30 flex items-center justify-center text-xs">🚜</div>
        <span className="text-sm font-semibold text-white">Farmer AI Advisor</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-slow" />
          <span className="text-xs text-slate-500">Gemini AI</span>
        </div>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-surface-2/30 flex-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-emerald-700/40 border border-emerald-600/30 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">🚜</div>
            )}
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white/8 text-slate-200 rounded-bl-sm border border-white/5'
            }`}>{msg.text}</div>
            {msg.role === 'user' && <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs ml-2 mt-0.5 shrink-0">👤</div>}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="h-6 w-6 rounded-full bg-emerald-700/40 border border-emerald-600/30 flex items-center justify-center text-xs mr-2 mt-0.5 shrink-0">🚜</div>
            <div className="bg-white/8 border border-white/5 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 p-3 bg-white/2 border-t border-white/8">
        <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about storage temps, transport, when to sell..."
          className="input-dark flex-1 px-3 py-2 text-sm rounded-lg" disabled={loading} />
        <button id="chat-send-btn" type="submit" disabled={loading || !input.trim()}
          className="btn-glow px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5">
          {loading ? <span className="spinner w-4 h-4" /> : '↑'}
        </button>
      </form>
    </div>
  );
}