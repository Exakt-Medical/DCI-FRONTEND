// features/dashboard/ManagerDashboard.jsx
import { useState } from "react";
import { Card } from "../../components/Card";
import {
  TrendingUp,
  CheckCircle,
  ShoppingCart,
  Ticket,
  Users,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  MOCK_DASHBOARD_STATS,
  MOCK_RECENT_TRANSACTIONS,
} from "../../constants/dashboardMockData";

export const ManagerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const stats = MOCK_DASHBOARD_STATS;
  const transactions = MOCK_RECENT_TRANSACTIONS;

  // Filter transactions based on search
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.dciAuthCode
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.plateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.mvFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.chassisNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.engineNo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +{trend} from last week
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}
        >
          <Icon size={20} className={`text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Manager Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of your team's performance and transaction monitoring
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Last Week Authenticated"
          value={stats.lastWeekAuthenticated}
          icon={CheckCircle}
          color="blue"
          trend="12"
        />
        <StatCard
          title="Today's Authenticated"
          value={stats.todayAuthenticated}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Today's Purchased Vouchers"
          value={stats.todayPurchasedVouchers}
          icon={ShoppingCart}
          color="purple"
        />
        <StatCard
          title="Available Vouchers"
          value={stats.availableVouchers}
          icon={Ticket}
          color="orange"
        />
      </div>

      {/* Agent Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Total Agents
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.agentsCount}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Users size={12} /> Active under your management
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Sub Agents
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.subAgentsCount}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <UserCheck size={12} /> Assigned to agents
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <UserCheck size={20} className="text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Recent Transactions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Latest authentication activities from your team
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  DCI Auth Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Plate No.
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  MV File No.
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Chassis No.
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Engine No.
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {transaction.agent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-bold text-primary-600">
                      {transaction.dciAuthCode}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-700">
                      {transaction.plateNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 font-mono">
                      {transaction.mvFile}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 font-mono">
                      {transaction.chassisNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 font-mono">
                      {transaction.engineNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {transaction.dateCreated}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredTransactions.length)}{" "}
              of {filteredTransactions.length} transactions
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
