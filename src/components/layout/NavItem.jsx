import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

export function NavItem({ item, isSidebarOpen }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <button
        disabled
        className={cn(
          "w-full flex items-center transition-all duration-200 my-1",
          isSidebarOpen ? "px-4 py-2 gap-3" : "px-2 py-3 justify-center",
          "text-gray-400 cursor-not-allowed opacity-60"
        )}
        title="Under Development"
      >
        <Icon size={18} />
        {isSidebarOpen && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
      </button>
    );
  }

  return (
    <NavLink
      to={`/dci-access/${item.id}`}
      className={({ isActive }) =>
        cn(
          "w-full flex items-center transition-all duration-200 my-1",
          isSidebarOpen ? "px-4 py-2 gap-3" : "px-2 py-3 justify-center",
          isActive
            ? "bg-primary-500/10 text-primary-600 border-r-2 border-primary-500"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )
      }
    >
      <Icon size={18} />
      {isSidebarOpen && (
        <span className="text-sm font-medium">{item.label}</span>
      )}
    </NavLink>
  );
}
