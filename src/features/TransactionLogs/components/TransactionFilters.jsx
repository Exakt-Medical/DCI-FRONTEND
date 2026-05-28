// features/transactions/components/TransactionFilters.jsx
import { Card } from "../../../components/Card";
import { Dropdown } from "../../../components/Dropdown";
import { Search } from "lucide-react";

export const TransactionFilters = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
}) => {
  // Dropdown options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Authenticated", label: "Authenticated" },
    { value: "Verified", label: "Verified" },
    { value: "Failed", label: "Failed" },
  ];

  return (
    <Card className="p-4 mb-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by account name, company, or reference number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter - Always Visible */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            Status:
          </span>
          <Dropdown
            options={statusOptions}
            value={selectedStatus}
            onChange={onStatusChange}
            placeholder="Select status"
            buttonClassName="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 min-w-[140px]"
          />
        </div>

        {/* Clear Filters Button - Only shows when filter is active */}
        {selectedStatus !== "all" && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>
    </Card>
  );
};
