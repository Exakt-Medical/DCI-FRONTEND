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

const welcomeMessages = {
  citizen: "Welcome, Citizen! File a clearance request for your vehicle.",
  agent_fixer: "Welcome, Agent! Manage clearance requests for your clients.",
  hpg: "Welcome, HPG! Verify vehicles and manage tickets.",
  lto: "Welcome, LTO! Look up certificates and manage tickets.",
  admin: "Welcome, Admin! Manage the DCI Clearance system.",
};

export const DashboardPage = ({ role }) => {
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
        console.info("Dashboard backend not available yet, using defaults");
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
    },
    {
      label: "Active Companies",
      value: stats?.activeCompanies || 0,
      icon: CheckCircle,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Inactive Companies",
      value: stats?.inactiveCompanies || 0,
      icon: PauseCircle,
      color: "bg-gray-50",
      iconColor: "text-gray-500",
    },
    {
      label: "Transactions Today",
      value: stats?.transactionsToday || 0,
      icon: CreditCard,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          {welcomeMessages[role] || "Welcome back. Here's what's happening today."}
        </p>
      </div>

      {/* Stats Grid - Clickable Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const getActiveStyles = () => {
            if (!stat.isActive) return {};

            switch (stat.color) {
              case "green":
                return {
                  card: "ring-2 ring-green-500 bg-green-50",
                  title: "text-green-700",
                  value: "text-green-700",
                  iconBg: "bg-green-500/20",
                  bar1: "bg-green-500",
                  bar2: "bg-green-300",
                  bar3: "bg-green-200",
                };

              case "blue":
                return {
                  card: "ring-2 ring-blue-500 bg-blue-50",
                  title: "text-blue-700",
                  value: "text-blue-700",
                  iconBg: "bg-blue-500/20",
                  bar1: "bg-blue-500",
                  bar2: "bg-blue-300",
                  bar3: "bg-blue-200",
                };

              case "red":
                return {
                  card: "ring-2 ring-red-500 bg-red-50",
                  title: "text-red-700",
                  value: "text-red-700",
                  iconBg: "bg-red-500/20",
                  bar1: "bg-red-500",
                  bar2: "bg-red-300",
                  bar3: "bg-red-200",
                };

              default:
                return {
                  card: "ring-2 ring-primary-500 bg-primary-50",
                  title: "text-primary-700",
                  value: "text-primary-700",
                  iconBg: "bg-primary-500/20",
                  bar1: "bg-primary-500",
                  bar2: "bg-primary-300",
                  bar3: "bg-primary-200",
                };
            }
          };

          const activeStyles = getActiveStyles();

          return (
            <div
              key={idx}
              onClick={stat.onClick}
              className={`
          bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg p-6
          hover:shadow-xl transition-all group cursor-pointer
          ${stat.isActive ? activeStyles.card : "hover:scale-[1.02]"}
        `}
            >
              {loading ? (
                <>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className={`
                    text-xs font-semibold text-gray-400 uppercase tracking-wider
                    ${stat.isActive ? activeStyles.title : ""}
                  `}
                      >
                        {stat.label}
                      </p>

                      <p
                        className={`
                    text-4xl font-black text-gray-900 mt-2 tracking-tight
                    ${stat.isActive ? activeStyles.value : ""}
                  `}
                      >
                        {stat.value.toLocaleString()}
                      </p>
                    </div>

                    <div
                      className={`
                  w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center
                  group-hover:bg-primary-500/20 transition-colors
                  ${stat.isActive ? activeStyles.iconBg : ""}
                `}
                    >
                      {stat.icon ? (
                        <stat.icon
                          size={14}
                          className={
                            stat.isActive
                              ? `text-${stat.color}-600`
                              : "text-primary-600"
                          }
                        />
                      ) : (
                        <div
                          className={`
                      w-2 h-2 rounded-full
                      ${stat.isActive ? activeStyles.bar1 : "bg-primary-500"}
                    `}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                    h-1 w-8 rounded-full transition-all duration-300 group-hover:w-12
                    ${stat.isActive ? activeStyles.bar1 : "bg-primary-500"}
                  `}
                      />

                      <div
                        className={`
                    h-1 w-4 rounded-full
                    ${stat.isActive ? activeStyles.bar2 : "bg-primary-300"}
                  `}
                      />

                      <div
                        className={`
                    h-1 w-2 rounded-full
                    ${stat.isActive ? activeStyles.bar3 : "bg-primary-200"}
                  `}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
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
