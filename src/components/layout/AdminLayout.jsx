import { useState } from "react";
import { cn } from "../../utils/cn";
import { StatusBadge } from "../../components/StatusBadge";
import { LogOut, User, Key, ChevronDown } from "lucide-react";

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

  // Admin Navigation - Full system control
  const adminNav = [
    {
      section: "Home",
      items: [{ id: "dashboard", label: "Dashboard", disabled: false }],
    },
    {
      section: "Administrative",
      items: [
        { id: "accounts", label: "Accounts", disabled: false },
        { id: "company", label: "Company", disabled: false },
      ],
    },
    {
      section: "Manage",
      items: [
        { id: "vehicles", label: "Vehicle Database", disabled: false },
        { id: "mvtype", label: "MV Type", disabled: false },
        { id: "activitylogs", label: "Activity Logs", disabled: false },
      ],
    },
    {
      section: "CTPL Insurance",
      items: [
        { id: "verification", label: "Verification", disabled: false },
        { id: "transactions", label: "Transactions", disabled: false },
        { id: "vouchers", label: "Tickets/Vouchers", disabled: false },
      ],
    },
  ];

  // Viewer Admin Navigation - Read-only access (can only view, no actions)
  const viewerAdminNav = [
    {
      section: "Home",
      items: [{ id: "dashboard", label: "Dashboard", disabled: false }],
    },
    {
      section: "Administrative",
      items: [
        { id: "accounts", label: "Accounts", disabled: false },
        { id: "company", label: "Company", disabled: false },
      ],
    },
    {
      section: "Manage",
      items: [
        { id: "vehicles", label: "Vehicle Database", disabled: false },
        { id: "mvtype", label: "MV Type", disabled: false },
        { id: "activitylogs", label: "Activity Logs", disabled: false },
      ],
    },
    {
      section: "CTPL Insurance",
      items: [
        { id: "verification", label: "Verification", disabled: false },
        { id: "transactions", label: "Transactions", disabled: false },
        { id: "vouchers", label: "Tickets/Vouchers", disabled: false },
      ],
    },
  ];

  // Agent Navigation - Can ONLY view assigned vouchers (no buy, no transfer)
  const agentNav = [
    {
      section: "Home",
      items: [{ id: "dashboard", label: "Dashboard", disabled: false }],
    },
    {
      section: "CTPL Insurance",
      items: [{ id: "verification", label: "Verification", disabled: false }],
    },
    {
      section: "Vouchers",
      items: [{ id: "vouchers", label: "My Vouchers", disabled: false }],
    },
  ];

  // Manager Navigation - Can buy vouchers and transfer to agents
  const managerNav = [
    {
      section: "Home",
      items: [{ id: "dashboard", label: "Dashboard", disabled: false }],
    },
    {
      section: "Administrative",
      items: [
        { id: "accounts", label: "Accounts", disabled: false },
        { id: "company", label: "Company", disabled: false },
        { id: "branches", label: "Branches", disabled: false },
      ],
    },
    {
      section: "Voucher Management",
      items: [
        { id: "vouchers", label: "Buy Vouchers", disabled: false },
        {
          id: "transfer-vouchers",
          label: "Transfer Vouchers",
          disabled: false,
        },
      ],
    },
    {
      section: "CTPL Insurance",
      items: [
        { id: "verification", label: "Verification", disabled: false },
        { id: "transactions", label: "Transactions", disabled: false },
      ],
    },
    {
      section: "Reports",
      items: [
        { id: "activitylogs", label: "Activity Logs", disabled: false },
        { id: "ledger", label: "Ledger", disabled: false },
      ],
    },
  ];

  let nav = adminNav;
  let userLabel = "Admin User";
  let userInitial = "A";
  let isReadOnly = false;

  if (role === "admin") {
    nav = adminNav;
    userLabel = "Admin User";
    userInitial = "A";
    isReadOnly = false;
  } else if (role === "viewer") {
    nav = viewerAdminNav;
    userLabel = "Viewer Admin";
    userInitial = "V";
    isReadOnly = true;
  } else if (role === "manager") {
    nav = managerNav;
    userLabel = "Manager User";
    userInitial = "M";
    isReadOnly = false;
  } else if (role === "agent") {
    nav = agentNav;
    userLabel = "Agent User";
    userInitial = "AG";
    isReadOnly = true;
  }

  const getInitial = (label) => {
    return label.charAt(0);
  };

  const handleNavigation = (item) => {
    if (!item.disabled) {
      onNavigate(item.id);
    }
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleMyProfile = () => {
    setUserDropdownOpen(false);
    if (onMyProfile) {
      onMyProfile();
    }
  };

  const handleChangePassword = () => {
    setUserDropdownOpen(false);
    if (onChangePassword) {
      onChangePassword();
    }
  };

  const getRoleBadgeColor = () => {
    if (role === "admin") return "bg-purple-100 text-purple-700";
    if (role === "viewer") return "bg-gray-100 text-gray-700";
    if (role === "manager") return "bg-blue-100 text-blue-700";
    if (role === "agent") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  const getRoleDisplayName = () => {
    if (role === "admin") return "Admin";
    if (role === "viewer") return "Viewer";
    if (role === "manager") return "Manager";
    if (role === "agent") return "Agent";
    return "User";
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex-shrink-0 flex flex-col border-r border-gray-200 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20",
          "bg-white",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-sapphire-700 rounded-lg flex-shrink-0 flex items-center justify-center text-sm text-white font-bold">
            VV
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-gray-900 text-xs font-black truncate leading-tight">
                VVIP
              </p>
              <p className="text-gray-500 text-[10px] truncate">
                Verification Portal
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          {nav.map((group) => (
            <div key={group.section} className="mb-6">
              {sidebarOpen && (
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 mb-2">
                  {group.section}
                </p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center text-sm transition-all",
                    sidebarOpen
                      ? "px-6 py-2.5 justify-start gap-3"
                      : "px-2 py-3 justify-center flex-col gap-1",
                    !item.disabled && currentPage === item.id
                      ? "bg-primary-50 text-primary-600 border-r-2 border-primary-500"
                      : "text-gray-600",
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:text-gray-900 hover:bg-gray-50 cursor-pointer",
                  )}
                >
                  {sidebarOpen ? (
                    <span className="font-medium truncate">{item.label}</span>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                          !item.disabled && currentPage === item.id
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 text-gray-600",
                        )}
                      >
                        {getInitial(item.label)}
                      </div>
                      <span className="text-[10px] mt-1">{item.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* Read-only indicator for viewer */}
          {isReadOnly && sidebarOpen && role === "viewer" && (
            <div className="mt-4 px-6">
              <div className="bg-gray-100 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500">👁️ View-Only Mode</p>
              </div>
            </div>
          )}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "mt-auto mx-3 mb-3 rounded-lg transition-all duration-200",
            "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            "border border-gray-200",
            sidebarOpen ? "px-3 py-2" : "py-2",
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <svg
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                !sidebarOpen && "rotate-180",
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {sidebarOpen && (
              <span className="text-xs font-medium">Collapse</span>
            )}
          </div>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-base font-bold text-gray-900 capitalize">
              {currentPage === "transfer-vouchers"
                ? "Transfer Vouchers"
                : currentPage.replace(/([a-z])([A-Z])/g, "$1 $2")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Vehicle Verification Insurance Program
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* User Dropdown Menu */}
            <div className="relative">
              <button
                onClick={toggleUserDropdown}
                className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold",
                    role === "admin"
                      ? "bg-purple-600"
                      : role === "viewer"
                        ? "bg-gray-600"
                        : role === "manager"
                          ? "bg-blue-600"
                          : "bg-green-600",
                  )}
                >
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-medium text-gray-900 block">
                    {userLabel}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full inline-block",
                      getRoleBadgeColor(),
                    )}
                  >
                    {getRoleDisplayName()}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={cn(
                    "text-gray-500 transition-transform duration-200",
                    userDropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={handleMyProfile}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Key size={16} />
                      <span>Change Password</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
