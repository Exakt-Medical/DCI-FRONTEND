import { NavItem } from "./NavItem";

export function NavSection({
  section,
  items,
  isSidebarOpen,
  currentPage,
  onNavigate,
}) {
  return (
    <div className="mb-6">
      {isSidebarOpen && (
        <div className="px-4 mb-2">
          <p className="text-[10px] font-semibold text-gray-400 tracking-wider">
            {section}
          </p>
        </div>
      )}
      {items.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          isActive={currentPage === item.id}
          isSidebarOpen={isSidebarOpen}
          onClick={onNavigate}
        />
      ))}
    </div>
  );
}
