// features/transactions/components/TransactionStatCard.jsx
import { Card } from "../../../components/Card";

export const TransactionStatCard = ({
  title,
  value,
  icon: Icon,
  onClick,
  isActive,
  color,
}) => {
  // Color mappings for active state
  const getActiveStyles = () => {
    if (!isActive) return {};

    switch (color) {
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
      onClick={onClick}
      className={`
        bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg p-5 
        hover:shadow-xl transition-all group cursor-pointer
        ${isActive ? activeStyles.card : "hover:scale-[1.02]"}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${isActive ? activeStyles.title : ""}`}
          >
            {title}
          </p>
          <p
            className={`text-3xl font-black text-gray-900 mt-2 tracking-tight ${isActive ? activeStyles.value : ""}`}
          >
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors ${isActive ? activeStyles.iconBg : ""}`}
        >
          {Icon ? (
            <Icon
              size={14}
              className={isActive ? `text-${color}-600` : "text-primary-600"}
            />
          ) : (
            <div
              className={`w-2 h-2 rounded-full ${isActive ? activeStyles.bar1 : "bg-primary-500"}`}
            />
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className={`h-1 w-8 rounded-full transition-all duration-300 group-hover:w-12 ${isActive ? activeStyles.bar1 : "bg-primary-500"}`}
          />
          <div
            className={`h-1 w-4 rounded-full ${isActive ? activeStyles.bar2 : "bg-primary-300"}`}
          />
          <div
            className={`h-1 w-2 rounded-full ${isActive ? activeStyles.bar3 : "bg-primary-200"}`}
          />
        </div>
      </div>
    </div>
  );
};
