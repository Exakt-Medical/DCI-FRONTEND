
import { useState, useEffect } from "react";
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
  AlertCircle,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { role } = useAuth();
  const location = useLocation();
  const currentPage = location.pathname.split("/").pop();
  
  const isVerified = localStorage.getItem("isVerified") !== "false";

  const [requestCount, setRequestCount] = useState(() => {
    return parseInt(localStorage.getItem("verifyRequestCount") || "0", 10);
  });
  
  const [cooldown, setCooldown] = useState(() => {
    const lastTime = parseInt(localStorage.getItem("lastVerifyRequestTime") || "0", 10);
    if (lastTime) {
      const diff = Math.floor((Date.now() - lastTime) / 1000);
      return diff < 300 ? 300 - diff : 0;
    }
    return 0;
  });

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerifyRequest = () => {
    if (requestCount >= 3 || cooldown > 0) return;
    
    const newCount = requestCount + 1;
    setRequestCount(newCount);
    localStorage.setItem("verifyRequestCount", newCount.toString());
    
    setCooldown(300);
    localStorage.setItem("lastVerifyRequestTime", Date.now().toString());
    
    alert("Verification email requested! Please check your inbox.");
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const navConfig = {
    citizen: [
      { id: "requests", label: "My Requests", icon: FileText, section: "REQUESTS", disabled: false },
      { id: "new-clearance-request", label: "Request Certificate", icon: CreditCard, section: "REQUESTS", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "SUPPORT", disabled: false },

    ],
    agent_fixer: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "MAIN", disabled: false },
      { id: "requests", label: "My Requests / Queue", icon: FileText, section: "REQUESTS", disabled: false },
      { id: "new-voucher-request", label: "Voucher", icon: CreditCard, section: "REQUESTS", disabled: false },
      { id: "new-clearance-request", label: "Request for Certification", icon: Shield, section: "REQUESTS", disabled: false },
      { id: "tickets", label: "Tickets", icon: Ticket, section: "SUPPORT", disabled: false },

    ],
    hpg: [
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
    agent_fixer: { label: "Agent/Fixer", initial: "AF", color: "bg-primary-500" },
    hpg: { label: "HPG Officer", initial: "HPG", color: "bg-blue-600" },
    lto: { label: "LTO Officer", initial: "LTO", color: "bg-green-600" },
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
        <div className={cn("flex-1 transition-all duration-300 flex flex-col min-h-screen", sidebarOpen ? "ml-64" : "ml-20")}>
          <Header
            currentPage={currentPage}
            isSidebarOpen={sidebarOpen}
            user={currentUser}
            role={role}
          />
          {!isVerified && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">Account Not Verified - Please check your email to verify your account to unlock all features.</span>
              </div>
              <button 
                onClick={() => window.open('/mock-email', '_blank')}
                className="text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Open Email
              </button>
            </div>
          )}
          <main className="p-6 relative flex-1 flex flex-col">
            {!isVerified && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 max-w-sm text-center">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Verification Required</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your account must be verified before you can access the dashboard modules and perform transactions.
                  </p>
                  <button 
                    onClick={handleVerifyRequest}
                    disabled={requestCount >= 3 || cooldown > 0}
                    className="w-full bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {requestCount >= 3 
                      ? "Limit Reached" 
                      : cooldown > 0 
                      ? `Resend available in ${formatTime(cooldown)}` 
                      : "Verify Email Now"}
                  </button>
                  {requestCount >= 3 && (
                    <p className="text-xs text-red-500 mt-2 font-medium">You've reached the maximum verify email requests.</p>
                  )}
                </div>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};