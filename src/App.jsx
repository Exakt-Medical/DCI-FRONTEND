import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./authentication/LoginPage";
import { CitizenRegister } from "./authentication/CitizenRegister";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { MyRequestsPage } from "./features/my-requests/MyRequestsPage";
import { VoucherRequestPage } from "./features/voucher-request/VoucherRequestPage";
import { VoucherRequestFlow } from "./features/voucher-request/VoucherRequestFlow";
import { AgentBuyVoucherPage } from "./features/voucher-request/AgentBuyVoucherPage";
import { AgentVoucherRequestPage } from "./features/voucher-request/AgentVoucherRequestPage";
import { ClearanceRequestPage } from "./features/clearance-request/ClearanceRequestPage";
import { CitizenClearanceRequestFlow } from "./features/clearance-request/CitizenClearanceRequestFlow";
import { AgentClearanceRequestFlow } from "./features/clearance-request/AgentClearanceRequestFlow";
import { AgentClearanceRequestPage } from "./features/clearance-request/AgentClearanceRequestPage";
import { HpgVerifyPage } from "./features/hpg/HpgVerifyPage";
import { LtoLookupPage } from "./features/lto/LtoLookupPage";
import { ProfilePage } from "./features/Profile/ProfilePage";
import { TicketPage } from "./features/Tickets/TicketPage";
import { TransactionLogsPage } from "./features/TransactionLogs/TransactionLogsPage";
import { ActivityLogsPage } from "./features/ActivityLogs/ActivityLogsPage";
import { AccessLogsPage } from "./features/AccessLogs/AccessLogsPage";
import { AccountPage } from "./features/accounts/AccountPage";
import { PlaceholderPage } from "./features/placeholder/PlaceholderPage";
import { MaintenancePage } from "./features/Maintenance/MaintenancePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Redirect already-authenticated users away from the login page
const LoginRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  const landingMap = {
    citizen: "/dci-access/requests",
    agent_fixer: "/dci-access/requests",
    hpg: "/dci-access/verification",
    lto: "/dci-access/certificate-lookup",
  };
  const dest = landingMap[(role || "").toLowerCase()] || "/dci-access/dashboard";
  return <Navigate to={dest} replace />;
};

const AGENT_ROLES = ["citizen", "agent_fixer", "agent"];
const isAgent = (r) => r === "agent_fixer" || r === "agent";

function App() {
  const { role } = useAuth();
  
  const [hasAccess] = useState(() => {
    return window.location.pathname.includes("/dci-access") || window.location.pathname === "/";
  });

  if (!hasAccess) {
    return <MaintenancePage />;
  }

  return (
    <div className="font-sans">
      <Routes>
        <Route path="/" element={<Navigate to="/dci-access" replace />} />
        
        {/* Public Routes */}
        <Route path="/dci-access" element={<LoginRedirect />} />
        <Route path="/dci-access/register" element={<CitizenRegister />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/dci-access/dashboard" element={<ProtectedRoute allowedRoles={["admin", "agent_fixer", "agent"]}><DashboardPage role={role} /></ProtectedRoute>} />
          <Route path="/dci-access/requests" element={<ProtectedRoute allowedRoles={AGENT_ROLES}><MyRequestsPage role={role} /></ProtectedRoute>} />
          <Route path="/dci-access/profile" element={<ProfilePage role={role} />} />
          
          <Route path="/dci-access/voucher-requests" element={<ProtectedRoute allowedRoles={AGENT_ROLES}>{isAgent(role) ? <AgentVoucherRequestPage /> : <VoucherRequestPage />}</ProtectedRoute>} />
          <Route path="/dci-access/new-voucher-request" element={<ProtectedRoute allowedRoles={AGENT_ROLES}>{isAgent(role) ? <AgentBuyVoucherPage /> : <VoucherRequestFlow role={role} />}</ProtectedRoute>} />
          
          <Route path="/dci-access/clearance-requests" element={<ProtectedRoute allowedRoles={AGENT_ROLES}>{isAgent(role) ? <AgentClearanceRequestPage /> : <ClearanceRequestPage />}</ProtectedRoute>} />
          <Route path="/dci-access/new-clearance-request" element={<ProtectedRoute allowedRoles={AGENT_ROLES}>{isAgent(role) ? <AgentClearanceRequestFlow role={role} /> : <CitizenClearanceRequestFlow role={role} />}</ProtectedRoute>} />
          <Route path="/dci-access/new-certificate-request" element={<ProtectedRoute allowedRoles={AGENT_ROLES}>{isAgent(role) ? <AgentClearanceRequestFlow role={role} /> : <CitizenClearanceRequestFlow role={role} />}</ProtectedRoute>} />
          
          <Route path="/dci-access/verification" element={<ProtectedRoute allowedRoles={["hpg"]}><HpgVerifyPage /></ProtectedRoute>} />
          <Route path="/dci-access/certificate-lookup" element={<ProtectedRoute allowedRoles={["lto"]}><LtoLookupPage /></ProtectedRoute>} />
          
          <Route path="/dci-access/tickets" element={<ProtectedRoute allowedRoles={["admin", "hpg", "lto"]}><TicketPage /></ProtectedRoute>} />
          
          <Route path="/dci-access/accounts" element={<ProtectedRoute allowedRoles={["admin"]}><AccountPage /></ProtectedRoute>} />
          <Route path="/dci-access/transactions" element={<ProtectedRoute allowedRoles={["admin"]}><TransactionLogsPage /></ProtectedRoute>} />
          <Route path="/dci-access/activitylogs" element={<ProtectedRoute allowedRoles={["admin"]}><ActivityLogsPage /></ProtectedRoute>} />
          <Route path="/dci-access/accesslogs" element={<ProtectedRoute allowedRoles={["admin"]}><AccessLogsPage /></ProtectedRoute>} />
          
          <Route path="/dci-access/*" element={<PlaceholderPage title="Page Not Found" />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
