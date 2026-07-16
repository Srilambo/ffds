import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2200;

    const tick = () => {
      const elapsed = Date.now() - start;
      const next = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(next);
      if (next < 100) {
        requestAnimationFrame(tick);
      } else {
        setPhase('exit');
        setTimeout(onFinish, 600);
      }
    };

    requestAnimationFrame(tick);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-1 overflow-hidden transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-mesh animate-mesh-shift" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl animate-float-slower" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="relative mb-8 animate-scale-in">
          <div className="absolute inset-0 rounded-2xl bg-brand-500/30 blur-xl animate-pulse-glow" />
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-glow pulse-ring">
            <span className="text-white text-3xl sm:text-4xl font-black tracking-tight">FF</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2 animate-fade-up delay-200">
          Food Freshness
        </h1>
        <p className="gradient-text text-lg sm:text-xl font-bold mb-10 animate-fade-up delay-300">
          Detection System
        </p>

        <div className="w-48 sm:w-56">
          <div className="progress-bar h-1.5">
            <div
              className="progress-fill transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500 tracking-widest uppercase animate-pulse">
            {progress < 100 ? 'Initializing…' : 'Ready'}
          </p>
        </div>
      </div>
    </div>
  );
}
