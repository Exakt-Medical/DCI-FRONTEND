import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { dashboardService } from "../../services/dashboardService";
import {
  Building2,
  CheckCircle,
  PauseCircle,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";

export const DashboardPage = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentTransactions(),
        ]);
        setStats(statsRes.data);
        setTransactions(txRes.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pagination
  const filteredTransactions = transactions.filter((t) =>
    [t.agent, t.company, t.assuredName, t.authNo].some((v) =>
      String(v || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const statCards = [
    {
      label: "Total Companies",
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: "bg-blue-50",
      iconColor: "text-[#1a3a6b]",
      change: "+12% from last month",
    },
    {
      label: "Active Companies",
      value: stats?.activeCompanies || 0,
      icon: CheckCircle,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      change: "+5% from last month",
    },
    {
      label: "Inactive Companies",
      value: stats?.inactiveCompanies || 0,
      icon: PauseCircle,
      color: "bg-gray-50",
      iconColor: "text-gray-500",
      change: "-2% from last month",
    },
    {
      label: "Transactions Today",
      value: stats?.transactionsToday || 0,
      icon: CreditCard,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      change: "+8 from yesterday",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  stat.color,
                )}
              >
                <stat.icon size={20} className={stat.iconColor} />
              </div>
              {!loading && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            {loading ? (
              <>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse" />
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Recent Transactions Table */}
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Latest activity from all companies
            </p>
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search transactions..."
              className="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">
                  Agent
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">
                  Assured Name
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">
                  Auth No.
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">
                  Date Created
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div
                          className="h-3.5 bg-gray-100 rounded animate-pulse"
                          style={{ width: `${60 + j * 10}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {t.agent}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{t.company}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {t.assuredName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono font-medium text-[#1a3a6b] bg-[#1a3a6b]/10 px-2 py-1 rounded-md">
                        {t.authNo}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {t.dateCreated}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {paginatedTransactions.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {filteredTransactions.length}
              </span>{" "}
              transactions
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#1a3a6b] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
