import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const roleColor = {
    admin:    'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    manager:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    farmer:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    consumer: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
  };

  const getHomePath = () => {
    if (!user) return '/login';
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
          { to: '/manager/staff',       label: t('nav.manager.staff', 'Staff'), icon: '👥' },
          { to: '/manager/scans',       label: t('nav.manager.scans', 'Scans'), icon: '🔍' },
          { to: '/manager/waste',       label: t('nav.manager.waste', 'Waste'), icon: '🗑️' },
          { to: '/manager/chatbot',     label: t('nav.manager.chatbot', 'Chatbot'), icon: '🤖' },
          { to: '/manager/branches',    label: t('nav.manager.branches', 'Branches'), icon: '🏢' },
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
          { to: '/home',                 label: t('nav.scan', 'Scan'), icon: '🔍' },
          { to: '/consumer/pantry',      label: t('nav.consumer.pantry', 'My Pantry'), icon: '🍎' },
          { to: '/consumer/history',     label: t('nav.consumer.history', 'History'), icon: '📜' },
          { to: '/consumer/recipes',     label: t('nav.consumer.recipes', 'Recipes'), icon: '🍳' },
          { to: '/consumer/shopping-list',label: t('nav.consumer.shoppingList', 'Shopping List'), icon: '📋' },
          { to: '/consumer/settings',    label: t('nav.consumer.settings', 'Settings'), icon: '⚙️' },
        ];
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={getHomePath()} className="flex items-center gap-2.5 group">
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

          {/* Nav links */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-[50%] md:max-w-none scrollbar-none py-1">
            {getNavLinks().map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                  isActive(to)
                    ? 'bg-brand-600/20 text-brand-400 shadow-glow/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-slate-500">{user.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                  roleColor[user.role] || roleColor.consumer
                }`}>
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Page ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-4 text-center text-xs text-slate-600">
        FFDS © {new Date().getFullYear()} — Food Freshness Detection System · UN SDG Goal 12
      </footer>
    </div>
  );
}

function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
}

export { ProtectedRoute, Layout };
