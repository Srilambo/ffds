import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosClient';

export function ManagerScanHistory() {
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ foodType: '', label: '', startDate: '', endDate: '' });
  const limit = 20;

  const fetchScans = async () => {
    try {
      const res = await api.get('/manager/scans', { params: { page, limit, ...filters } });
      setScans(res.data.scans);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page, filters]);

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>📜</span> Business Scan Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete records of all audit scans, classification confidence, and sensor readouts.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass p-4 rounded-2xl flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Filter by food name..."
          value={filters.foodType}
          onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl flex-1 min-w-[150px]"
        />
        <select
          value={filters.label}
          onChange={(e) => setFilters({ ...filters, label: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl"
        >
          <option value="">All Freshness Ratings</option>
          <option value="Fresh">Fresh</option>
          <option value="Borderline">Borderline</option>
          <option value="Spoiled">Spoiled</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="input-dark px-3 py-2 text-xs rounded-xl"
        />
        {(filters.foodType || filters.label || filters.startDate || filters.endDate) && (
          <button
            onClick={() => setFilters({ foodType: '', label: '', startDate: '', endDate: '' })}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/5">
                <th className="text-left py-3.5 px-4">Produce</th>
                <th className="text-left py-3.5 px-4">Status</th>
                <th className="text-left py-3.5 px-4 hidden sm:table-cell font-mono">Confidence</th>
                <th className="text-left py-3.5 px-4 hidden md:table-cell font-mono">Gas Sensors (NH₃ / H₂S / Ethylene)</th>
                <th className="text-left py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <tr key={s._id} className="border-b border-white/5 text-slate-300 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white capitalize">{s.foodType}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        s.label === 'Fresh'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : s.label === 'Borderline'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell font-mono font-bold text-white">{s.confidence}%</td>
                  <td className="py-3 px-4 hidden md:table-cell text-[11px] font-mono text-slate-400">
                    NH₃:<span className="text-white font-bold">{s.gasReadings?.nh3}</span> ppm · H₂S:
                    <span className="text-white font-bold">{s.gasReadings?.h2s}</span> ppm · Ethylene:
                    <span className="text-white font-bold">{s.gasReadings?.ethylene}</span> ppm
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!scans.length && !loading && (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <span className="text-5xl">🔍</span>
            <p className="text-white font-bold">No scan records matching your filter</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(Math.ceil(total / limit), p + 1))}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
export default ManagerScanHistory;
