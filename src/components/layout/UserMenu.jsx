import { useState } from "react";
import { cn } from "../../utils/cn";
import { LogOut, User, Key, ChevronDown } from "lucide-react";

export function UserMenu({
  user,
  role,
  isSidebarOpen,
  onMyProfile,
  onChangePassword,
  onLogout,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleDisplayName = () => {
    const names = {
      admin: "Admin",
      viewer: "Viewer",
      manager: "Manager",
      agent: "Agent",
    };
    return names[role] || "User";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white",
            user.color,
          )}
        >
          {user.initial}
        </div>
        {isSidebarOpen && (
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">{user.label}</p>
          </div>
        )}
        <ChevronDown
          size={14}
          className={cn(
            "text-gray-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                setIsOpen(false);
                onMyProfile?.();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User size={14} /> Profile
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onChangePassword?.();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Key size={14} /> Password
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => {
                setIsOpen(false);
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
  );
}
