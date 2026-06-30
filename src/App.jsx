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
import { AgentBuyVoucherPage } from "./features/voucher-request/AgentBuyVoucherPage";
import { AgentVoucherRequestPage } from "./features/voucher-request/AgentVoucherRequestPage";
import { ClearanceRequestPage } from "./features/clearance-request/ClearanceRequestPage";
import { ClearanceRequestFlow } from "./features/clearance-request/ClearanceRequestFlow";
import { AgentClearanceRequestPage } from "./features/clearance-request/AgentClearanceRequestPage";
import { HpgVerifyPage } from "./features/hpg/HpgVerifyPage";
import { DciVerifyPage } from "./features/dci/DciVerifyPage";
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
import { Button } from "./components/Button";

const getDefaultPageForRole = (currentRole) => {
  if (currentRole === "citizen") return "requests";
  if (currentRole === "hpg" || currentRole === "dci") return "verification";
  if (currentRole === "lto") return "certificate-lookup";
  return "dashboard";
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
  const [voucherInventory, setVoucherInventory] = useState(() => {
    const saved = localStorage.getItem("voucherInventory");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isFlowOngoing, setIsFlowOngoing] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
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
    localStorage.setItem("voucherInventory", JSON.stringify(voucherInventory));
  }, [voucherInventory]);

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

  const performLogout = () => {
    setView("login");
    setRole(null);
    setPage("dashboard");
    localStorage.removeItem("authRole");
    localStorage.removeItem("authView");
    localStorage.removeItem("userProfile");
    navigate("/dci-access");
  };

  const handleLogout = () => {
    if (isFlowOngoing) {
      setPendingNavigation({ type: "logout" });
      return;
    }
    performLogout();
  };

  const handleNavigate = (p, request) => {
    if (isFlowOngoing) {
      setPendingNavigation({ type: "navigate", page: p, request });
      return;
    }
    setPage(p);
    setSelectedRequest(request || null);
  };

  const handleMyProfile = () => {
    if (isFlowOngoing) {
      setPendingNavigation({ type: "profile" });
      return;
    }
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

  const handleVoucherRequestSave = (record) => {
    if (!record?.requestId) return;
    upsertRequestRecord(record);
  };

  const handleVoucherRequestComplete = (payload) => {
    if (payload?.rows?.length) {
      payload.rows.forEach((row) => {
        if (!row?.requestId) return;
        upsertRequestRecord(row);
      });
    } else if (payload?.requestId) {
      upsertRequestRecord(payload);
    }
    setSelectedRequest(null);
    setPage("requests");
  };

  const handleClearanceRequestSave = (record) => {
    if (!record?.requestId) return;
    upsertRequestRecord(record);
  };

  const handleClearanceRequestComplete = (payload) => {
    if (payload?.rows?.length) {
      payload.rows.forEach((row) => {
        if (!row?.requestId) return;
        upsertRequestRecord({
          ...row,
          requestId: row.requestId,
          plateNumber: row.plateNumber || row.vehicle?.plateNumber || "",
          clearanceReferenceNo: row.certificateNo || row.clearanceReferenceNo || "",
          clearanceStatus: "CERTIFICATE_ISSUED",
          status: "CERTIFICATE_ISSUED",
          certificateNo: row.certificateNo || "",
          currentStep: 5,
          hpgVerified: true,
        });
      });
      setSelectedRequest(null);
      setPage("requests");
      return;
    }

    if (!payload?.requestId) return;
    upsertRequestRecord({
      requestId: payload.requestId,
      plateNumber: payload.vehicle?.plateNumber || payload.plateNumber || "",
      clearanceReferenceNo: payload.certificateNo || "",
      clearanceStatus: "CERTIFICATE_ISSUED",
      status: "CERTIFICATE_ISSUED",
      certificateNo: payload.certificateNo || "",
      currentStep: 5,
      hpgVerified: true,
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
      case "new-clearance-request":
        return (
          <ClearanceRequestFlow
            key={selectedRequest?.requestId || "new"}
            role={role}
            selectedRequest={selectedRequest}
            availableVoucherRequests={requestRecords}
            voucherInventory={voucherInventory}
            onVoucherInventoryChange={setVoucherInventory}
            onSaveRequest={handleClearanceRequestSave}
            onComplete={handleClearanceRequestComplete}
            onCancel={() => setPage("requests")}
            onOngoingChange={setIsFlowOngoing}
          />
        );
      case "new-transaction-credits":
        if (role === "agent_fixer") {
          return (
            <AgentBuyVoucherPage
              voucherInventory={voucherInventory}
              onVoucherInventoryChange={setVoucherInventory}
            />
          );
        }
        return (
          <VoucherRequestFlow
            role={role}
            initialRequest={selectedRequest}
            onSaveRequest={handleVoucherRequestSave}
            onComplete={handleVoucherRequestComplete}
            onCancel={() => setPage("requests")}
          />
        );
      case "clearance-requests":
        if (role === "citizen") return <ClearanceRequestPage onNavigate={handleNavigate} />;
        if (role === "agent_fixer") return <AgentClearanceRequestPage onNavigate={handleNavigate} />;
        return <PlaceholderPage title="Access Denied" />;
      case "verification":
        if (role === "dci") return <DciVerifyPage />;
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

      {pendingNavigation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6 text-sm">
              You have an ongoing transaction. Are you sure you want to navigate away? Unsaved progress will be lost.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setPendingNavigation(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const target = pendingNavigation;
                  setPendingNavigation(null);
                  setIsFlowOngoing(false);
                  if (target.type === "navigate") {
                    setPage(target.page);
                    setSelectedRequest(target.request || null);
                  } else if (target.type === "profile") {
                    setPage("profile");
                  } else if (target.type === "logout") {
                    performLogout();
                  }
                }}
              >
                Discard & Proceed
              </Button>
            </div>
          </div>
        </div>
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