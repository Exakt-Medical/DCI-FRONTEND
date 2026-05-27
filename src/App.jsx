import { useState, useEffect } from "react";
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
import { PlaceholderPage } from "./features/placeholder/PlaceholderPage";
import { ProfilePage } from "./features/Profile/ProfilePage";
import { TransactionLedger } from "./features/TransactionLedger/TransactionLedger";
import { TicketPage } from "./features/Tickets/TicketPage";
import { MaintenancePage } from "./features/Maintenance/MaintenancePage";
import { useAlert } from "./hooks/useAlert";

function App() {
  const { success } = useAlert();

  // Check if URL has the secret path to access the app
  const [hasAccess, setHasAccess] = useState(() => {
    // Check if the current path includes '/vvip-access'
    return window.location.pathname.includes("/vvip-access");
  });

  // Load initial state from localStorage (only if has access)
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

  // User profile data
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
      localStorage.setItem("authAllowedToBuyVoucher", String(allowedToBuyVoucher));
    }
  }, [view, role, allowedToBuyVoucher, hasAccess]);

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

  const handlePaymentSuccess = () => {
    setPendingPayment(null);
    setPage("vouchers");
  };

  // SHOW MAINTENANCE PAGE AS DEFAULT - Only show app if URL has /vvip-access
  if (!hasAccess) {
    return <MaintenancePage />;
  }

  // Normal app routing (only accessible with /vvip-access in URL)
  if (view === "login")
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegisterClick={() => setView("register")}
      />
    );

  if (view === "register")
    return (
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
    );

  const renderPage = () => {
    if (page === "profile") {
      return (
        <ProfilePage
          user={userProfile}
          role={role}
          onUpdateProfile={handleUpdateProfile}
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
        />
      );
    }

    if (page === "dashboard") {
      if (role === "manager") {
        return <ManagerDashboard />;
      }
      return <DashboardPage />;
    }

    if (page === "tickets") {
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
    }

    if (page === "ledger") {
      if (role === "admin" || role === "manager") {
        return <TransactionLedger />;
      }
      return (
        <PlaceholderPage
          title="Access Denied"
          icon="🔒"
          description="You don't have permission to access the transaction ledger."
        />
      );
    }

    if (page === "accounts") {
      if (role === "agent" || role === "subagent" || role === "viewer")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to manage accounts. Please contact your administrator."
          />
        );
      return <AccountPage />;
    }

    if (page === "company") {
      if (role === "agent" || role === "subagent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to access this page. Please contact your administrator."
          />
        );
      return <CompanyPage />;
    }

    if (page === "branches") {
      if (role === "agent" || role === "subagent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to manage branches."
          />
        );
      return <CompanyBranchPage />;
    }

    if (page === "verification")
      return <VerificationPage onCertificate={() => {}} />;

    if (page === "vouchers") {
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
      if (role === "admin") {
        return (
          <Vouchers
            viewOnly={false}
            userRole={role}
            onNavigate={handleComponentNavigate}
            onGoToPayment={handleGoToPayment}
          />
        );
      }
      if (role === "manager") {
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
    }

    if (page === "transfer-vouchers") {
      if (role !== "manager")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to transfer vouchers. Only managers can transfer vouchers."
          />
        );
      return <TransferVoucherPage />;
    }

    if (page === "payment") {
      if (!allowedToBuyVoucher || (role !== "manager" && role !== "admin"))
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to purchase vouchers."
          />
        );
      return (
        <PaymentPage
          pendingPayment={pendingPayment}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPage("vouchers")}
        />
      );
    }

    if (page === "vehicles") {
      if (role === "manager" || role === "agent" || role === "subagent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to access vehicle database."
          />
        );
      return (
        <PlaceholderPage
          title="Vehicle Database"
          icon="🚗"
          description="Browse, search, and manage the complete LTO vehicle registry database."
        />
      );
    }

    if (page === "mvtype") {
      if (role === "manager" || role === "agent" || role === "subagent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to manage MV types."
          />
        );
      return (
        <PlaceholderPage
          title="MV Type"
          icon="📋"
          description="Configure and manage motor vehicle type classifications and categories."
        />
      );
    }

    // Activity Logs Page - Accessible by Admin and Manager only
    if (page === "activitylogs") {
      if (role === "agent" || role === "subagent" || role === "viewer") {
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to view activity logs. Only administrators and managers can access this page."
          />
        );
      }
      return <ActivityLogsPage />;
    }

    // Transaction Logs Page - Accessible by Admin and Manager only
    if (page === "transactions") {
      if (role === "agent" || role === "subagent" || role === "viewer") {
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to view transaction logs. Only administrators and managers can access this page."
          />
        );
      }
      return <TransactionLogsPage />;
    }

    return <DashboardPage />;
  };

  return (
    <div className="font-sans">
      <AdminLayout
        currentPage={page}
        onNavigate={handleNavigate}
        role={role}
        onLogout={handleLogout}
        onMyProfile={handleMyProfile}
        onChangePassword={handleChangePassword}
      >
        {renderPage()}
      </AdminLayout>
    </div>
  );
}

export default App;
