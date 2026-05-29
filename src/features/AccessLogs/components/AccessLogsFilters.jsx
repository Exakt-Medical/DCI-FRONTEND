import { Search, Filter, RefreshCw, Download } from "lucide-react";
import { Dropdown } from "../../../components/Dropdown";

export const AccessLogsFilters = ({
  searchTerm,
  onSearchChange,
  sortOrder,
  onSortChange,
  onRefresh,
  onExport,
}) => {
  const sortOptions = [
    { value: "desc", label: "Most Recent" },
    { value: "asc", label: "Oldest" },
  ];

  return (
    <div className="p-5 border-b border-gray-100">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative sm:w-48">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
            />
            <Dropdown
              options={sortOptions}
              value={sortOrder}
              onChange={onSortChange}
              placeholder="Sort by"
              buttonClassName="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50"
            />
          </div>

          <button
            onClick={onRefresh}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>
    </div>
  );
};
