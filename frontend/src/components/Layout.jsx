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

  const roleTheme = {
    admin:    { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', glow: 'shadow-purple-500/20', label: 'Admin Console' },
    manager:  { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', glow: 'shadow-blue-500/20', label: 'Manager Suite' },
    farmer:   { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', glow: 'shadow-blue-500/20', label: 'Manager Suite' },
    consumer: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', glow: 'shadow-emerald-500/20', label: 'My Fridge' },
  };

  const currentRole = user?.role || 'consumer';
  const theme = roleTheme[currentRole] || roleTheme.consumer;

  const getHomePath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'manager' || user.role === 'farmer') return '/manager/dashboard';
    return '/home';
  };

  const getNavLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard',     label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
          { to: '/admin/users',         label: t('nav.admin.users', 'Users'), icon: '👥' },
          { to: '/admin/models',        label: t('nav.admin.models', 'AI Models'), icon: '🧠' },
          { to: '/admin/languages',     label: t('nav.admin.languages', 'Languages'), icon: '🌐' },
          { to: '/admin/reports',       label: t('nav.admin.reports', 'System Audit'), icon: '📄' },
          { to: '/admin/announcements', label: t('nav.admin.announcements', 'Announcements'), icon: '📢' },
          { to: '/admin/shops-map',     label: 'Shops Map', icon: '🗺️' },
        ];
      case 'manager':
      case 'farmer':
        return [
          { to: '/manager/dashboard',     label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
          { to: '/manager/inventory',     label: t('nav.inventory', 'Stock Control'), icon: '🍎' },
          { to: '/manager/shop-profile',  label: 'Shop Profile', icon: '🏪' },
          { to: '/manager/orders',        label: 'Orders', icon: '📦' },
          { to: '/manager/batch-scan',    label: 'Bulk Scan', icon: '📦' },
          { to: '/manager/scans',         label: t('nav.manager.scans', 'Scan Logs'), icon: '📜' },
          { to: '/manager/waste',         label: t('nav.manager.waste', 'Waste Analytics'), icon: '📉' },
          { to: '/manager/chatbot',       label: t('nav.manager.chatbot', 'AI Advisor'), icon: '🤖' },
        ];
      case 'consumer':
      default:
        return [
          { to: '/home',                   label: t('nav.scan', 'Scan'), icon: '🔍' },
          { to: '/consumer/pantry',        label: 'My Fridge', icon: '🧊' },
          { to: '/consumer/history',       label: t('nav.consumer.history', 'History'), icon: '📜' },
          { to: '/consumer/recipes',       label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
          { to: '/consumer/shopping-list', label: t('nav.consumer.shoppingList', 'Shopping List'), icon: '📋' },
          { to: '/consumer/settings',      label: t('nav.consumer.settings', 'Settings'), icon: '⚙️' },
        ];
    }
  };

  const navLinks = getNavLinks();
  const isConsumer = user?.role === 'consumer' || !user?.role;

  const mobileTabs = navLinks.slice(0, 4);
  const mobileMoreLinks = navLinks.slice(4);

  const consumerMobileTabs = [
    { to: '/home', label: t('nav.scan', 'Scan'), icon: '🔍' },
    { to: '/consumer/pantry', label: 'My Fridge', icon: '🧊' },
    { to: '/consumer/recipes', label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
    { to: '/consumer/shopping-list', label: t('nav.consumer.shoppingList', 'List'), icon: '📋' },
  ];

  const consumerMoreLinks = [
    { to: '/consumer/history', label: t('nav.consumer.history', 'History'), icon: '📜' },
    { to: '/consumer/settings', label: t('nav.consumer.settings', 'Settings'), icon: '⚙️' },
  ];

  const activeMobileTabs = isConsumer ? consumerMobileTabs : mobileTabs;
  const activeMoreLinks = isConsumer ? consumerMoreLinks : mobileMoreLinks;

  const moreIsActive = activeMoreLinks.some((l) => isActive(l.to));

  return (
    <div className="min-h-screen bg-mesh flex flex-col antialiased">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Role Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to={getHomePath()} className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
                <span className="text-slate-950 text-base font-black tracking-tighter">FF</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-lg leading-tight tracking-tight flex items-center gap-1.5">
                  FFDS
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Food Freshness AI
                </span>
              </div>
            </Link>

            {user && (
              <span className={`hidden xl:inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${theme.badge}`}>
                {theme.label}
              </span>
            )}
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 flex-1 justify-center max-w-3xl overflow-x-auto no-scrollbar">
            {navLinks.map(({ to, label, icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-[11px] xl:text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-glow shadow-brand-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-xs xl:text-sm leading-none">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {user && (
              <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-xs shadow-sm shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white max-w-[70px] xl:max-w-[120px] truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            <NotificationBell />

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main page view */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 px-2 py-1.5 shadow-2xl safe-bottom">
        <div className="flex items-center justify-around">
          {activeMobileTabs.map(({ to, label, icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  active ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xl mb-0.5">{icon}</span>
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}
          {activeMoreLinks.length > 0 && (
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                moreIsActive || moreOpen ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xl mb-0.5">•••</span>
              <span className="text-[10px]">More</span>
            </button>
          )}
        </div>

        {/* Mobile More Drawer */}
        {moreOpen && (
          <div className="absolute bottom-16 right-4 z-50 glass border border-white/10 p-3 rounded-2xl shadow-2xl space-y-1 w-48 animate-fade-up">
            {activeMoreLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive(to)
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default Layout;
