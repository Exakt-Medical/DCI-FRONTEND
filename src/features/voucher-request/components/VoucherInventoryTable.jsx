import { Card } from "../../../components/Card";
import { voucherInventoryService } from "../../../services/voucherInventoryService";

const statusStyles = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border border-blue-200",
  USED: "bg-amber-50 text-amber-700 border border-amber-200",
  EXPIRED: "bg-rose-50 text-rose-700 border border-rose-200",
};

export const VoucherInventoryTable = ({ rows }) => {
  return (
    <Card className="p-4">
      {rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">
          No transaction credits found for this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Code</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.voucherId} className="border-b border-gray-100">
                  <td className="py-3 font-mono text-xs font-semibold text-gray-900">{row.voucherCode}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[row.inventoryStatus] || "bg-gray-100 text-gray-700"}`}>
                      {voucherInventoryService.getStatusLabel(row.inventoryStatus)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-700">{row.assignedToPlate || "-"}</td>
                  <td className="py-3 text-gray-600 text-xs font-mono">{row.batchId}</td>
                  <td className="py-3 text-gray-600 text-xs">{new Date(row.dateCreated).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
