import { Card } from "../../../components/Card";

export const BranchStatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div
        className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}
      >
        <Icon size={20} className={`text-${color}-600`} />
      </div>
    </div>
  </Card>
);
