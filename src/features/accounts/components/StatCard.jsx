import { Card } from "../../../components/Card";

export const StatCard = ({ title, value, icon: Icon, color, onClick, active }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl border shadow-lg p-5 transition-all group cursor-pointer ${
      active ? "border-primary-500 ring-2 ring-primary-200" : "border-gray-100"
    } hover:shadow-xl`}
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
      <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
        {Icon ? (
          <Icon size={14} className="text-primary-600" />
        ) : (
          <div className="w-2 h-2 bg-primary-500 rounded-full" />
        )}
      </div>
    </div>
    <div className="mt-4 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <div className="h-1 w-8 bg-primary-500 rounded-full group-hover:w-12 transition-all duration-300" />
        <div className="h-1 w-4 bg-primary-300 rounded-full" />
        <div className="h-1 w-2 bg-primary-200 rounded-full" />
      </div>
    </div>
  </div>
);
