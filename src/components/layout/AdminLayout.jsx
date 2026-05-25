import { useState } from "react";
import { cn } from "../../utils/cn";
import {
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
  HelpCircle,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

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
        id: "tickets",
        label: "Tickets",
        icon: HelpCircle,
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
        disabled: true,
      },
      {
        id: "mvtype",
        label: "MV Type",
        icon: FileText,
        section: "MANAGE",
        disabled: true,
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
        id: "tickets",
        label: "Support Tickets",
        icon: HelpCircle,
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
        disabled: true,
      },
      {
        id: "mvtype",
        label: "MV Type",
        icon: FileText,
        section: "MANAGE",
        disabled: true,
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
        id: "tickets",
        label: "Support Tickets",
        icon: HelpCircle,
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
        disabled: true, // Disabled by default
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
  };

  const currentNav = navConfig[role] || navConfig.admin;

  const userInfo = {
    admin: { label: "Admin User", initial: "A", color: "bg-primary-500" },
    viewer: { label: "Viewer", initial: "V", color: "bg-gray-600" },
    manager: { label: "Manager", initial: "M", color: "bg-primary-500" },
    agent: { label: "Agent", initial: "AG", color: "bg-primary-500" },
    subagent: { label: "Sub-Agent", initial: "SA", color: "bg-primary-500" },
  };

  const currentUser = userInfo[role] || userInfo.admin;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar
          navConfig={currentNav}
          currentPage={currentPage}
          onNavigate={onNavigate}
          isSidebarOpen={sidebarOpen}
          setIsSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <div
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-20",
          )}
        >
          <Header
            currentPage={currentPage}
            isSidebarOpen={sidebarOpen}
            user={currentUser}
            role={role}
            onMyProfile={onMyProfile}
            onChangePassword={onChangePassword}
            onLogout={onLogout}
          />

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
