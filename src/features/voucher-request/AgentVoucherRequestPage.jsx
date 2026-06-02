import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Users, Plus, Eye, Search, Ticket } from "lucide-react";

const STATUS_STYLES = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  ORCR_UPLOADED: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  PAYMENT_PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  PAYMENT_COMPLETED: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  VOUCHER_ISSUED: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
};

export const AgentVoucherRequestPage = ({ onNavigate }) => {
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Client Voucher Requests
          </h1>
          <p className="text-sm text-gray-500">
            Manage voucher requests for your clients
          </p>
        </div>
        <Button onClick={() => onNavigate?.("new-voucher-request")}>
          <Plus size={16} />
          New Voucher Request
        </Button>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
          <Users size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">All Voucher Requests</h3>
          <span className="text-xs text-gray-400 ml-auto">
            {requests.length} record{requests.length !== 1 && "s"}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Ticket size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No voucher requests yet</p>
            <p className="text-xs mt-1">Create a new voucher request for your client</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Input placeholder="Search by reference, plate, or client..." value={search}
                onChange={(e) => setSearch(e.target.value)} icon={<Search size={16} />} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Reference No.</th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Plate Number</th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Client</th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date Created</th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const style = STATUS_STYLES[req.status] || STATUS_STYLES.DRAFT;
                    return (
                      <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-mono text-xs font-medium text-gray-900">{req.referenceNo}</td>
                        <td className="py-3 text-gray-700">{req.plateNumber || "—"}</td>
                        <td className="py-3 text-gray-700">{req.clientName || "—"}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {req.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{req.dateCreated}</td>
                        <td className="py-3">
                          <Button variant="ghost" size="sm" onClick={() => onNavigate?.("view-voucher-request", req)}>
                            <Eye size={14} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
