import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { icon: '🔬', title: 'CNN Image Classification', desc: 'Deep learning vision for instant food type & quality detection' },
  { icon: '🌡️', title: 'Multi-Gas Sensor Analysis', desc: 'NH₃, H₂S & ethylene readings for scientific freshness scoring' },
  { icon: '🤖', title: 'Gemini AI Chatbot', desc: 'Smart recommendations, recipes & waste reduction tips' },
  { icon: '📊', title: 'Inventory & Waste Tracking', desc: 'Real-time dashboards for managers, farmers & consumers' },
];

export default function LandingTablet() {
  const { t } = useTranslation();

  return (
    <div className="hidden md:flex lg:hidden min-h-screen bg-mesh flex-col">
      <header className="px-8 py-5 flex items-center justify-between animate-slide-down">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <span className="text-white font-black">FF</span>
          </div>
          <div>
            <p className="text-white font-bold">FFDS</p>
            <p className="text-slate-500 text-xs">Food Freshness Detection</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            {t('auth.login')}
          </Link>
          <Link to="/register" className="btn-glow px-5 py-2 rounded-lg text-sm font-semibold text-white">
            {t('auth.register')}
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-8 py-6">
        <div className="grid grid-cols-2 gap-8 items-center mb-12">
          <section className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              AI + IoT Food Safety
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Smarter Freshness<br />
              <span className="gradient-text">For Every Role</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              From farm to table — scan, analyze, and reduce food waste with CNN vision and gas sensor fusion.
            </p>
            <div className="flex gap-3">
              <Link to="/register" className="btn-glow px-6 py-3 rounded-xl text-white font-semibold text-sm animate-shimmer">
                Get Started →
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-all"
              >
                {t('auth.login')}
              </Link>
            </div>
          </section>

          <div className="relative h-64 animate-scale-in delay-200">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600/25 to-surface-3 border border-white/10 flex items-center justify-center">
              <span className="text-7xl animate-bounce-gentle">🍎</span>
            </div>
            <div className="absolute -top-3 -right-3 glass px-3 py-2 rounded-xl text-sm text-brand-400 font-bold animate-float-slow">
              Fresh ✓
            </div>
            <div className="absolute -bottom-3 -left-3 glass px-3 py-2 rounded-xl text-xs text-slate-400 animate-float-slower">
              Confidence 96.4%
            </div>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-4">
          {FEATURES.map(({ icon, title, desc }, i) => (
            <div
              key={title}
              className="glass p-5 card-hover animate-fade-up group"
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform duration-300">{icon}</span>
              <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-8 py-5 border-t border-white/5 flex justify-between text-xs text-slate-600 animate-fade-in">
        <span>© 2026 FFDS</span>
        <span>UN SDG Goal 12 — Responsible Consumption</span>
      </footer>
    </div>
  );
}
