import { useState } from "react";
import { LoginPage } from "./authentication/LoginPage";
import { RegistrationWizard } from "./authentication/RegistrationWizard";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CompanyBranchPage } from "./features/CompanyBranch/CompanyBranchPage";
import { VerificationPage } from "./features/verification/VerificationPage";
import Vouchers from "./features/voucher/Vouchers";
import TransferVoucherPage from "./features/TransferVoucher/TransferVoucherPage";
import PaymentPage from "./features/payment/PaymentPage";
import { AccountPage } from "./features/accounts/AccountPage";
import { PlaceholderPage } from "./features/placeholder/PlaceholderPage";

function App() {
  const [view, setView] = useState("login");
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [certificateData, setCertificateData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);

  const handleLogin = (userRole) => {
    setRole(userRole);
    setView(userRole);
    // Set default page based on role
    if (userRole === "agent") {
      setPage("dashboard");
    } else if (userRole === "manager") {
      setPage("dashboard");
    } else if (userRole === "viewer") {
      setPage("dashboard");
    } else {
      setPage("dashboard");
    }
  };

  const handleLogout = () => {
    setView("login");
    setRole(null);
    setPage("dashboard");
    setCertificateData(null);
    setPendingPayment(null);
  };

  const handleNavigate = (p) => {
    setPage(p);
    setCertificateData(null);
    setPendingPayment(null);
  };

  // Navigation function for components that need to navigate
  const handleComponentNavigate = (path, options) => {
    if (options?.state) {
      // Handle state if needed
      if (options.state.selectedProduct) {
        setPendingPayment({
          product: options.state.selectedProduct,
          formData: options.state.formData,
        });
      }
    }
    setPage(path.replace("/", "")); // Remove leading slash
  };

  const handleGoToPayment = (product, formData) => {
    setPendingPayment({ product, formData });
    setPage("payment");
  };

  const handlePaymentSuccess = () => {
    setPendingPayment(null);
    setPage("vouchers");
  };

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
        onComplete={() => {
          alert("Registration submitted! Awaiting admin approval.");
          setView("login");
        }}
        onCancel={() => setView("login")}
      />
    );

  const renderPage = () => {
    // Dashboard - All roles can access
    if (page === "dashboard") return <DashboardPage />;

    // Accounts - Admin, Manager can access (not Agent, not Viewer)
    if (page === "accounts") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to manage accounts. Please contact your administrator."
          />
        );
      if (role === "viewer")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Viewers cannot manage accounts. Please contact your administrator."
          />
        );
      return <AccountPage />;
    }

    // Company/Branch - Admin, Manager can access (not Agent, not Viewer)
    if (page === "company") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to access this page. Please contact your administrator."
          />
        );
      if (role === "viewer")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Viewers cannot manage companies."
          />
        );
      return <CompanyBranchPage />;
    }

    // Branches - Shows the same CompanyBranchPage (since branches are part of company management)
    if (page === "branches") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to manage branches."
          />
        );
      if (role === "viewer")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Viewers cannot manage branches."
          />
        );
      // Show the CompanyBranchPage which includes branch information
      return <CompanyBranchPage />;
    }

    // Verification - All roles can access
    if (page === "verification")
      return <VerificationPage onCertificate={() => {}} />;

    // Vouchers - Different views based on role
    if (page === "vouchers") {
      // Agent: Can only view assigned vouchers
      if (role === "agent") {
        return (
          <Vouchers
            viewOnly={true}
            userRole={role}
            onNavigate={handleComponentNavigate}
          />
        );
      }
      // Admin: Full access with payment
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
      // Manager: Can buy and view vouchers
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
      // Viewer: Read-only voucher access
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

    // Transfer Vouchers - Only Manager can access
    if (page === "transfer-vouchers") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to transfer vouchers. Only managers can transfer vouchers."
          />
        );
      if (role === "viewer")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Viewers cannot transfer vouchers. This action requires manager privileges."
          />
        );
      return <TransferVoucherPage />;
    }

    // Payment - Only Admin and Manager can access
    if (page === "payment") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Agents cannot purchase vouchers. Please contact your manager."
          />
        );
      if (role === "viewer")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Viewers cannot purchase vouchers."
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

    // Vehicles - Only Admin and Viewer can access (Manager cannot)
    if (page === "vehicles") {
      if (role === "manager")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Managers cannot access vehicle database. Please contact admin."
          />
        );
      if (role === "agent")
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

    // MV Type - Only Admin and Viewer can access
    if (page === "mvtype") {
      if (role === "manager")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="Managers cannot manage MV types."
          />
        );
      if (role === "agent")
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

    // Activity Logs - Admin, Viewer, and Manager can access
    if (page === "activitylogs") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to view activity logs."
          />
        );
      return (
        <PlaceholderPage
          title="Activity Logs"
          icon="📝"
          description="Full audit trail of all system activities, verifications, and transactions."
        />
      );
    }

    // Transactions - Admin, Viewer, and Manager can access
    if (page === "transactions") {
      if (role === "agent")
        return (
          <PlaceholderPage
            title="Access Denied"
            icon="🔒"
            description="You don't have permission to view transactions."
          />
        );
      return (
        <PlaceholderPage
          title="Transactions"
          icon="💳"
          description="View and manage all CTPL insurance transaction records."
        />
      );
    }

    // Ledger - Only Manager can access
    if (page === "ledger") {
      if (role === "admin")
        return (
          <PlaceholderPage
            title="Ledger"
            icon="📒"
            description="Financial ledger for voucher transactions and agent allocations."
          />
        );
      if (role === "manager")
        return (
          <PlaceholderPage
            title="Ledger"
            icon="📒"
            description="Financial ledger for voucher transactions and agent allocations."
          />
        );
      return (
        <PlaceholderPage
          title="Access Denied"
          icon="🔒"
          description="You don't have permission to access the ledger."
        />
      );
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
      >
        {renderPage()}
      </AdminLayout>
    </div>
  );
}

export default App;
