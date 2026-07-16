import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { icon: '🔬', title: 'CNN Vision', desc: 'Instant food classification' },
  { icon: '🌡️', title: 'Gas Sensors', desc: 'Multi-gas freshness analysis' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Gemini-powered guidance' },
  { icon: '📊', title: 'Track Waste', desc: 'Inventory & expiry alerts' },
];

export default function LandingMobile() {
  const { t } = useTranslation();

  return (
    <div className="md:hidden min-h-screen bg-mesh flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 py-3 animate-slide-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
              <span className="text-white text-sm font-black">FF</span>
            </div>
            <span className="text-white font-bold text-sm">FFDS</span>
          </div>
          <div className="flex gap-2">
            <Link to="/login" className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
              {t('auth.login')}
            </Link>
            <Link to="/register" className="btn-glow px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-8 pb-10">
        <section className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            UN SDG Goal 12
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Detect Freshness<br />
            <span className="gradient-text">Before It&apos;s Too Late</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            AI-powered food quality analysis combining vision models with gas sensor data.
          </p>
        </section>

        <div className="relative h-44 mb-10 animate-scale-in delay-200">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600/20 to-surface-3 border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="text-6xl animate-bounce-gentle">🥬</div>
            <div className="absolute top-3 right-3 glass px-2 py-1 rounded-lg text-xs text-brand-400 font-semibold animate-fade-in delay-500">
              98% Fresh
            </div>
            <div className="absolute bottom-3 left-3 glass px-2 py-1 rounded-lg text-xs text-slate-400 animate-fade-in delay-700">
              🌡️ NH₃ · H₂S · C₂H₄
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-10 animate-fade-up delay-300">
          <Link to="/register" className="btn-glow w-full py-3.5 rounded-xl text-white font-semibold text-sm text-center animate-shimmer">
            Get Started Free →
          </Link>
          <Link
            to="/login"
            className="w-full py-3.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm text-center hover:bg-white/5 transition-all"
          >
            {t('auth.login')}
          </Link>
        </div>

        <section className="space-y-3">
          {FEATURES.map(({ icon, title, desc }, i) => (
            <div
              key={title}
              className="glass p-4 flex items-center gap-4 card-hover animate-fade-up"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <span className="text-2xl h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{icon}</span>
              <div>
                <h3 className="text-white font-semibold text-sm">{title}</h3>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-4 py-6 border-t border-white/5 text-center text-xs text-slate-600 animate-fade-in">
        © 2026 FFDS — Responsible Consumption & Production
      </footer>
    </div>
  );
}
