import { useTranslation } from 'react-i18next';
import ChatBot from './ChatBot';

const labelConfig = {
  Fresh:      { cls: 'badge-fresh',      icon: '✅', bar: 'from-brand-600 to-brand-400' },
  Borderline: { cls: 'badge-borderline', icon: '⚠️', bar: 'from-amber-600 to-amber-400' },
  Spoiled:    { cls: 'badge-spoiled',    icon: '❌', bar: 'from-red-700 to-red-500' },
};

function GasStat({ label, value, unit = 'ppm', max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-mono font-bold">{value} <span className="text-slate-500 font-normal">{unit}</span></span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ScanResult({ scan, onAddToInventory }) {
  const { t } = useTranslation();
  const cfg = labelConfig[scan.label] || labelConfig.Fresh;

  return (
    <div className="glass p-6 space-y-6 fade-up">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('result.foodType')}</p>
          <p className="text-2xl font-bold text-white capitalize">{scan.foodType}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className={`text-3xl`}>{cfg.icon}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
            {t(`label.${scan.label}`)}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400 font-medium">{t('result.confidence')}</span>
          <span className="text-white font-bold font-mono">{scan.confidence}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill bg-gradient-to-r ${cfg.bar}`}
            style={{ width: `${scan.confidence}%` }}
          />
        </div>
      </div>

      {/* Gas sensor readings */}
      <div className="glass bg-white/2 p-4 rounded-xl space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          🌡️ {t('result.gasReadings')}
        </h3>
        <GasStat label={t('result.nh3')}      value={scan.gasReadings.nh3}      max={100} color="from-blue-700 to-blue-400" />
        <GasStat label={t('result.h2s')}      value={scan.gasReadings.h2s}      max={50}  color="from-purple-700 to-purple-400" />
        <GasStat label={t('result.ethylene')} value={scan.gasReadings.ethylene} max={200} color="from-teal-700 to-teal-400" />
      </div>

      {/* AI Chatbot */}
      <ChatBot scanId={scan._id} initialExplanation={scan.chatbotExplanation} />

      {/* Add to inventory */}
      <button
        id="add-to-inventory-btn"
        onClick={() => onAddToInventory(scan)}
        className="btn-glow w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
      >
        🍎 {t('result.addToInventory')}
      </button>
    </div>
  );
}
