import { useState } from "react";
import { cn } from "../../utils/cn";
import {
  LayoutDashboard,
  FileText,
  Shield,
  Search,
  Ticket,
  Users,
  Activity,
  LogIn,
  ListTodo,
  ShoppingCart,
  CreditCard,
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
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navConfig = {
    citizen: [
      { id: "requests", label: "My Requests", icon: FileText, section: "REQUESTS", disabled: false },
      { id: "new-clearance-request", label: "Request Certificate", icon: CreditCard, section: "REQUESTS", disabled: false },
    ],
    agent_fixer: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "MAIN", disabled: false },
      { id: "requests", label: "My Requests / Queue", icon: FileText, section: "REQUESTS", disabled: false },
      { id: "new-transaction-credits", label: "Transaction Credits", icon: CreditCard, section: "REQUESTS", disabled: false },
      { id: "new-clearance-request", label: "Request for Certification", icon: Shield, section: "REQUESTS", disabled: false },
    ],
    hpg: [
      { id: "verification", label: "Verify Vehicle", icon: Shield, section: "VERIFICATION", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "SUPPORT", disabled: false },
    ],
    dci: [
      { id: "verification", label: "Verify Vehicle", icon: Shield, section: "VERIFICATION", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "SUPPORT", disabled: false },
    ],
    lto: [
      { id: "certificate-lookup", label: "Cert Lookup", icon: Search, section: "CERTIFICATE", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "SUPPORT", disabled: false },
    ],
    admin: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "MAIN", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "MAIN", disabled: false },
      { id: "accounts", label: "Accounts", icon: Users, section: "ADMINISTRATION", disabled: false },
      { id: "activitylogs", label: "Activity Logs", icon: Activity, section: "LOGS", disabled: false },
      { id: "accesslogs", label: "Access Logs", icon: LogIn, section: "LOGS", disabled: false },
      { id: "transactions", label: "Transaction Logs", icon: ListTodo, section: "LOGS", disabled: false },
    ],
  };

  const currentNav = navConfig[role] || navConfig.admin;

  const userInfo = {
    citizen: { label: "Citizen", initial: "C", color: "bg-primary-500" },
    agent_fixer: { label: "Agent", initial: "A", color: "bg-primary-500" },
    hpg: { label: "HPG Officer", initial: "HPG", color: "bg-blue-600" },
    dci: { label: "DCI Officer", initial: "DCI", color: "bg-blue-600" },
    lto: { label: "LTO Officer", initial: "LTO", color: "bg-green-600" },
    admin: { label: "Admin", initial: "A", color: "bg-red-600" },
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
        <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
          <Header
            currentPage={currentPage}
            isSidebarOpen={sidebarOpen}
            user={currentUser}
            role={role}
            onMyProfile={onMyProfile}
            onLogout={onLogout}
          />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};