import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { LoginPage } from "./authentication/LoginPage";
import { CitizenRegister } from "./authentication/CitizenRegister";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { MyRequestsPage } from "./features/my-requests/MyRequestsPage";
import { VoucherRequestPage } from "./features/voucher-request/VoucherRequestPage";
import { VoucherRequestFlow } from "./features/voucher-request/VoucherRequestFlow";
import { AgentVoucherRequestPage } from "./features/voucher-request/AgentVoucherRequestPage";
import { ClearanceRequestPage } from "./features/clearance-request/ClearanceRequestPage";
import { ClearanceRequestFlow } from "./features/clearance-request/ClearanceRequestFlow";
import { AgentClearanceRequestPage } from "./features/clearance-request/AgentClearanceRequestPage";
import { CertificateRequestFlow } from "./features/certificate-request/CertificateRequestFlow";
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

import { useAlert } from "./hooks/useAlert";

const getDefaultPageForRole = (currentRole) => {
  return currentRole === "citizen" ? "requests" : "dashboard";
};

function AppContent() {
  const { success } = useAlert();
  const navigate = useNavigate();

  const [hasAccess, setHasAccess] = useState(() => {
    return window.location.pathname.includes("/dci-access");
  });

  const [view, setView] = useState(() => {
    if (hasAccess) {
      return localStorage.getItem("authView") || "login";
    }
    return null;
  });

  const [role, setRole] = useState(() => {
    if (hasAccess) {
      return localStorage.getItem("authRole") || null;
    }
    return null;
  });

  const [page, setPage] = useState(() => getDefaultPageForRole(role));
  const [requestRecords, setRequestRecords] = useState(() => {
    const saved = localStorage.getItem("certificateRequests");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem("userProfile");
    return saved ? JSON.parse(saved) : { name: "", email: "" };
  });

  useEffect(() => {
    if (hasAccess && view && view !== "login") {
      localStorage.setItem("authView", view);
    }
    if (hasAccess && role) {
      localStorage.setItem("authRole", role);
    }
  }, [view, role, hasAccess]);

  useEffect(() => {
    if (hasAccess && view !== "login" && view !== "register") {
      navigate(`/dci-access/${page}`, { replace: true });
    }
  }, [page, navigate, hasAccess, view]);

  useEffect(() => {
    localStorage.setItem("certificateRequests", JSON.stringify(requestRecords));
  }, [requestRecords]);

  useEffect(() => {
    if (role === "citizen" && page === "dashboard") {
      setPage("requests");
    }
  }, [role, page]);

  const handleLogin = (userRole, userData) => {
    const landingPage = getDefaultPageForRole(userRole);
    setRole(userRole);
    setView(userRole);
    setPage(landingPage);
    localStorage.setItem("authRole", userRole);
    localStorage.setItem("authView", userRole);
    if (userData) {
      setUserProfile(userData);
      localStorage.setItem("userProfile", JSON.stringify(userData));
    }
    navigate(`/dci-access/${landingPage}`);
  };

  const handleLogout = () => {
    setView("login");
    setRole(null);
    setPage("dashboard");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authView");
    localStorage.removeItem("userProfile");
    navigate("/dci-access");
  };

  const handleNavigate = (p, request) => {
    setPage(p);
    setSelectedRequest(request || null);
  };

  const handleMyProfile = () => {
    setPage("profile");
  };

  const upsertRequestRecord = (record) => {
    setRequestRecords((prev) => {
      const next = prev.some((item) => item.requestId === record.requestId)
        ? prev.map((item) => (item.requestId === record.requestId ? { ...item, ...record } : item))
        : [record, ...prev];
      return next;
    });
  };

  const handleRequestSave = (record) => {
    if (!record?.requestId) return;
    upsertRequestRecord(record);
  };

  const handleCertificateComplete = (payload) => {
    if (!payload?.requestId) return;
    upsertRequestRecord({
      requestId: payload.requestId,
      voucherReferenceNo: payload.voucherCode || "",
      clearanceReferenceNo: payload.certificateNo || "",
      plateNumber: payload.vehicle?.plateNumber || payload.orCr?.plateNumber || "",
      voucherStatus: "VOUCHER_ISSUED",
      clearanceStatus: "CERTIFICATE_ISSUED",
      currentStep: 6,
      certificateNo: payload.certificateNo || "",
      dateCreated: payload.dateCreated || new Date().toISOString().split("T")[0],
    });
    setSelectedRequest(null);
    setPage("requests");
  };

  if (!hasAccess) {
    return <MaintenancePage />;
  }

  const isAuthenticated = () => {
    return view && view !== "login" && view !== "register";
  };

  const renderPageComponent = () => {
    switch (page) {
      case "profile":
        return <ProfilePage user={userProfile} role={role} onLogout={handleLogout} />;
      case "dashboard":
        if (role === "citizen") {
          return <MyRequestsPage role={role} onNavigate={handleNavigate} requests={requestRecords} />;
        }
        return <DashboardPage role={role} />;
      case "requests":
        return <MyRequestsPage role={role} onNavigate={handleNavigate} requests={requestRecords} />;
      case "voucher-requests":
        if (role === "citizen") return <VoucherRequestPage onNavigate={handleNavigate} />;
        if (role === "agent_fixer") return <AgentVoucherRequestPage onNavigate={handleNavigate} />;
        return <PlaceholderPage title="Access Denied" />;
      case "new-certificate-request":
        return (
          <CertificateRequestFlow
            role={role}
            initialRequest={selectedRequest}
            onSaveRequest={handleRequestSave}
            onComplete={handleCertificateComplete}
            onCancel={() => setPage("requests")}
          />
        );
      case "new-voucher-request":
        return <VoucherRequestFlow role={role} onComplete={() => setPage("requests")} onCancel={() => setPage("requests")} />;
      case "clearance-requests":
        if (role === "citizen") return <ClearanceRequestPage onNavigate={handleNavigate} />;
        if (role === "agent_fixer") return <AgentClearanceRequestPage onNavigate={handleNavigate} />;
        return <PlaceholderPage title="Access Denied" />;
      case "new-clearance-request":
        return <ClearanceRequestFlow role={role} onComplete={() => setPage("requests")} onCancel={() => setPage("requests")} />;
      case "verification":
        return <HpgVerifyPage />;
      case "certificate-lookup":
        return <LtoLookupPage />;
      case "tickets":
        if (role === "citizen" || role === "agent_fixer") {
          return <PlaceholderPage title="Access Denied" description="You don't have permission to access this page." />;
        }
        return <TicketPage />;
      case "accounts":
        if (role === "citizen") {
          return <PlaceholderPage title="Access Denied" description="You don't have permission to access this page." />;
        }
        return <AccountPage />;
      case "transactions":
        return <TransactionLogsPage />;
      case "activitylogs":
        return <ActivityLogsPage />;
      case "accesslogs":
        return <AccessLogsPage />;
      default:
        if (role === "citizen") {
          return <MyRequestsPage role={role} onNavigate={handleNavigate} requests={requestRecords} />;
        }
        return <DashboardPage role={role} />;
    }
  };

  return (
    <div className="font-sans">
      {isAuthenticated() && (
        <AdminLayout
          currentPage={page}
          onNavigate={handleNavigate}
          role={role}
          onLogout={handleLogout}
          onMyProfile={handleMyProfile}
        >
          {renderPageComponent()}
        </AdminLayout>
      )}
      {!isAuthenticated() && view === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onRegisterClick={() => setView("register")}
        />
      )}
      {!isAuthenticated() && view === "register" && (
        <CitizenRegister
          onComplete={async () => {
            await success("Registration Successful", "You can now login with your credentials.");
            setView("login");
          }}
          onCancel={() => setView("login")}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dci-access/*" element={<AppContent />} />
        <Route path="/" element={<Navigate to="/dci-access" replace />} />
        <Route path="*" element={<Navigate to="/dci-access" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;