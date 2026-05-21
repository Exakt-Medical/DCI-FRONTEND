import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { dashboardService } from "../../services/dashboardService";
import { 
  Building2, CheckCircle, PauseCircle, CreditCard, 
  Search, ChevronLeft, ChevronRight
} from "lucide-react";

export const DashboardPage = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentTransactions()
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

  const statCards = [
    { label: "Total Companies", value: stats?.totalCompanies || 0, icon: Building2, color: "from-primary-50 to-primary-100", accent: "text-primary-600", change: "" },
    { label: "Active Companies", value: stats?.activeCompanies || 0, icon: CheckCircle, color: "from-limerick-50 to-limerick-100", accent: "text-limerick-600", change: "" },
    { label: "Inactive Companies", value: stats?.inactiveCompanies || 0, icon: PauseCircle, color: "from-gray-50 to-gray-100", accent: "text-gray-600", change: "" },
    { label: "Transactions Today", value: stats?.transactionsToday || 0, icon: CreditCard, color: "from-carnelian-50 to-carnelian-100", accent: "text-carnelian-600", change: "" },
  ];

  const filtered = transactions.filter(t =>
    [t.agent, t.company, t.assuredName, t.authNo].some(v =>
      String(v || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Dashboard Overview</h1>
        <p className="text-sm text-gray-600">Welcome back. Here's what's happening today.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={cn("bg-gradient-to-br rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow", s.color)}
          >
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{s.label}</p>
                  <s.icon size={24} className={s.accent} />
                </div>
                <p className={cn("text-3xl font-bold", s.accent)}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-2">{s.change}</p>
              </>
            )}
          </div>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest activity from all companies</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Agent", "Company", "Assured Name", "Auth No.", "Date Created"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-600 px-6 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No transactions found</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><span className="text-sm font-medium text-gray-900">{t.agent}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-600">{t.company}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-700">{t.assuredName}</span></td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-md">{t.authNo}</span>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-500">{t.dateCreated}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{transactions.length}</span> records
          </p>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"><ChevronLeft size={16} /></button>
            <button className="w-8 h-8 rounded-lg text-sm font-medium bg-primary-500 text-white shadow-sm">1</button>
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}