import { Button } from "../../../components/Button";
import { Dropdown } from "../../../components/Dropdown";
import { Search, Filter, RefreshCw, Download } from "lucide-react";

export const TicketSearchBar = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  selectedStatus,
  onStatusChange,
  selectedType,
  onTypeChange,
  onRefresh,
  onExport,
  onClearFilters,
  statusOptions,
  typeOptions,
}) => {
  const hasActiveFilters = selectedStatus !== "all" || selectedType !== "all";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by reference number, name, or company..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="secondary"
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter size={16} /> Filters
          {hasActiveFilters && (
            <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh
        </Button>
        <Button
          onClick={onExport}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600"
        >
          <Download size={16} /> Export
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">Status:</span>
            <Dropdown
              options={statusOptions}
              value={selectedStatus}
              onChange={onStatusChange}
              placeholder="Select status"
              buttonClassName="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-w-[130px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">Type:</span>
            <Dropdown
              options={typeOptions}
              value={selectedType}
              onChange={onTypeChange}
              placeholder="Select type"
              buttonClassName="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-w-[130px]"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
