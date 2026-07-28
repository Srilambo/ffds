import { useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import PageWrapper from './PageWrapper';
import NotificationBell from './NotificationBell';

function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef(null);
  const userMenuRef = useRef(null);
  const desktopMoreRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (desktopMoreRef.current && !desktopMoreRef.current.contains(e.target)) {
        setDesktopMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
    { code: 'ta', name: 'தமிழ்', flag: '🇱🇰' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  const currentLang = languages.find((l) => l.code === (i18n.language || 'en')) || languages[0];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('ffds_language', code);
    setLangOpen(false);
  };

  const roleTheme = {
    admin: {
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10',
      glow: 'shadow-purple-500/20',
      topLine: 'from-purple-500/60 via-indigo-500/40 to-purple-500/60',
      label: '⚡ Admin',
      activeTab: 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-glow shadow-purple-500/20 font-semibold',
      hoverTab: 'hover:text-purple-200 hover:bg-purple-500/10',
      avatarBg: 'from-purple-600 to-indigo-500',
      settingsPath: '/admin/settings',
    },
    manager: {
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10',
      glow: 'shadow-cyan-500/20',
      topLine: 'from-cyan-500/60 via-blue-500/40 to-cyan-500/60',
      label: '💼 Manager',
      activeTab: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-glow shadow-cyan-500/20 font-semibold',
      hoverTab: 'hover:text-cyan-200 hover:bg-cyan-500/10',
      avatarBg: 'from-cyan-600 to-blue-500',
      settingsPath: '/manager/settings',
    },
    farmer: {
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10',
      glow: 'shadow-cyan-500/20',
      topLine: 'from-cyan-500/60 via-blue-500/40 to-cyan-500/60',
      label: '💼 Manager',
      activeTab: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-glow shadow-cyan-500/20 font-semibold',
      hoverTab: 'hover:text-cyan-200 hover:bg-cyan-500/10',
      avatarBg: 'from-cyan-600 to-blue-500',
      settingsPath: '/manager/settings',
    },
    consumer: {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
      glow: 'shadow-emerald-500/20',
      topLine: 'from-emerald-500/60 via-teal-500/40 to-emerald-500/60',
      label: '🍏 Consumer',
      activeTab: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-glow shadow-emerald-500/20 font-semibold',
      hoverTab: 'hover:text-emerald-200 hover:bg-emerald-500/10',
      avatarBg: 'from-emerald-600 to-teal-500',
      settingsPath: '/consumer/settings',
    },
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
          { to: '/admin/reports',       label: t('nav.admin.reports', 'System Audit'), icon: '📄' },
          { to: '/admin/shops-map',     label: 'Shops Map', icon: '🗺️' },
          { to: '/admin/announcements', label: t('nav.admin.announcements', 'Announcements'), icon: '📢' },
          { to: '/admin/languages',     label: t('nav.admin.languages', 'Languages'), icon: '🌐' },
        ];
      case 'manager':
      case 'farmer':
        return [
          { to: '/manager/dashboard',     label: t('nav.dashboard', 'Dashboard'), icon: '📊' },
          { to: '/manager/inventory',     label: t('nav.inventory', 'Stock Control'), icon: '🍎' },
          { to: '/manager/orders',        label: 'Orders', icon: '📦' },
          { to: '/manager/batch-scan',    label: 'Bulk Scan', icon: '⚡' },
          { to: '/manager/scans',         label: t('nav.manager.scans', 'Scan Logs'), icon: '📜' },
          { to: '/manager/waste',         label: t('nav.manager.waste', 'Waste Analytics'), icon: '📉' },
          { to: '/manager/chatbot',       label: t('nav.manager.chatbot', 'AI Advisor'), icon: '🤖' },
        ];
      case 'consumer':
      default:
        return [
          { to: '/home',                   label: t('nav.scan', 'Scan'), icon: '🔍' },
          { to: '/consumer/pantry',        label: 'My Fridge', icon: '🧊' },
          { to: '/consumer/chatbot',       label: 'AI Assistant', icon: '🤖' },
          { to: '/consumer/history',       label: t('nav.consumer.history', 'History'), icon: '📜' },
          { to: '/consumer/recipes',       label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
          { to: '/consumer/shopping-list', label: t('nav.consumer.shoppingList', 'Shopping List'), icon: '📋' },
          { to: '/consumer/settings',      label: t('nav.consumer.settings', 'Profile & Settings'), icon: '👤' },
        ];
    }
  };

  const allNavLinks = getNavLinks();
  
  // Clean desktop nav: show all links if <= 6, otherwise top 5 + dropdown for remainder
  const primaryDesktopLinks = allNavLinks.length <= 6 ? allNavLinks : allNavLinks.slice(0, 5);
  const secondaryDesktopLinks = allNavLinks.length <= 6 ? [] : allNavLinks.slice(5);

  const desktopMoreIsActive = secondaryDesktopLinks.some((l) => isActive(l.to));

  const isConsumer = user?.role === 'consumer' || !user?.role;

  const consumerMobileTabs = [
    { to: '/home', label: t('nav.scan', 'Scan'), icon: '🔍' },
    { to: '/consumer/pantry', label: 'My Fridge', icon: '🧊' },
    { to: '/consumer/recipes', label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
    { to: '/consumer/shopping-list', label: t('nav.consumer.shoppingList', 'List'), icon: '📋' },
  ];

  const consumerMoreLinks = [
    { to: '/consumer/chatbot', label: 'AI Assistant', icon: '🤖' },
    { to: '/consumer/history', label: t('nav.consumer.history', 'History'), icon: '📜' },
    { to: '/consumer/settings', label: t('nav.consumer.settings', 'Profile & Settings'), icon: '👤' },
  ];

  const activeMobileTabs = isConsumer ? consumerMobileTabs : allNavLinks.slice(0, 4);
  const activeMobileMoreLinks = isConsumer ? consumerMoreLinks : allNavLinks.slice(4);

  const mobileMoreIsActive = activeMobileMoreLinks.some((l) => isActive(l.to));

  return (
    <div className="min-h-screen bg-mesh flex flex-col antialiased">
      {/* Top role accent ambient line */}
      <div className={`h-[2px] w-full bg-gradient-to-r ${theme.topLine} z-50 sticky top-0`} />

      {/* Header Container */}
      <header className="sticky top-[2px] z-50 glass border-b border-white/10 shadow-2xl backdrop-blur-xl bg-slate-950/85">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left Column: Brand Logo + Divider + Role Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to={getHomePath()} className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
                <span className="text-slate-950 text-sm font-black tracking-tighter">FF</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base leading-tight tracking-tight flex items-center gap-1.5">
                  FFDS
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-wider uppercase">
                  Food Freshness AI
                </span>
              </div>
            </Link>

            {user && (
              <>
                <div className="hidden lg:block h-5 w-[1px] bg-white/15" />
                <span className={`hidden lg:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border backdrop-blur-md transition-all ${theme.badge}`}>
                  {theme.label}
                </span>
              </>
            )}
          </div>

          {/* Center Column: Clean Desktop Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {primaryDesktopLinks.map(({ to, label, icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all duration-200 whitespace-nowrap ${
                    active
                      ? `${theme.activeTab} border`
                      : `text-slate-300 hover:text-white border border-transparent ${theme.hoverTab}`
                  }`}
                >
                  <span className="text-xs leading-none">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* Desktop More Link Dropdown */}
            {secondaryDesktopLinks.length > 0 && (
              <div className="relative" ref={desktopMoreRef}>
                <button
                  onClick={() => setDesktopMoreOpen((o) => !o)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all duration-200 whitespace-nowrap ${
                    desktopMoreIsActive || desktopMoreOpen
                      ? `${theme.activeTab} border`
                      : `text-slate-300 hover:text-white border border-transparent ${theme.hoverTab}`
                  }`}
                >
                  <span>More</span>
                  <span className="text-[10px] opacity-70">▾</span>
                </button>

                {desktopMoreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass border border-white/15 rounded-2xl shadow-2xl p-1.5 z-[70] animate-fade-up">
                    {secondaryDesktopLinks.map(({ to, label, icon }) => {
                      const active = isActive(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDesktopMoreOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                            active
                              ? `${theme.activeTab} border`
                              : 'text-slate-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="text-sm">{icon}</span>
                          <span className="font-medium">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Column: Language Switcher, Notifications, Compact User Profile, Logout */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Language Switcher Button */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold"
                title="Change Language"
              >
                <span>{currentLang.flag}</span>
                <span className="hidden sm:inline uppercase text-[11px] font-bold tracking-wide">{currentLang.code}</span>
                <span className="text-[10px] opacity-60">▾</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 glass border border-white/15 rounded-2xl shadow-2xl p-1.5 z-[70] animate-fade-up">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 border-b border-white/10 mb-1">
                    Select Language
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageChange(l.code)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        currentLang.code === l.code
                          ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.name}</span>
                      </span>
                      {currentLang.code === l.code && <span className="text-brand-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile Avatar Pill & Dropdown */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all text-left group"
                  title="User Menu"
                >
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-tr ${theme.avatarBg} flex items-center justify-center font-extrabold text-white text-xs shadow-md shrink-0`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:flex flex-col">
                    <span className="text-xs font-semibold text-white max-w-[100px] truncate leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[9px] text-slate-400 capitalize leading-none mt-0.5">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 opacity-60 ml-0.5 hidden sm:inline">▾</span>
                </button>

                {/* Profile Quick Menu Drawer */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 glass border border-white/15 rounded-2xl shadow-2xl p-2 z-[70] animate-fade-up">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border mt-2 ${theme.badge}`}>
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to={theme.settingsPath}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all font-semibold"
                    >
                      <span>👤</span>
                      <span>My Profile & Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-semibold mt-1 border-t border-white/5"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Logout Icon Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-xs"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>

      {/* Mobile Bottom Navigation Bar */}
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
          {activeMobileMoreLinks.length > 0 && (
            <button
              onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                mobileMoreIsActive || mobileMoreOpen ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xl mb-0.5">•••</span>
              <span className="text-[10px]">More</span>
            </button>
          )}
        </div>

        {/* Mobile More Drawer */}
        {mobileMoreOpen && (
          <div className="absolute bottom-16 right-4 z-50 glass border border-white/10 p-3 rounded-2xl shadow-2xl space-y-1 w-48 animate-fade-up">
            {activeMobileMoreLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMoreOpen(false)}
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


