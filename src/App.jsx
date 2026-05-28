import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LoginPage } from "./authentication/LoginPage";
import { RegistrationWizard } from "./authentication/RegistrationWizard";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ManagerDashboard } from "./features/dashboard/ManagerDashboard";
import { CompanyPage } from "./features/company/CompanyPage";
import { CompanyBranchPage } from "./features/CompanyBranch/CompanyBranchPage";
import { VerificationPage } from "./features/verification/VerificationPage";
import Vouchers from "./features/voucher/Vouchers";
import TransferVoucherPage from "./features/TransferVoucher/TransferVoucherPage";
import PaymentPage from "./features/payment/PaymentPage";
import { AccountPage } from "./features/accounts/AccountPage";
import { TransactionLogsPage } from "./features/TransactionLogs/TransactionLogsPage";
import { ActivityLogsPage } from "./features/ActivityLogs/ActivityLogsPage";
import { AccessLogsPage } from "./features/AccessLogs/AccessLogsPage";
import { PlaceholderPage } from "./features/placeholder/PlaceholderPage";
import { ProfilePage } from "./features/Profile/ProfilePage";
import { TransactionLedger } from "./features/TransactionLedger/TransactionLedger";
import { TicketPage } from "./features/Tickets/TicketPage";
import { MaintenancePage } from "./features/Maintenance/MaintenancePage";
import { ThankYouPageWrapper } from "./features/voucher/components/ThankYouPageWrapper";
import { useAlert } from "./hooks/useAlert";

// Main App Content component
function AppContent() {
  const { success } = useAlert();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if URL has the secret path to access the app
  const [hasAccess, setHasAccess] = useState(() => {
    return window.location.pathname.includes("/vvip-access");
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

  const [allowedToBuyVoucher, setAllowedToBuyVoucher] = useState(() => {
    if (hasAccess) {
      return localStorage.getItem("authAllowedToBuyVoucher") === "true";
    }
    return false;
  });

  const [page, setPage] = useState("dashboard");
  const [certificateData, setCertificateData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);

  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem("userProfile");
    return savedProfile
      ? JSON.parse(savedProfile)
      : {
          name: "John Doe",
          email: "john.doe@vvipctpl.com",
          phone: "+63 912 345 6789",
          company: "VVIP CTPL Insurance Corp",
        };
  });

  // Save auth state to localStorage
  useEffect(() => {
    if (hasAccess && view && view !== "login") {
      localStorage.setItem("authView", view);
    }
    if (hasAccess && role) {
      localStorage.setItem("authRole", role);
    }
    if (hasAccess) {
      localStorage.setItem(
        "authAllowedToBuyVoucher",
        String(allowedToBuyVoucher),
      );
    }
  }, [view, role, allowedToBuyVoucher, hasAccess]);

  // Update URL when page changes
  useEffect(() => {
    if (hasAccess && view !== "login" && view !== "register") {
      navigate(`/vvip-access/${page}`, { replace: true });
    }
  }, [page, navigate, hasAccess, view]);

  const handleLogin = (userRole, userData) => {
    setRole(userRole);
    setView(userRole);
    setPage("dashboard");
    localStorage.setItem("authRole", userRole);
    localStorage.setItem("authView", userRole);
    const allowed = !!userData?.allowedToBuyVoucher;
    setAllowedToBuyVoucher(allowed);
    localStorage.setItem("authAllowedToBuyVoucher", String(allowed));
    if (userData) {
      setUserProfile(userData);
      localStorage.setItem("userProfile", JSON.stringify(userData));
    }
    navigate("/vvip-access/dashboard");
  };

  const handleLogout = () => {
    setView("login");
    setRole(null);
    setPage("dashboard");
    setCertificateData(null);
    setPendingPayment(null);
    localStorage.removeItem("authRole");
    localStorage.removeItem("authView");
    localStorage.removeItem("authAllowedToBuyVoucher");
    localStorage.removeItem("userProfile");
    navigate("/vvip-access");
  };

  const handleNavigate = (p) => {
    setPage(p);
    setCertificateData(null);
    setPendingPayment(null);
  };

  const handleMyProfile = () => {
    setPage("profile");
  };

  const handleChangePassword = async (passwordData) => {
    console.log("Password changed:", passwordData);
    await success("Password Changed", "Password changed successfully!");
  };

  const handleUpdateProfile = async (updatedData) => {
    setUserProfile(updatedData);
    localStorage.setItem("userProfile", JSON.stringify(updatedData));
    await success("Profile Updated", "Profile updated successfully!");
  };

  const handleComponentNavigate = (path, options) => {
    if (options?.state) {
      if (options.state.selectedProduct) {
        setPendingPayment({
          product: options.state.selectedProduct,
          formData: options.state.formData,
        });
      }
    }
    setPage(path.replace("/", ""));
  };

  const handleGoToPayment = (product, formData) => {
    setPendingPayment({ product, formData });
    setPage("payment");
  };

  const handlePaymentSuccess = (selectedProduct, quantity) => {
    setPendingPayment(null);
    // Save to localStorage as backup
    localStorage.setItem(
      "ctpl_last_purchase",
      JSON.stringify({
        selectedProduct,
        quantity,
        timestamp: Date.now(),
      }),
    );
    // Navigate to root-level thankyoupage with state
    navigate("/thankyoupage", {
      state: { selectedProduct, quantity },
    });
  };

  // SHOW MAINTENANCE PAGE AS DEFAULT
  if (!hasAccess) {
    return <MaintenancePage />;
  }

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return view && view !== "login" && view !== "register";
  };

  const renderPageComponent = () => {
    switch (page) {
      case "profile":
        return (
          <ProfilePage
            user={userProfile}
            role={role}
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onLogout={handleLogout}
          />
        );
      case "dashboard":
        return role === "manager" ? <ManagerDashboard /> : <DashboardPage />;
      case "tickets":
        if (role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to access support tickets. Please contact your administrator."
            />
          );
        }
        return <TicketPage />;
      case "ledger":
        if (role === "admin" || role === "manager" || role === "viewer") {
          return <TransactionLedger />;
        }
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to access the transaction ledger."
          />
        );
      case "accounts":
        if (role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to manage accounts. Please contact your administrator."
            />
          );
        }
        return <AccountPage />;
      case "company":
        if (role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to access this page. Please contact your administrator."
            />
          );
        }
        return <CompanyPage />;
      case "branches":
        if (role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to manage branches."
            />
          );
        }
        return <CompanyBranchPage />;
      case "verification":
        return <VerificationPage onCertificate={() => {}} />;
      case "vouchers":
        if (!allowedToBuyVoucher) {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to purchase vouchers. Please contact your administrator."
            />
          );
        }
        if (role === "agent" || role === "subagent") {
          return (
            <Vouchers
              viewOnly={true}
              userRole={role}
              onNavigate={handleComponentNavigate}
            />
          );
        }
        if (role === "admin" || role === "manager") {
          return (
            <Vouchers
              viewOnly={false}
              userRole={role}
              onNavigate={handleComponentNavigate}
              onGoToPayment={handleGoToPayment}
            />
          );
        }
        if (role === "viewer") {
          return (
            <Vouchers
              viewOnly={true}
              userRole={role}
              onNavigate={handleComponentNavigate}
            />
          );
        }
        return (
          <Vouchers
            onNavigate={handleComponentNavigate}
            onGoToPayment={handleGoToPayment}
          />
        );
      case "transfer-vouchers":
        if (role !== "admin" && role !== "manager") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to transfer vouchers."
            />
          );
        }
        return <TransferVoucherPage />;
      case "payment":
        if (!allowedToBuyVoucher || (role !== "manager" && role !== "admin")) {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to purchase vouchers."
            />
          );
        }
        return (
          <PaymentPage
            pendingPayment={pendingPayment}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setPage("vouchers")}
          />
        );
      case "vehicles":
        if (role === "manager" || role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to access vehicle database."
            />
          );
        }
        return (
          <PlaceholderPage
            title="Vehicle Database"
            icon="🚗"
            description="Browse, search, and manage the complete LTO vehicle registry database."
          />
        );
      case "mvtype":
        if (role === "manager" || role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to manage MV types."
            />
          );
        }
        return (
          <PlaceholderPage
            title="MV Type"
            icon="📋"
            description="Configure and manage motor vehicle type classifications and categories."
          />
        );
      case "activitylogs":
        if (role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to view activity logs. Only administrators and managers can access this page."
            />
          );
        }
        return <ActivityLogsPage />;
      case "accesslogs":
        if (role === "agent" || role === "subagent" || role === "manager") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to view access logs. Only administrators can access this page."
            />
          );
        }
        return <AccessLogsPage />;
      case "transactions":
        if (role === "agent" || role === "subagent") {
          return (
            <PlaceholderPage
              title="Access Denied"
              icon="🔒"
              description="You don't have permission to view transaction logs. Only administrators and managers can access this page."
            />
          );
        }
        return <TransactionLogsPage />;
      default:
        return <DashboardPage />;
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
          onChangePassword={handleChangePassword}
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
        <RegistrationWizard
          onComplete={async () => {
            await success(
              "Registration Submitted",
              "Registration submitted! Awaiting admin approval.",
            );
            setView("login");
          }}
          onCancel={() => setView("login")}
        />
      )}
    </div>
  );
}

// Main App component with Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root-level Thank You page route */}
        <Route path="/thankyoupage" element={<ThankYouPageWrapper />} />

        {/* Main app routes */}
        <Route path="/vvip-access/*" element={<AppContent />} />

        {/* Redirect root to vvip-access */}
        <Route path="/" element={<Navigate to="/vvip-access" replace />} />

        {/* Redirect any other unknown routes to vvip-access */}
        <Route path="*" element={<Navigate to="/vvip-access" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
