import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/Layout';
import { useAuth } from './context/AuthContext';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Legacy / shared pages
import Scan from './pages/Scan';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';

// ── Admin pages ──────────────────────────────────────────────
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import {
  AdminUsers,
  AdminModels,
  AdminLanguages,
  AdminReports,
  AdminAnnouncements,
  AdminShopsMap,
} from './pages/admin/AdminPages';

// ── Manager pages ────────────────────────────────────────────
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import {
  ManagerInventory,
  ManagerScanHistory,
  ManagerWasteAnalytics,
  ManagerChatbot,
  BatchScan,
  ManagerShopProfile,
  ManagerOrders,
} from './pages/manager/ManagerPages';

// ── Consumer pages ───────────────────────────────────────────
import {
  ConsumerPantry,
  ConsumerHistory,
  ConsumerRecipes,
  ConsumerShoppingList,
  ConsumerSettings,
} from './pages/consumer/ConsumerPages';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'manager' || user.role === 'farmer') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/home" replace />;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* ── Public ── */}
              <Route path="/"         element={<Landing />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── Protected (all roles) ── */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app"  element={<RoleRedirect />} />
                <Route path="/scan" element={<Scan />} />

                {/* ── Admin routes ── */}
                <Route path="/admin/dashboard"     element={<AdminDashboardPage />} />
                <Route path="/admin/users"         element={<AdminUsers />} />
                <Route path="/admin/models"        element={<AdminModels />} />
                <Route path="/admin/languages"     element={<AdminLanguages />} />
                <Route path="/admin/reports"       element={<AdminReports />} />
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/shops-map"     element={<AdminShopsMap />} />

                {/* ── Manager routes ── */}
                <Route path="/manager/dashboard"    element={<ManagerDashboardPage />} />
                <Route path="/manager/inventory"    element={<ManagerInventory />} />
                <Route path="/manager/batch-scan"   element={<BatchScan />} />
                <Route path="/manager/scan"         element={<Navigate to="/manager/batch-scan" replace />} />
                <Route path="/manager/scans"        element={<ManagerScanHistory />} />
                <Route path="/manager/waste"        element={<ManagerWasteAnalytics />} />
                <Route path="/manager/chatbot"      element={<ManagerChatbot />} />
                <Route path="/manager/shop-profile" element={<ManagerShopProfile />} />
                <Route path="/manager/orders"       element={<ManagerOrders />} />

                {/* ── Backward-compat redirects for legacy farmer routes ── */}
                <Route path="/farmer/*" element={<Navigate to="/manager/dashboard" replace />} />

                {/* ── Consumer routes ── */}
                <Route path="/home"                   element={<Scan />} />
                <Route path="/consumer/pantry"        element={<ConsumerPantry />} />
                <Route path="/consumer/history"       element={<ConsumerHistory />} />
                <Route path="/consumer/recipes"       element={<ConsumerRecipes />} />
                <Route path="/consumer/shopping-list" element={<ConsumerShoppingList />} />
                <Route path="/consumer/settings"      element={<ConsumerSettings />} />

                {/* ── Legacy shared routes (backward compat) ── */}
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
