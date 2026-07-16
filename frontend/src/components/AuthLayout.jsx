import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AuthLayout({ children, title, subtitle, variant = 'login' }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 py-8 md:py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-emerald-400/8 rounded-full blur-3xl animate-float-slower pointer-events-none" />

      {/* Mobile layout */}
      <div className="md:hidden w-full max-w-md animate-fade-up">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors">
          ← Back to home
        </Link>
        <div className="glass shadow-2xl overflow-hidden">
          <div className="p-6 pb-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-4 animate-scale-in">
              <span className="text-white font-black">FF</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>

      {/* Tablet layout */}
      <div className="hidden md:flex lg:hidden w-full max-w-2xl animate-fade-up">
        <div className="glass shadow-2xl w-full overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-brand-900/40 to-transparent border-b border-white/5">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-4 transition-colors">
              ← Back to home
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow animate-scale-in">
                <span className="text-white font-black">FF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-slate-500 text-sm">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="p-8">{children}</div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid w-full max-w-5xl grid-cols-2 gap-0 glass overflow-hidden shadow-2xl animate-fade-up">
        <div className="relative flex flex-col justify-between p-10 bg-gradient-to-br from-brand-900/60 to-surface-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-glow pointer-events-none" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors">
              ← Back to home
            </Link>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-8 animate-scale-in">
              <span className="text-white text-xl font-black">FF</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Food Freshness<br />
              <span className="gradient-text">Detection System</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {variant === 'register'
                ? 'Create your account and start scanning food with AI-powered freshness detection.'
                : 'Welcome back — sign in to access your personalized dashboard and food insights.'}
            </p>
          </div>

          <div className="relative space-y-3 mt-8">
            {[
              { icon: '🔬', label: 'CNN Image Classification' },
              { icon: '🌡️', label: 'Multi-Gas Sensor Analysis' },
              { icon: '🤖', label: 'Gemini AI Chatbot' },
            ].map(({ icon, label }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 text-sm text-slate-400 animate-fade-up"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <span className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-10 bg-surface-2/50 max-h-screen overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
