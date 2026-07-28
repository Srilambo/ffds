import React, { useState, useEffect } from 'react';
import api from '../../api/axiosClient';
import ChatBot from '../../components/ChatBot';

export function ConsumerHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  const loadScans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/scans');
      setScans(Array.isArray(data) ? data : []);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScans(); }, []);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2"><span>📜</span> Scan Log & Telemetry</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Review AI freshness assessments and multi-sensor gas logs.</p>
        </div>
        <button onClick={loadScans} className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all">🔄 Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="spinner h-8 w-8" /></div>
      ) : scans.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500 rounded-2xl">No scans recorded yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map((scan) => (
            <div key={scan._id} onClick={() => setSelectedScan(scan)} className="glass border border-white/10 rounded-2xl overflow-hidden cursor-pointer p-4 space-y-3 hover:border-brand-500/40 transition-all">
              <img src={scan.imageUrl} alt={scan.foodType} className="h-40 w-full object-cover rounded-xl" />
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white capitalize">{scan.foodType}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold">{scan.confidence}%</span>
              </div>
              <p className="text-xs text-slate-400 italic truncate">"{scan.chatbotExplanation || 'AI scan completed'}"</p>
            </div>
          ))}
        </div>
      )}

      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg p-6 rounded-2xl border border-white/15 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="font-bold text-white text-lg capitalize">{selectedScan.foodType} Report</h2>
              <button onClick={() => setSelectedScan(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={selectedScan.imageUrl} alt={selectedScan.foodType} className="rounded-xl h-48 w-full object-cover" />
            <ChatBot scanId={selectedScan._id} initialExplanation={selectedScan.chatbotExplanation} />
          </div>
        </div>
      )}
    </div>
  );
}
