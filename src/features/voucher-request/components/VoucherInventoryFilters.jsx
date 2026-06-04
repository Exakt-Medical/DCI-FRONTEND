import { Search } from "lucide-react";
import { Input } from "../../../components/Input";

export const VoucherInventoryFilters = ({
  filterOptions,
  activeFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                isActive
                  ? "bg-[#0059b5] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {filter.label} ({filter.count})
            </button>
          );
        })}
      </div>

      <Input
        placeholder="Search by voucher code, batch, or plate..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        icon={<Search size={15} />}
      />
    </div>
  );
};
