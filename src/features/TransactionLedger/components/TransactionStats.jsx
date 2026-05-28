// TransactionStats.jsx
import { TrendingUp, Receipt, FileText, Settings } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  isActive,
  onClick,
  filterType,
}) => (
  <div
    onClick={() => onClick(filterType)}
    className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl border p-5 shadow-lg hover:shadow-xl transition-all group cursor-pointer ${
      isActive
        ? "border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/30"
        : "border-gray-100"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-black text-gray-900 mt-2 tracking-tight">
          {value.toLocaleString()}
        </p>
      </div>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-primary-500/20 transition-colors ${
          isActive ? "bg-primary-500/20" : "bg-primary-500/10"
        }`}
      >
        {Icon ? (
          <Icon
            size={14}
            className={`${isActive ? "text-primary-700" : "text-primary-600"}`}
          />
        ) : (
          <div className="w-2 h-2 bg-primary-500 rounded-full" />
        )}
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            isActive ? "w-12 bg-primary-600" : "w-8 bg-primary-500"
          }`}
        />
        <div className="h-1 w-4 bg-primary-300 rounded-full" />
        <div className="h-1 w-2 bg-primary-200 rounded-full" />
      </div>
    </div>
  </div>
);

export const TransactionStats = ({
  totalTransactions,
  totalVoucherRequests,
  totalVoucherAdjustments,
  activeFilter,
  onFilterChange,
}) => {
  const regularTransactions =
    totalTransactions - totalVoucherRequests - totalVoucherAdjustments;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Transactions"
        value={totalTransactions}
        icon={Receipt}
        isActive={activeFilter === "all"}
        onClick={onFilterChange}
        filterType="all"
      />
      <StatCard
        title="Transaction"
        value={regularTransactions}
        icon={TrendingUp}
        isActive={activeFilter === "transaction"}
        onClick={onFilterChange}
        filterType="transaction"
      />
      <StatCard
        title="Voucher Request"
        value={totalVoucherRequests}
        icon={FileText}
        isActive={activeFilter === "request"}
        onClick={onFilterChange}
        filterType="request"
      />
      <StatCard
        title="Voucher Adjustment"
        value={totalVoucherAdjustments}
        icon={Settings}
        isActive={activeFilter === "adjustment"}
        onClick={onFilterChange}
        filterType="adjustment"
      />
    </div>
  );
};
