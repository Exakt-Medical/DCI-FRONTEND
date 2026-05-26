import { useState } from "react";
import { cn } from "../../utils/cn";
import {
  LogOut,
  User,
  Key,
  ChevronDown,
  Menu,
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  Car,
  FileText,
  Activity,
  Shield,
  CreditCard,
  Ticket,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";

export const AdminLayout = ({
  children,
  currentPage,
  onNavigate,
  role,
  onLogout,
  onMyProfile,
  onChangePassword,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Navigation configuration
  const navConfig = {
    admin: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "MAIN",
        disabled: false,
      },
      {
        id: "accounts",
        label: "Accounts",
        icon: Users,
        section: "ADMINISTRATION",
        disabled: false,
      },
      {
        id: "company",
        label: "Company",
        icon: Building2,
        section: "ADMINISTRATION",
        disabled: false,
      },
      {
        id: "branches",
        label: "Branches",
        icon: MapPin,
        section: "ADMINISTRATION",
        disabled: false,
      },
      {
        id: "vehicles",
        label: "Vehicles",
        icon: Car,
        section: "MANAGE",
        disabled: false,
      },
      {
        id: "mvtype",
        label: "MV Type",
        icon: FileText,
        section: "MANAGE",
        disabled: false,
      },
      {
        id: "tickets",
        label: "Tickets",
        icon: Ticket,
        section: "TICKETS",
        disabled: false,
      },
      {
        id: "activitylogs",
        label: "Logs",
        icon: Activity,
        section: "MANAGE",
        disabled: false,
      },
      {
        id: "ledger",
        label: "Ledger",
        icon: BookOpen,
        section: "REPORTS",
        disabled: false,
      },
    ],
    viewer: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "MAIN",
        disabled: false,
      },
      {
        id: "company",
        label: "Company",
        icon: Building2,
        section: "ADMINISTRATION",
        disabled: false,
      },
      {
        id: "branches",
        label: "Branches",
        icon: MapPin,
        section: "ADMINISTRATION",
        disabled: false,
      },
      {
        id: "vouchers",
        label: "Vouchers",
        icon: Ticket,
        section: "VOUCHERS",
        disabled: false,
      },
      {
        id: "vehicles",
        label: "Vehicles",
        icon: Car,
        section: "MANAGE",
        disabled: false,
      },
      {
        id: "mvtype",
        label: "MV Type",
        icon: FileText,
        section: "MANAGE",
        disabled: false,
      },
      {
        id: "activitylogs",
        label: "Logs",
        icon: Activity,
        section: "MANAGE",
        disabled: false,
      },
    ],
    manager: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "MAIN",
        disabled: false,
      },
      {
        id: "accounts",
        label: "Accounts",
        icon: Users,
        section: "ADMINISTRATION",
        disabled: false,
      },
      {
        id: "verification",
        label: "Verification",
        icon: Shield,
        section: "INSURANCE",
        disabled: false,
      },
      {
        id: "vouchers",
        label: "Vouchers",
        icon: Ticket,
        section: "VOUCHERS",
        disabled: false,
      },
      {
        id: "transfer-vouchers",
        label: "Transfer",
        icon: ArrowLeftRight,
        section: "VOUCHERS",
        disabled: false,
      },
      {
        id: "payment",
        label: "Payment",
        icon: CreditCard,
        section: "VOUCHERS",
        disabled: false,
      },
      {
        id: "activitylogs",
        label: "Logs",
        icon: Activity,
        section: "MANAGE",
        disabled: false,
      },
      {
        id: "ledger",
        label: "Ledger",
        icon: BookOpen,
        section: "REPORTS",
        disabled: false,
      },
    ],
    agent: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "MAIN",
        disabled: false,
      },
      {
        id: "verification",
        label: "Verification",
        icon: Shield,
        section: "INSURANCE",
        disabled: false,
      },
      {
        id: "vouchers",
        label: "Vouchers",
        icon: Ticket,
        section: "VOUCHERS",
        disabled: false,
      },
    ],
    subagent: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "MAIN",
        disabled: false,
      },
      {
        id: "verification",
        label: "Verification",
        icon: Shield,
        section: "INSURANCE",
        disabled: false,
      },
      {
        id: "vouchers",
        label: "Vouchers",
        icon: Ticket,
        section: "VOUCHERS",
        disabled: false,
      },
    ],
    support: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        section: "MAIN",
        disabled: false,
      },
      {
        id: "tickets",
        label: "Tickets",
        icon: Ticket,
        section: "TICKETS",
        disabled: false,
      },
    ],
  };

  const currentNav = navConfig[role] || navConfig.admin;

  // Group by section
  const groupedNav = currentNav.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const userInfo = {
    admin: { label: "Admin User", initial: "A", color: "bg-primary-500" },
    viewer: { label: "Viewer", initial: "V", color: "bg-gray-600" },
    manager: { label: "Manager", initial: "M", color: "bg-primary-500" },
    agent: { label: "Agent", initial: "AG", color: "bg-primary-500" },
    subagent: { label: "Sub-Agent", initial: "SA", color: "bg-primary-500" },
    support: { label: "Support", initial: "S", color: "bg-primary-500" },
  };

  const currentUser = userInfo[role] || userInfo.admin;

  const getRoleDisplayName = () => {
    const names = {
      admin: "Admin",
      viewer: "Viewer",
      manager: "Manager",
      agent: "Agent",
      subagent: "Sub-Agent",
      support: "Support",
    };
    return names[role] || "User";
  };

  const handleNavigation = (id, disabled) => {
    if (!disabled) {
      onNavigate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-30",
            sidebarOpen ? "w-64" : "w-20",
          )}
        >
          {/* Logo Area */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-white">DCI</span>
              </div>
              {sidebarOpen && (
                <span className="text-sm font-semibold text-gray-800">
                  VVIP Portal
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="h-[calc(100%-4rem)] overflow-y-auto py-4">
            {Object.entries(groupedNav).map(([section, items]) => (
              <div key={section} className="mb-6">
                {sidebarOpen && (
                  <div className="px-4 mb-2">
                    <p className="text-[10px] font-semibold text-gray-400 tracking-wider">
                      {section}
                    </p>
                  </div>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  const isDisabled = item.disabled;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id, isDisabled)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full flex items-center transition-all duration-200 my-1",
                        sidebarOpen
                          ? "px-4 py-2 gap-3"
                          : "px-2 py-3 justify-center",
                        isActive && !isDisabled
                          ? "bg-primary-500/10 text-primary-600 border-r-2 border-primary-500"
                          : isDisabled
                            ? "text-gray-400 cursor-not-allowed opacity-60"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                      title={isDisabled ? "Under Development" : ""}
                    >
                      <Icon size={18} />
                      {sidebarOpen && (
                        <span className="text-sm font-medium">
                          {item.label}
                          {isDisabled && (
                            <span className="ml-2 text-[10px] text-gray-400"></span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-20",
          )}
        >
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
            <div className="flex items-center justify-between px-6 py-3">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {currentPage === "transfer-vouchers"
                    ? "Transfer Vouchers"
                    : currentPage.charAt(0).toUpperCase() +
                      currentPage.slice(1)}
                </h1>
                <p className="text-xs text-gray-500">
                  Vehicle Verification Insurance Program
                </p>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white",
                      currentUser.color,
                    )}
                  >
                    {currentUser.initial}
                  </div>
                  {sidebarOpen && (
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {currentUser.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName()}
                      </p>
                    </div>
                  )}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-gray-400 transition-transform",
                      userDropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onMyProfile?.();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={14} /> Profile
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onChangePassword?.();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Key size={14} /> Password
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
