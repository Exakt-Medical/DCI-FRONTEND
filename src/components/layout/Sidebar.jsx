import { useState } from "react";
import { cn } from "../../utils/cn";
import { Menu } from "lucide-react";
import { NavSection } from "./NavSection";

export function Sidebar({
  navConfig,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  // Group by section
  const groupedNav = navConfig.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-30",
        isSidebarOpen ? "w-64" : "w-20",
      )}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-white">DCI</span>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800">
                DCI Clearance
              </span>
              <span className="text-xs text-gray-500">Verification System</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100%-4rem)] overflow-y-auto py-4">
        {Object.entries(groupedNav).map(([section, items]) => (
          <NavSection
            key={section}
            section={section}
            items={items}
            isSidebarOpen={isSidebarOpen}
          />
        ))}
      </nav>
    </aside>
  );
}
