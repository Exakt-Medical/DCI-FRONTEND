// features/dashboard/components/StatsGrid.jsx
import { StatCard } from "./StatCard";

export const StatsGrid = ({ stats }) => {
  // First row: 3 cards
  const firstRowStats = [
    {
      title: "Last Week Authenticated Transactions",
      value: stats.lastWeekAuthenticated || 0,
      icon: stats.lastWeekAuthenticatedIcon,
    },
    {
      title: "Today's Authenticated Transactions",
      value: stats.todayAuthenticated || 0,
      icon: stats.todayAuthenticatedIcon,
    },
    {
      title: "Today's Purchased Vouchers",
      value: stats.todayPurchasedVouchers || 0,
      icon: stats.todayPurchasedVouchersIcon,
    },
  ];

  // Second row: 3 cards
  const secondRowStats = [
    {
      title: "Available Vouchers",
      value: stats.availableVouchers || 0,
      icon: stats.availableVouchersIcon,
    },
    {
      title: "Agent's Count",
      value: stats.agentsCount || 0,
      icon: stats.agentsCountIcon,
    },
    {
      title: "Subagent's Count",
      value: stats.subagentsCount || 0,
      icon: stats.subagentsCountIcon,
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {firstRowStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Second Row - 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {secondRowStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>
    </div>
  );
};
