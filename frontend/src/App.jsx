import { useState } from 'react';
import SplashScreen from './components/SplashScreen';
import AppRoutes from './AppRoutes';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      {splashDone && (
        <div className="page-enter">
          <AppRoutes />
        </div>
      )}
    </>
  );
}
