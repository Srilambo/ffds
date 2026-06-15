import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">{t('app.title')}</span>
          <Link to="/scan" className="hover:underline">{t('nav.scan')}</Link>
          <Link to="/inventory" className="hover:underline">{t('nav.inventory')}</Link>
          {user?.role === 'manager' && (
            <Link to="/dashboard" className="hover:underline">{t('nav.dashboard')}</Link>
          )}
        </div>
        <button onClick={handleLogout} className="hover:underline">
          {t('nav.logout')}
        </button>
      </nav>
      <main className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
}

export { ProtectedRoute, Layout };
