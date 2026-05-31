import { Card } from "../../../components/Card";
import { Spinner } from "../../../components/Spinner";
import { History } from "lucide-react";
import { formatCurrency, VOUCHER_VALUE } from "../TransferVoucherPage";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const HistoryTab = ({ transferHistory, isLoadingHistory }) => {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <History size={18} className="text-primary-600" />
        <h3 className="text-base font-bold text-gray-900">Transfer History</h3>
        {!isLoadingHistory && transferHistory.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {transferHistory.length} transfer
            {transferHistory.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
          <Spinner size="sm" />
          <span className="text-sm">Loading history...</span>
        </div>
      ) : transferHistory.length === 0 ? (
        <div className="text-center py-8">
          <History size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transfer history found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Reference #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Agent
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Quantity
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Total Value
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transferHistory.map((transfer) => (
                <tr
                  key={transfer.referenceNumber}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(transfer.transferredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-gray-600">
                      {transfer.referenceNumber}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transfer.toAgentName || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transfer.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">
                    {formatCurrency(transfer.totalValue)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                      {transfer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default HistoryTab;
