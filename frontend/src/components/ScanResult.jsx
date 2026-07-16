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

  // Format expiration date
  const formatExpiryDate = (date) => {
    if (!date) return null;
    const expiry = new Date(date);
    return expiry.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate days until expiration
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const expiryDate = formatExpiryDate(scan.expiryDate);
  const daysUntilExpiry = getDaysUntilExpiry(scan.expiryDate);

  return (
    <div className="glass p-4 md:p-6 space-y-5 md:space-y-6 card-hover h-full">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('result.foodType')}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold">
              {t('result.aiDetected', 'AI Detected')}
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white capitalize">{scan.foodType}</p>
          {expiryDate && (
            <p className="text-xs text-slate-400 mt-1">
              Expires: <span className="text-white font-medium">{expiryDate}</span>
              {daysUntilExpiry !== null && (
                <span className={`ml-2 ${daysUntilExpiry <= 2 ? 'text-red-400' : 'text-brand-400'}`}>
                  ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'})
                </span>
              )}
            </p>
          )}
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
      <div className="glass bg-white/[0.02] p-4 rounded-xl space-y-4">
        <div className="grid sm:grid-cols-1 gap-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          🌡️ {t('result.gasReadings')}
        </h3>
        <GasStat label={t('result.nh3')}      value={scan.gasReadings.nh3}      max={100} color="from-blue-700 to-blue-400" />
        <GasStat label={t('result.h2s')}      value={scan.gasReadings.h2s}      max={50}  color="from-purple-700 to-purple-400" />
        <GasStat label={t('result.ethylene')} value={scan.gasReadings.ethylene} max={200} color="from-teal-700 to-teal-400" />
        </div>
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
