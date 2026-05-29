import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Users, RefreshCw } from "lucide-react";

const AgentsTab = ({ agents }) => {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">Agent List</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={12} className="mr-1" /> Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                Agent Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                Branch
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                Assigned Vouchers
              </th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr
                key={agent.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {agent.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {agent.email}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {agent.branch}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700">
                    {agent.assignedVouchers} vouchers
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AgentsTab;
