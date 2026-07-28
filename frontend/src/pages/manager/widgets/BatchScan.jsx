import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosClient';

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
  const [currency, setCurrency] = useState('LKR');
  const [selectedScan, setSelectedScan] = useState(null);

  const resolveImageUrl = (url, index) => {
    if (!url) return previews[index] || '';
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '') 
      : 'http://localhost:5000';
    return `${apiBase}${url.startsWith('/') ? url : '/' + url}`;
  };

  const handleFiles = (selectedFiles) => {
    const arr = Array.from(selectedFiles).slice(0, 50);
    setFiles(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
    setError('');
    setResult(null);
    setSelectedScan(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => { 
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index); 
    });
  };

  const handleReset = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setResult(null);
    setError('');
    setSelectedScan(null);
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const finalBatchName = batchName.trim() || `Shipment #${Math.floor(100 + Math.random() * 900)}`;
    const finalFoodType = foodType.trim() || 'Produce Stock';

    setUploading(true);
    setProgress(0);
    setError('');

    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('batchName', finalBatchName);
    fd.append('foodType', finalFoodType);
    if (estimatedValue) fd.append('estimatedValue', estimatedValue);
    fd.append('currency', currency);

    try {
      const { data } = await api.post('/farmer/batch-scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 100))),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Bulk scan failed. Please check backend connection and retry.');
    } finally {
      setUploading(false);
    }
  };

  // Safely extract batch response data (supports both { batch: {...}, scans: [...] } and legacy flat format)
  const batchData = result ? (result.batch || result) : null;
  const scansList = result ? (result.scans || []) : [];

  const freshCount = batchData?.freshCount ?? 0;
  const borderlineCount = batchData?.borderlineCount ?? 0;
  const spoiledCount = batchData?.spoiledCount ?? 0;
  const totalItems = batchData?.totalItems ?? scansList.length ?? files.length;
  
  const qualityScore = batchData?.qualityScore ?? (totalItems > 0 
    ? Math.round(((freshCount * 1 + borderlineCount * 0.5) / totalItems) * 100) 
    : 0);

  const recommendation = batchData?.recommendation || (qualityScore >= 80 ? 'Sell now' : qualityScore >= 50 ? 'Sell soon' : 'Hold / discount');

  const getQualityBadgeColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getLabelBadge = (label) => {
    if (label === 'Fresh') return 'badge-fresh';
    if (label === 'Borderline') return 'badge-borderline';
    return 'badge-spoiled';
  };

  return (
    <div className="space-y-6 fade-up max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass p-6 rounded-2xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Bulk Stock Scan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              AI Powered
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Upload up to 50 incoming produce images simultaneously for instant batch freshness audit & quality grading.
          </p>
        </div>
        {(files.length > 0 || result) && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all self-start sm:self-auto"
          >
            🔄 New Audit
          </button>
        )}
      </div>

      {/* Main Input & Upload Card */}
      <div className="glass p-5 md:p-7 space-y-6 rounded-2xl border border-white/10 shadow-xl">
        {/* Batch Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Batch Identifier</label>
            <input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="Stock Batch Name (e.g., Shipment #42)"
              className="input-dark px-3.5 py-2.5 text-sm w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Produce Type</label>
            <input
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              placeholder="Food type (e.g., Mango, Tomato)"
              className="input-dark px-3.5 py-2.5 text-sm w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Value</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="Value"
                className="input-dark px-3.5 py-2.5 text-sm flex-1"
              />
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)} 
                className="input-dark px-3 py-2.5 text-sm w-24 font-medium"
              >
                <option value="LKR">LKR (Rs)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-emerald-500/20 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-gradient-to-b from-white/[0.03] to-transparent hover:bg-emerald-500/[0.03] transition-all cursor-pointer group"
        >
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={(e) => handleFiles(e.target.files)} 
            className="hidden" 
            id="batch-file-input" 
          />
          <label htmlFor="batch-file-input" className="cursor-pointer space-y-3 block">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              📸
            </div>
            <div>
              <p className="text-white font-bold text-base group-hover:text-emerald-400 transition-colors">
                Drag & drop produce images or click to browse
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Upload up to 50 JPG, PNG, or WebP images of batch produce
              </p>
            </div>
          </label>
        </div>

        {/* Previews Grid */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected Images ({previews.length}/50)</span>
              <button onClick={() => { setFiles([]); setPreviews([]); }} className="text-rose-400 hover:underline">
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-64 overflow-y-auto p-1 scrollbar-thin">
              {previews.map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                  <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-rose-600/90 text-white rounded-full w-5 h-5 text-[11px] font-bold flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-110 transition-all shadow-md"
                    title="Remove image"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-md text-[9px] text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-fade-in">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Progress indicator during upload */}
        {uploading && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Analyzing Freshness & Telemetry...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Analyze Action Button */}
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || uploading}
          className="btn-glow w-full py-3.5 rounded-xl text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="spinner" />
              <span>Scanning Batch Images ({progress}%)...</span>
            </>
          ) : (
            <>
              <span>🔍 Analyze {files.length > 0 ? `${files.length} Image${files.length > 1 ? 's' : ''}` : 'Batch'}</span>
            </>
          )}
        </button>
      </div>

      {/* Audit Completion & Results Panel */}
      {result && (
        <div className="space-y-6 animate-scale-in">
          {/* Summary Dashboard Card */}
          <div className="glass p-6 md:p-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/40 to-slate-900/80 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Batch Audit Complete: {batchData?.batchName || 'Shipment Audit'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Produce Type: <span className="text-emerald-400 font-semibold">{batchData?.foodType || foodType || 'Produce'}</span> • Total Scanned: <span className="text-white font-semibold">{totalItems} items</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendation Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Logistics Action</span>
                  <span className="text-xs font-bold text-white">{recommendation}</span>
                </div>
                <div className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${getQualityBadgeColor(qualityScore)}`}>
                  <span>🎯 Quality Score:</span>
                  <span className="text-lg font-black">{qualityScore}/100</span>
                </div>
              </div>
            </div>

            {/* Freshness Counts Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Fresh Items</p>
                <p className="font-extrabold text-emerald-300 text-3xl mt-1">{freshCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {totalItems > 0 ? Math.round((freshCount / totalItems) * 100) : 0}% of batch
                </p>
              </div>

              <div className="glass p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Borderline</p>
                <p className="font-extrabold text-amber-300 text-3xl mt-1">{borderlineCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {totalItems > 0 ? Math.round((borderlineCount / totalItems) * 100) : 0}% of batch
                </p>
              </div>

              <div className="glass p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
                <p className="text-rose-400 text-xs font-semibold uppercase tracking-wider">Spoiled</p>
                <p className="font-extrabold text-rose-300 text-3xl mt-1">{spoiledCount}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {totalItems > 0 ? Math.round((spoiledCount / totalItems) * 100) : 0}% of batch
                </p>
              </div>

              <div className="glass p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Estimated Valuation</p>
                <p className="font-extrabold text-blue-300 text-2xl mt-1">
                  {batchData?.currency || currency} {Number(batchData?.estimatedValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Quality adjusted</p>
              </div>
            </div>
          </div>

          {/* Individual Scans Breakdown Gallery */}
          {scansList.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📋 Detailed Item Telemetry & Classification</span>
                <span className="text-xs font-normal text-slate-400">({scansList.length} scanned items)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {scansList.map((scan, idx) => (
                  <div
                    key={scan.scanId || idx}
                    onClick={() => setSelectedScan(scan)}
                    className="glass p-3.5 rounded-xl border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer card-hover space-y-3 bg-slate-900/60"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
                      <img
                        src={resolveImageUrl(scan.imageUrl, idx)}
                        alt={scan.foodType || 'Scan'}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${getLabelBadge(scan.label)}`}>
                        {scan.label}
                      </span>
                      <span className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {scan.confidence}% match
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm capitalize">{scan.foodType || 'Produce Item'}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {scan.explanation || 'Analyzed via CNN Vision Model'}
                      </p>
                    </div>

                    {scan.gasReadings && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Gas: <strong className="text-emerald-400">{scan.gasReadings.ethylene || '0.2'} ppm</strong></span>
                        <span>Hum: <strong className="text-blue-400">{scan.gasReadings.humidity || '65'}%</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal / Detail View for Selected Item */}
          {selectedScan && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass max-w-lg w-full p-6 rounded-2xl border border-white/20 space-y-4 relative animate-scale-in bg-slate-900">
                <button
                  onClick={() => setSelectedScan(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getLabelBadge(selectedScan.label)}`}>
                    {selectedScan.label}
                  </span>
                  <h3 className="text-lg font-bold text-white capitalize">{selectedScan.foodType || 'Scanned Item'}</h3>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={resolveImageUrl(selectedScan.imageUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 leading-relaxed">
                    💡 <strong className="text-white">AI Analysis:</strong> {selectedScan.explanation}
                  </p>

                  {selectedScan.gasReadings && (
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-white/5 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Ethylene (C₂H₄)</span>
                        <span className="text-sm font-bold text-emerald-400">{selectedScan.gasReadings.ethylene || '0.2'} ppm</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Ammonia (NH₃)</span>
                        <span className="text-sm font-bold text-amber-400">{selectedScan.gasReadings.ammonia || '0.05'} ppm</span>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Humidity</span>
                        <span className="text-sm font-bold text-blue-400">{selectedScan.gasReadings.humidity || '65'}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedScan(null)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Close Detail
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BatchScan;

