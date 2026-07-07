import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";

export function NavItem({ item, isActive, isSidebarOpen }) {
  const Icon = item.icon;
  const navigate = useNavigate();

  return (
    <button
      onClick={() => !item.disabled && navigate(`/dci-access/${item.id}`)}
      disabled={item.disabled}
      className={cn(
        "w-full flex items-center transition-all duration-200 my-1",
        isSidebarOpen ? "px-4 py-2 gap-3" : "px-2 py-3 justify-center",
        isActive && !item.disabled
          ? "bg-primary-500/10 text-primary-600 border-r-2 border-primary-500"
          : item.disabled
            ? "text-gray-400 cursor-not-allowed opacity-60"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
      title={item.disabled ? "Under Development" : ""}
    >
      <Icon size={18} />
      {isSidebarOpen && (
        <span className="text-sm font-medium">{item.label}</span>
      )}
    </button>
  );
}
