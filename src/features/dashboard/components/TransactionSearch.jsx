// components/dashboard/TransactionSearch.jsx
import { Search } from "lucide-react";

export const TransactionSearch = ({ searchTerm, onSearchChange }) => (
  <div className="relative w-full sm:w-64">
    <Search
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    />
    <input
      type="text"
      placeholder="Search transactions..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
  </div>
);
