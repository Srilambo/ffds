import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout';
import { useAuth } from './context/AuthContext';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';

// Legacy / shared pages
import Scan from './pages/Scan';
import Inventory from './pages/Inventory';
import Dashboard from './pages/Dashboard';

// ── Admin pages ──────────────────────────────────────────────
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import { AdminUsers, AdminModels, AdminLanguages, AdminReports, AdminAnnouncements } from './pages/admin/AdminPages';

// ── Manager pages ────────────────────────────────────────────
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import { ManagerInventory, ManagerStaff, ManagerScans, ManagerWaste, ManagerChatbot, ManagerBranches } from './pages/manager/ManagerPages';

// ── Farmer pages ─────────────────────────────────────────────
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import { BatchScan, FarmerCalendar, LossTracking, BuyerReports, FarmerChatbot } from './pages/farmer/FarmerPages';

// ── Consumer pages ───────────────────────────────────────────
import { ConsumerPantry, ConsumerHistory, ConsumerRecipes, ConsumerShoppingList, ConsumerSettings } from './pages/consumer/ConsumerPages';

/**
 * RoleRedirect — Redirects "/" to the correct home based on JWT role.
 */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'farmer')  return <Navigate to="/farmer/dashboard"  replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* ── Public ── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Protected (all roles) ── */}
          <Route element={<ProtectedRoute />}>

            {/* Root redirect — role-aware */}
            <Route path="/"    element={<RoleRedirect />} />
            <Route path="/scan" element={<Scan />} />  {/* legacy scan route */}

            {/* ── Admin routes ── */}
            <Route path="/admin/dashboard"     element={<AdminDashboardPage />} />
            <Route path="/admin/users"         element={<AdminUsers />} />
            <Route path="/admin/models"        element={<AdminModels />} />
            <Route path="/admin/languages"     element={<AdminLanguages />} />
            <Route path="/admin/reports"       element={<AdminReports />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />

            {/* ── Manager routes ── */}
            <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/manager/inventory" element={<ManagerInventory />} />
            <Route path="/manager/staff"     element={<ManagerStaff />} />
            <Route path="/manager/scans"     element={<ManagerScans />} />
            <Route path="/manager/waste"     element={<ManagerWaste />} />
            <Route path="/manager/chatbot"   element={<ManagerChatbot />} />
            <Route path="/manager/branches"  element={<ManagerBranches />} />

            {/* ── Farmer routes ── */}
            <Route path="/farmer/dashboard"     element={<FarmerDashboard />} />
            <Route path="/farmer/batch-scan"    element={<BatchScan />} />
            <Route path="/farmer/calendar"      element={<FarmerCalendar />} />
            <Route path="/farmer/loss-tracking" element={<LossTracking />} />
            <Route path="/farmer/buyer-reports" element={<BuyerReports />} />
            <Route path="/farmer/chatbot"       element={<FarmerChatbot />} />

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

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
