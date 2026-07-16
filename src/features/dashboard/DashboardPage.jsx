import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { dashboardService } from "../../services/dashboardService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  FileCheck,
  ShieldCheck,
  Car,
  Activity,
  Server,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
} from "lucide-react";

const welcomeMessages = {
  citizen: "Welcome, Citizen! File a clearance request for your vehicle.",
  agent_fixer: "Welcome, Agent! Manage clearance requests for your clients.",
  hpg: "Welcome, HPG! Verify vehicles and manage tickets.",
  dci: "Welcome, DCI! Look up certificates and manage tickets.",
  admin: "Welcome, Admin! Manage the DCI Clearance system.",
};

const StatusBadge = ({ status }) => {
  if (status === "UP") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle size={12} /> UP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle size={12} /> DOWN
    </span>
  );
};

export const DashboardPage = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardService.getDashboardData(1, 50);
        setData(res);
      } catch (err) {
        console.info("Dashboard backend not available yet, using defaults");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await dashboardService.getHealthCheck();
        setHealth(res);
      } catch (err) {
        setHealth({ status: "DOWN", services: {} });
      } finally {
        setHealthLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = data?.stats || {};
  const transactions = data?.recentTransactions || [];

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers || 0,
      icon: Users,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Transactions",
      value: stats.totalTransactions || 0,
      icon: FileCheck,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "DCI Certificates",
      value: stats.totalDciCertificates || 0,
      icon: ShieldCheck,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Processed Vehicles",
      value: stats.totalProcessedVehicles || 0,
      icon: Car,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const topDciData = (stats.topDciEmployees || []).map((e) => ({
    name: e.name.length > 12 ? e.name.substring(0, 12) + "..." : e.name,
    count: e.count,
    fullName: e.name,
  }));

  const topHpgData = (stats.topHpgEmployees || []).map((e) => ({
    name: e.name.length > 12 ? e.name.substring(0, 12) + "..." : e.name,
    count: e.count,
    fullName: e.name,
  }));

  const statusBreakdown = transactions.reduce(
    (acc, t) => {
      const status = t.dciAuthCode && t.dciAuthCode !== "N/A" ? "Completed" : "Pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { Completed: 0, Pending: 0 },
  );
  const pieData = [
    { name: "Completed", value: statusBreakdown.Completed },
    { name: "Pending", value: statusBreakdown.Pending },
  ].filter((d) => d.value > 0);

  const services = health?.services || {};
  const isOverallUp = health?.status === "UP";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          {welcomeMessages[role] || "Welcome back. Here's what's happening today."}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
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
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-black text-gray-900 mt-2 tracking-tight">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={18} className={stat.iconColor} />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-primary-500" />
                    <div className="h-1 w-4 rounded-full bg-primary-300" />
                    <div className="h-1 w-2 rounded-full bg-primary-200" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Server Healthcheck */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[#1a3a6b]" />
            <h3 className="text-base font-semibold text-gray-900">Server Health</h3>
          </div>
          {healthLoading ? (
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            <StatusBadge status={isOverallUp ? "UP" : "DOWN"} />
          )}
        </div>

        {healthLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* API Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Server size={18} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">API Server</p>
                <StatusBadge status={services.api?.status || "DOWN"} />
              </div>
            </div>

            {/* Database Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Database size={18} className="text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Database</p>
                <StatusBadge status={services.database?.status || "DOWN"} />
              </div>
            </div>

            {/* Users Service */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Users Service</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={services.users?.status || "DOWN"} />
                  {services.users?.count !== undefined && (
                    <span className="text-xs text-gray-500">({services.users.count})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {health && !healthLoading && (
          <p className="text-xs text-gray-400 mt-3">
            Last checked: {new Date(health.timestamp).toLocaleTimeString()} · Auto-refreshes every 30s
          </p>
        )}
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top DCI Employees */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-[#1a3a6b]" />
            <h3 className="text-base font-semibold text-gray-900">Top DCI Employees</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : topDciData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No DCI employee data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topDciData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name, props) => [value, "Transactions"]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Bar dataKey="count" fill="#1a3a6b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top HPG Employees */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">Top HPG Employees</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : topHpgData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No HPG employee data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topHpgData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name, props) => [value, "Verifications"]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                />
                <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status Breakdown Pie */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck size={18} className="text-amber-600" />
            <h3 className="text-base font-semibold text-gray-900">Transaction Status</h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-[220px]">
              <div className="h-32 w-32 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No transaction data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={index === 0 ? "#1a3a6b" : "#f59e0b"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};
