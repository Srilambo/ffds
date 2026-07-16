import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import PageWrapper from './PageWrapper';
import NotificationBell from './NotificationBell';

function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const roleColor = {
    admin:    'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    manager:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    farmer:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    consumer: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
  };

  const getHomePath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'manager') return '/manager/dashboard';
    if (user.role === 'farmer') return '/farmer/dashboard';
    return '/home';
  };

  const getNavLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard',     label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
          { to: '/admin/users',         label: t('nav.admin.users', 'Users'), icon: '👥' },
          { to: '/admin/models',        label: t('nav.admin.models', 'Models'), icon: '🧠' },
          { to: '/admin/languages',     label: t('nav.admin.languages', 'Languages'), icon: '🌐' },
          { to: '/admin/reports',       label: t('nav.admin.reports', 'Reports'), icon: '📄' },
          { to: '/admin/announcements', label: t('nav.admin.announcements', 'Announcements'), icon: '📢' },
        ];
case 'manager':
        return [
          { to: '/manager/dashboard',   label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
          { to: '/manager/inventory',   label: t('nav.inventory', 'Inventory'), icon: '🍎' },
          { to: '/manager/scan',        label: t('nav.scan', 'Scan'), icon: '🔍' },
          { to: '/manager/scans',       label: t('nav.manager.scans', 'Scan History'), icon: '📜' },
          { to: '/manager/waste',       label: t('nav.manager.waste', 'Waste Analytics'), icon: '📉' },
          { to: '/manager/chatbot',     label: t('nav.manager.chatbot', 'AI Advisor'), icon: '🤖' },
        ];
      case 'farmer':
        return [
          { to: '/farmer/dashboard',     label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
          { to: '/farmer/batch-scan',    label: t('nav.farmer.batchScan', 'Batch Scan'), icon: '📦' },
          { to: '/farmer/calendar',      label: t('nav.farmer.calendar', 'Calendar'), icon: '📅' },
          { to: '/farmer/loss-tracking', label: t('nav.farmer.lossTracking', 'Loss Tracker'), icon: '📉' },
          { to: '/farmer/buyer-reports', label: t('nav.farmer.buyerReports', 'Buyer Reports'), icon: '📜' },
          { to: '/farmer/chatbot',       label: t('nav.farmer.chatbot', 'Chatbot'), icon: '🤖' },
        ];
      case 'consumer':
      default:
        return [
          { to: '/home',                  label: t('nav.scan', 'Scan'), icon: '🔍' },
          { to: '/consumer/pantry',       label: t('nav.consumer.pantry', 'My Pantry'), icon: '🍎' },
          { to: '/consumer/history',      label: t('nav.consumer.history', 'History'), icon: '📜' },
          { to: '/consumer/recipes',      label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
          { to: '/consumer/shopping-list', label: t('nav.consumer.shoppingList', 'Shopping List'), icon: '📋' },
          { to: '/consumer/settings',     label: t('nav.consumer.settings', 'Settings'), icon: '⚙️' },
        ];
    }
  };

  const navLinks = getNavLinks();
  const isConsumer = user?.role === 'consumer' || !user?.role;

  // Mobile bottom tabs (first 4 items for all roles)
  const mobileTabs = navLinks.slice(0, 4);

  // Mobile more links (remaining items)
  const mobileMoreLinks = navLinks.slice(4);

  const consumerMobileTabs = [
    { to: '/home', label: t('nav.scan', 'Scan'), icon: '🔍' },
    { to: '/consumer/pantry', label: t('nav.consumer.pantry', 'Pantry'), icon: '🍎' },
    { to: '/consumer/recipes', label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
    { to: '/consumer/shopping-list', label: t('nav.consumer.shoppingList', 'List'), icon: '📋' },
  ];

  const consumerMoreLinks = [
    { to: '/consumer/history', label: t('nav.consumer.history', 'History'), icon: '📜' },
    { to: '/consumer/settings', label: t('nav.consumer.settings', 'Settings'), icon: '⚙️' },
  ];

  const moreIsActive = isConsumer 
    ? consumerMoreLinks.some((l) => isActive(l.to))
    : mobileMoreLinks.some((l) => isActive(l.to));

  const NavLinkItem = ({ to, label, icon, onClick, className = '' }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-pill flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
        isActive(to)
          ? 'active text-brand-400 bg-brand-600/15'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      } ${className}`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* ── Navbar (hidden on mobile) ── */}
      <header className="hidden md:block sticky top-0 z-50 glass border-b border-white/5 shadow-lg animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to={getHomePath()} className="flex items-center gap-2.5 group shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <span className="text-white text-sm font-black">FF</span>
            </div>
            <span className="font-bold text-white tracking-tight">
              FFDS
              <span className="text-brand-400 text-xs font-normal ml-1 hidden sm:inline">
                Food Freshness
              </span>
            </span>
          </Link>

          {/* Desktop nav (lg+) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center overflow-x-auto scrollbar-none py-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-pill flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                  isActive(to)
                    ? 'active bg-brand-600/15 text-brand-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Tablet nav (md to lg) — icons + short labels */}
          <nav className="hidden md:flex lg:hidden items-center gap-0.5 flex-1 justify-center overflow-x-auto scrollbar-none py-1 max-w-[55%]">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                title={label}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all shrink-0 min-w-[52px] ${
                  isActive(to)
                    ? 'text-brand-400 bg-brand-600/15'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="truncate max-w-[52px]">{label.split(' ')[0]}</span>
              </Link>
            ))}
          </nav>


          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-slate-500 max-w-[100px] truncate">{user.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                  roleColor[user.role] || roleColor.consumer
                }`}>
                  {user.role}
                </span>
              </div>
            )}
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden md:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Page ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 pb-nav md:pb-8">
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>

      {/* ── Footer (hidden on mobile — bottom nav takes space) ── */}
      <footer className="hidden md:block border-t border-white/5 py-4 text-center text-xs text-slate-600">
        FFDS © {new Date().getFullYear()} — Food Freshness Detection System · UN SDG Goal 12
      </footer>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bottom-nav safe-bottom">
        <div className="grid grid-cols-5 h-[68px] px-1">
          {(isConsumer ? consumerMobileTabs : mobileTabs).map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`bottom-nav-item relative ${isActive(to) ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="truncate max-w-full px-0.5">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={`bottom-nav-item relative ${moreIsActive ? 'active' : ''}`}
          >
            <span className="nav-icon">⋯</span>
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile "More" sheet ── */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm drawer-overlay" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 glass rounded-t-3xl border-t border-white/10 p-6 pb-8 safe-bottom drawer-panel-right">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">More Options</p>
              <NotificationBell />
            </div>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="space-y-2 stagger-children">
              {(isConsumer ? consumerMoreLinks : mobileMoreLinks).map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isActive(to)
                      ? 'bg-brand-600/15 border border-brand-500/30 text-brand-300'
                      : 'bg-white/5 border border-white/8 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="font-semibold">{label}</span>
                </Link>
              ))}
              <button
                onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="flex items-center gap-4 p-4 rounded-2xl w-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all"
              >
                <span className="text-2xl">🚪</span>
                <span className="font-semibold">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return <Layout />;
}

export { ProtectedRoute, Layout };
