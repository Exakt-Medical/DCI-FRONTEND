import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./authentication/LoginPage";
import { RegistrationWizard } from "./authentication/RegistrationWizard";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CompanyPage } from "./features/company/CompanyPage";
import { VerificationPage } from "./features/verification/VerificationPage";
import Vouchers from "./features/voucher/Vouchers";
import { PlaceholderPage } from "./features/placeholder/PlaceholderPage";

function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole && role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<RegistrationWizardWithNav />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayoutWrapper role={role} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function RegistrationWizardWithNav() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <RegistrationWizard
      onComplete={() => window.location.href = "/login"}
      onCancel={() => window.location.href = "/login"}
    />
  );
}

function AdminLayoutWrapper({ role }) {
  const { logout } = useAuth();
  return (
    <AdminLayoutWithRoutes role={role} onLogout={logout} />
  );
}

function AdminLayoutWithRoutes({ role, onLogout }) {
  return (
    <AdminLayout role={role} onLogout={onLogout}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/company" element={<ProtectedRoute allowedRole="ADMIN"><CompanyPage /></ProtectedRoute>} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/accounts" element={<PlaceholderPage title="Accounts" icon="👥" description="Manage user accounts, roles, and permissions." />} />
        <Route path="/vehicles" element={<ProtectedRoute allowedRole="ADMIN"><PlaceholderPage title="Vehicle Database" icon="🚗" description="Browse and manage the LTO vehicle registry database." /></ProtectedRoute>} />
        <Route path="/mvtype" element={<ProtectedRoute allowedRole="ADMIN"><PlaceholderPage title="MV Type" icon="📋" description="Configure motor vehicle type classifications." /></ProtectedRoute>} />
        <Route path="/activitylogs" element={<PlaceholderPage title="Activity Logs" icon="📝" description="Full audit trail of system activities." />} />
        <Route path="/transactions" element={<PlaceholderPage title="Transactions" icon="💳" description="View and manage CTPL insurance transaction records." />} />
        <Route path="/" element={<Navigate to={role === "ADMIN" ? "/dashboard" : "/verification"} replace />} />
        <Route path="*" element={<Navigate to={role === "ADMIN" ? "/dashboard" : "/verification"} replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="font-sans">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}