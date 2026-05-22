// features/transactions/components/TransactionFilters.jsx
import { useState } from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Search, Filter } from "lucide-react";

export const TransactionFilters = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedOrigin,
  onOriginChange,
  onClearFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

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
            placeholder="Search by agent, company, or reference number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter size={16} /> Filters
          {(selectedStatus !== "all" || selectedOrigin !== "all") && (
            <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="Authenticated">Authenticated</option>
              <option value="Verified">Verified</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">Origin:</span>
            <select
              value={selectedOrigin}
              onChange={(e) => onOriginChange(e.target.value)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Origins</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="api">API</option>
            </select>
          </div>
          {(selectedStatus !== "all" || selectedOrigin !== "all") && (
            <button
              onClick={onClearFilters}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
