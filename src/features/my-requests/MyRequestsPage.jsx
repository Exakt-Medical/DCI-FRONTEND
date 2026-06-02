import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import {
  FileText, Plus, Eye, Search, CheckCircle, Clock, XCircle, Download
} from "lucide-react";

const voucherDone = (s) => s === "VOUCHER_ISSUED";
const clearanceDone = (s) => s === "CERTIFICATE_ISSUED";

const StepBadge = ({ label, done, children }) => (
  <div className="flex items-center gap-2">
    {done ? (
      <CheckCircle size={16} className="text-green-600 shrink-0" />
    ) : (
      <Clock size={16} className="text-gray-300 shrink-0" />
    )}
    <span className={`text-xs ${done ? "text-green-700 font-medium" : "text-gray-400"}`}>
      {label}
    </span>
    {children}
  </div>
);

export const MyRequestsPage = ({ role, onNavigate }) => {
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);

  const filtered = requests.filter(
    (r) =>
      (r.voucherReferenceNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.clearanceReferenceNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.plateNumber || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDownload = (certNo) => {
    const blob = new Blob([`Clearance Certificate: ${certNo}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Requests</h1>
          <p className="text-sm text-gray-500">
            Track your voucher and clearance requests at a glance
          </p>
        </div>
        <Button onClick={() => onNavigate?.("new-voucher-request")}>
          <Plus size={16} /> New Request
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
          <FileText size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">All Requests</h3>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} record{filtered.length !== 1 && "s"}
          </span>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by reference or plate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No requests yet</p>
            <p className="text-xs mt-1">Click "New Request" to start a voucher request</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Reference</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Plate No.</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Step 1: Voucher</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Step 2: Clearance</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.voucherRequestId || req.clearanceRequestId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <span className="font-mono text-xs font-medium text-gray-900">
                        {req.voucherReferenceNo || req.clearanceReferenceNo}
                      </span>
                      {req.clearanceReferenceNo && req.voucherReferenceNo && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{req.clearanceReferenceNo}</div>
                      )}
                    </td>
                    <td className="py-3 text-gray-700">{req.plateNumber || "—"}</td>
                    <td className="py-3">
                      <StepBadge label="Voucher Request" done={voucherDone(req.voucherStatus)} />
                    </td>
                    <td className="py-3">
                      <StepBadge label="Clearance Request" done={clearanceDone(req.clearanceStatus)}>
                        {clearanceDone(req.clearanceStatus) && req.certificateNo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(req.certificateNo)}
                            title="Download Certificate"
                            className="ml-2"
                          >
                            <Download size={12} />
                          </Button>
                        )}
                      </StepBadge>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{req.dateCreated || "—"}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {req.voucherRequestId && (
                          <Button variant="ghost" size="sm"
                            onClick={() => onNavigate?.("new-clearance-request", req)} title="Proceed to Clearance">
                            <Eye size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
