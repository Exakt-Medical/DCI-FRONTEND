import { useState } from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Clock, RefreshCw, Copy, FileText } from "lucide-react";

export const PurchaseHistoryTable = ({
  purchaseHistory,
  formatCurrency,
  copyToClipboard,
}) => {
  const [filterStatus, setFilterStatus] = useState("all");

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-700";
      case "Redeemed":
        return "bg-blue-100 text-blue-700";
      case "Expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredHistory = purchaseHistory.filter((transaction) => {
    if (filterStatus === "all") return true;
    return transaction.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-600" />
          <h3 className="text-base font-bold text-gray-900">
            Purchase History
          </h3>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            <RefreshCw size={12} />
          </Button>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Policy Number
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Plan
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Premium
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Valid Until
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Transaction Code
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((policy) => (
                <tr
                  key={policy.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-medium text-gray-900">
                      {policy.policyNumber}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {policy.productName}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">
                    {formatCurrency(policy.premium)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {policy.expirationDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(policy.status)}`}
                    >
                      {policy.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-500">
                        {policy.voucherCode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(policy.voucherCode)}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                        title="Copy transaction code"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No purchase history found</p>
          <p className="text-sm text-gray-400 mt-1">
            Purchase your first CTPL policy above
          </p>
        </div>
      )}
    </Card>
  );
};
