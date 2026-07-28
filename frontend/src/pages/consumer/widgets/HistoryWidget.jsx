import React, { useState, useEffect } from 'react';
import api from '../../../api/axiosClient';
import ChatBot from '../../../components/ChatBot';

export default function HistoryWidget() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/history');
      setScans(res.data.scans || []);
    } catch (err) {
      setError('Failed to fetch scan history.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SAFE':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">🟢 SAFE</span>;
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">🟡 WARNING</span>;
      case 'UNSAFE':
        return <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">🔴 UNSAFE</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 text-[10px] font-bold">⚪ UNKNOWN</span>;
    }
  };

  const filteredScans = scans.filter((scan) => {
    const pName = (scan.productName || scan.barcode || '').toLowerCase();
    const matchQuery = pName.includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || (scan.safetyStatus || '').toLowerCase() === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-up pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">📜</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Product Scan History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Review your previously scanned grocery products, safety warnings, and ingredient reports.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar text-xs">
          {['all', 'safe', 'warning', 'unsafe'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all capitalize ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-glow'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search barcode or product..."
            className="input-dark w-full pl-9 pr-3 py-2 text-xs rounded-xl"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading scan history...</div>
      ) : error ? (
        <div className="glass p-4 rounded-2xl border border-red-500/30 text-red-300 text-xs text-center">{error}</div>
      ) : filteredScans.length === 0 ? (
        <div className="glass p-8 rounded-2xl border border-white/10 text-center space-y-2">
          <div className="text-4xl">🔍</div>
          <div className="text-sm font-bold text-white">No Scan Records Found</div>
          <div className="text-xs text-slate-400">Scan barcodes using the scanner tool to view safety analysis.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredScans.map((scan) => (
            <div
              key={scan._id}
              onClick={() => setSelectedScan(scan)}
              className="glass p-4 rounded-2xl border border-white/10 hover:border-emerald-500/40 bg-slate-900/60 cursor-pointer transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{scan.productName || 'Scanned Item'}</h3>
                    <div className="text-[11px] font-mono text-slate-400">Barcode: {scan.barcode || 'N/A'}</div>
                  </div>
                  {getStatusBadge(scan.safetyStatus)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-slate-400">
                <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                <span className="text-emerald-400 font-bold hover:underline">View Analysis →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-up">
          <div className="glass w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{selectedScan.productName || 'Scanned Item'}</h3>
                <p className="text-xs font-mono text-slate-400">Barcode: {selectedScan.barcode}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Safety Status:</span>
                {getStatusBadge(selectedScan.safetyStatus)}
              </div>

              {selectedScan.analysis && (
                <div className="space-y-2">
                  <div className="font-bold text-white">Safety Analysis Summary:</div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 whitespace-pre-wrap">
                    {selectedScan.analysis.summary || JSON.stringify(selectedScan.analysis, null, 2)}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedScan(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}
