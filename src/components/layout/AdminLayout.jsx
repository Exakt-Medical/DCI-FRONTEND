import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  Car,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { role } = useAuth();
  const location = useLocation();
  const currentPage = location.pathname.split("/").pop();

  const navConfig = {
    citizen: [
      { id: "requests", label: "My Requests", icon: FileText, section: "REQUESTS", disabled: false },
      { id: "new-clearance-request", label: "Request Certificate", icon: CreditCard, section: "REQUESTS", disabled: false },
      { id: "new-vehicle-registration", label: "Register a New Vehicle", icon: Car, section: "REQUESTS", disabled: false },
    ],
    agent_fixer: [
      { id: "requests", label: "My Requests / Queue", icon: FileText, section: "REQUESTS", disabled: false },
      { id: "new-transaction-credits", label: "Transaction Credits", icon: CreditCard, section: "REQUESTS", disabled: false },
      { id: "new-clearance-request", label: "Request for Certification", icon: Shield, section: "REQUESTS", disabled: false },
      { id: "bulk-clearance-request", label: "Bulk Request For Certification", icon: ListTodo, section: "REQUESTS", disabled: false },
      { id: "new-vehicle-registration", label: "Register a New Vehicle", icon: Car, section: "REQUESTS", disabled: false },
    ],
    hpg: [
      { id: "hpg-verification", label: "HPG Verification", icon: Shield, section: "VERIFICATION", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "SUPPORT", disabled: false },
    ],
    dci: [
      { id: "hpg-verification", label: "HPG Verification", icon: Shield, section: "VERIFICATION", disabled: false },
      { id: "dci-verification", label: "DCI Verification", icon: Search, section: "VERIFICATION", disabled: false },
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
    agent_fixer: { label: "Agent", initial: "AF", color: "bg-primary-500" },
    hpg: { label: "HPG Officer", initial: "HPG", color: "bg-blue-600" },
    dci: { label: "DCI Officer", initial: "DCI", color: "bg-green-600" },
    admin: { label: "Admin", initial: "A", color: "bg-red-600" },
  };

  const currentUser = userInfo[role] || userInfo.admin;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar
          navConfig={currentNav}
          isSidebarOpen={sidebarOpen}
          setIsSidebarOpen={setSidebarOpen}
        />
        <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
          <Header
            currentPage={currentPage}
            isSidebarOpen={sidebarOpen}
            user={currentUser}
            role={role}
          />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};