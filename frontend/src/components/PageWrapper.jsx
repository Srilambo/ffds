import { useLocation } from 'react-router-dom';

export default function PageWrapper({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter animate-fade-up">
      {children}
    </div>
  );
}
