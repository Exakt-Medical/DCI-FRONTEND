import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { StatusBadge } from "../StatusBadge";
import { LogOut } from "lucide-react";

export const AdminLayout = ({ children, role, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.replace("/", "");

  const adminNav = [
    { section: "Home", items: [{ id: "dashboard", label: "Dashboard", disabled: false }] },
    { section: "Administrative", items: [{ id: "accounts", label: "Accounts", disabled: true }, { id: "company", label: "Company", disabled: false }] },
    { section: "Manage", items: [{ id: "vehicles", label: "Vehicle Database", disabled: true }, { id: "mvtype", label: "MV Type", disabled: true }, { id: "activitylogs", label: "Activity Logs", disabled: true }] },
  ];

  const agentNav = [
    { section: "Administrative", items: [{ id: "accounts", label: "Accounts", disabled: true }] },
    { section: "CTPL Insurance", items: [{ id: "verification", label: "Verification", disabled: false }, { id: "transactions", label: "Transaction", disabled: true }, { id: "vouchers", label: "Tickets/Vouchers", disabled: false }] },
    { section: "Manage", items: [{ id: "activitylogs", label: "Activity Logs", disabled: true }] },
  ];

  const nav = role === "ADMIN" ? adminNav : agentNav;

  const handleNavigation = (item) => {
    if (!item.disabled) {
      navigate("/" + item.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="flex-shrink-0 flex flex-col border-r border-gray-200 w-64 bg-white">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-sapphire-700 rounded-lg flex-shrink-0 flex items-center justify-center text-sm text-white font-bold">VV</div>
          <div className="overflow-hidden">
            <p className="text-gray-900 text-xs font-black truncate leading-tight">VVIP</p>
            <p className="text-gray-500 text-[10px] truncate">Verification Portal</p>
          </div>
        </div>
        <nav className="flex-1 py-6 overflow-y-auto">
          {nav.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 mb-2">{group.section}</p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center text-sm transition-all px-6 py-2.5 justify-start gap-3",
                    !item.disabled && currentPage === item.id
                      ? "bg-primary-50 text-primary-600 border-r-2 border-primary-500"
                      : "text-gray-600",
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                  )}
                >
                  <span className="font-medium truncate">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <button
          onClick={onLogout}
          className="mx-3 mb-3 px-3 py-2 rounded-lg text-gray-500 hover:text-carnelian-600 hover:bg-carnelian-50 border border-gray-200 transition-colors flex items-center justify-center gap-2 text-xs font-medium"
        >
          <LogOut size={14} /> Logout
        </button>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-base font-bold text-gray-900 capitalize">{currentPage.replace(/([a-z])([A-Z])/g, '$1 $2')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vehicle Verification Insurance Program</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-lg">
                🔔
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-carnelian-500 rounded-full" />
            </div>
            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-sapphire-700 rounded-full flex items-center justify-center text-xs text-white font-bold">
                {role === "ADMIN" ? "A" : "AG"}
              </div>
              <span className="text-xs font-medium text-gray-900">{role === "ADMIN" ? "Admin User" : "Agent User"}</span>
              <StatusBadge status="Active" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};