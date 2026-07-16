import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingMobile from '../components/landing/LandingMobile';
import LandingTablet from '../components/landing/LandingTablet';
import LandingDesktop from '../components/landing/LandingDesktop';

function getDashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  if (role === 'farmer') return '/farmer/dashboard';
  return '/home';
}

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return (
    <div className="page-enter">
      <LandingMobile />
      <LandingTablet />
      <LandingDesktop />
    </div>
  );
}
