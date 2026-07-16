import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { icon: '🔬', title: 'CNN Image Classification', desc: 'Deep learning vision models classify food type and visual freshness in seconds.' },
  { icon: '🌡️', title: 'Multi-Gas Sensor Fusion', desc: 'NH₃, H₂S and ethylene readings combined for scientific spoilage detection.' },
  { icon: '🤖', title: 'Gemini AI Assistant', desc: 'Context-aware chatbot for recipes, storage tips, and waste reduction.' },
  { icon: '📊', title: 'Role-Based Dashboards', desc: 'Tailored views for consumers, farmers, managers, and administrators.' },
];

const STATS = [
  { value: '4', label: 'User Roles' },
  { value: '6', label: 'Languages' },
  { value: '3', label: 'Sensor Types' },
  { value: '24/7', label: 'AI Support' },
];

export default function LandingDesktop() {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:flex min-h-screen bg-mesh flex-col">
      <header className="px-12 py-6 flex items-center justify-between animate-slide-down">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <span className="text-white text-lg font-black">FF</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg">Food Freshness Detection System</p>
            <p className="text-slate-500 text-sm">Reduce waste · Protect quality · Empower every stakeholder</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <a href="#features" className="nav-link px-2 py-1">Features</a>
          <a href="#stats" className="nav-link px-2 py-1">Platform</a>
          <Link to="/login" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            {t('auth.login')}
          </Link>
          <Link to="/register" className="btn-glow px-6 py-2.5 rounded-xl text-sm font-semibold text-white">
            {t('auth.register')} →
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-12">
        <section className="grid grid-cols-2 gap-16 items-center py-16 min-h-[70vh]">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
              <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              UN SDG Goal 12 — Responsible Consumption & Production
            </div>
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-6">
              AI-Powered Food<br />
              <span className="gradient-text">Freshness Intelligence</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-lg mb-8">
              Combining CNN computer vision with gas sensor data and Gemini AI — helping farms, stores, and households cut food waste before it starts.
            </p>
            <div className="flex gap-4">
              <Link to="/register" className="btn-glow px-8 py-3.5 rounded-xl text-white font-semibold animate-shimmer">
                Create Free Account →
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 hover:border-white/20 transition-all"
              >
                {t('auth.login')}
              </Link>
            </div>
          </div>

          <div className="relative h-[420px] animate-scale-in delay-200">
            <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-brand-600/20 via-surface-3 to-surface-2 border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.15),transparent_60%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl animate-bounce-gentle select-none">🥗</span>
              </div>
            </div>

            <div className="absolute top-0 right-0 glass px-4 py-3 rounded-2xl animate-float-slow shadow-glow/20">
              <p className="text-xs text-slate-500 mb-0.5">Freshness Score</p>
              <p className="text-2xl font-bold text-brand-400">98.2%</p>
            </div>
            <div className="absolute bottom-8 left-0 glass px-4 py-3 rounded-2xl animate-float-slower">
              <p className="text-xs text-slate-500 mb-1">Gas Readings</p>
              <div className="flex gap-3 text-xs font-mono text-slate-300">
                <span>NH₃ 12ppm</span>
                <span>H₂S 3ppm</span>
              </div>
            </div>
            <div className="absolute top-1/2 -right-4 glass px-3 py-2 rounded-xl text-xs text-brand-300 font-semibold animate-fade-in delay-700">
              CNN + Sensors ✓
            </div>
          </div>
        </section>

        <section id="stats" className="py-12 border-y border-white/5 animate-fade-up delay-300">
          <div className="grid grid-cols-4 gap-6">
            {STATS.map(({ value, label }, i) => (
              <div key={label} className="text-center animate-fade-up" style={{ animationDelay: `${400 + i * 80}ms` }}>
                <p className="text-3xl font-extrabold gradient-text mb-1">{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="py-16">
          <div className="text-center mb-12 animate-fade-up">
            <h2 className="text-3xl font-bold text-white mb-3">Everything You Need</h2>
            <p className="text-slate-500 max-w-xl mx-auto">One platform connecting vision AI, IoT sensors, and intelligent assistants across the food supply chain.</p>
          </div>
          <div className="grid grid-cols-4 gap-5">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div
                key={title}
                className="glass p-6 card-hover animate-fade-up group"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">{icon}</span>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 mb-8">
          <div className="glass p-10 rounded-2xl flex items-center justify-between animate-fade-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-2">Ready to reduce food waste?</h2>
              <p className="text-slate-400">Join as a consumer, farmer, manager, or admin — get started in under a minute.</p>
            </div>
            <div className="relative flex gap-3 shrink-0">
              <Link to="/login" className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 transition-all">
                {t('auth.login')}
              </Link>
              <Link to="/register" className="btn-glow px-8 py-3 rounded-xl text-white font-semibold">
                {t('auth.register')} →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-12 py-6 border-t border-white/5 flex justify-between text-sm text-slate-600 animate-fade-in">
        <span>© 2026 Food Freshness Detection System</span>
        <span>Built for sustainable food management</span>
      </footer>
    </div>
  );
}
