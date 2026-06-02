import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { StatusBadge } from "../../components/StatusBadge";
import { FileText, Plus, Eye, Search } from "lucide-react";

const MOCK_REQUESTS = [
  {
    referenceNo: "DCI-CLR-2026-0001",
    plateNumber: "ABC1234",
    status: "DRAFT",
    dateCreated: "2026-05-28",
  },
  {
    referenceNo: "DCI-CLR-2026-0002",
    plateNumber: "XYZ5678",
    status: "ORCR_UPLOADED",
    dateCreated: "2026-05-30",
  },
  {
    referenceNo: "DCI-CLR-2026-0003",
    plateNumber: "DEF9012",
    status: "CERTIFICATE_ISSUED",
    dateCreated: "2026-05-25",
  },
  {
    referenceNo: "DCI-CLR-2026-0004",
    plateNumber: "GHI3456",
    status: "HPG_VERIFICATION",
    dateCreated: "2026-06-01",
  },
  {
    referenceNo: "DCI-CLR-2026-0005",
    plateNumber: "JKL7890",
    status: "PAYMENT_PENDING",
    dateCreated: "2026-05-31",
  },
];

const STATUS_STYLES = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  ORCR_UPLOADED: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  PAYMENT_PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  PAYMENT_COMPLETED: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  VOUCHER_ISSUED: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  HPG_VERIFICATION: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  MVC_MEC_UPLOADED: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  CERTIFICATE_ISSUED: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
};

export const ClearancePage = ({ onNavigate }) => {
  const [search, setSearch] = useState("");

  const filtered = MOCK_REQUESTS.filter(
    (r) =>
      r.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      r.plateNumber.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            My Clearance Requests
          </h1>
          <p className="text-sm text-gray-500">
            View and manage your DCI clearance requests
          </p>
        </div>
        <Button onClick={() => onNavigate?.("request-clearance")}>
          <Plus size={16} />
          New Clearance Request
        </Button>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
          <FileText size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">
            Clearance Requests
          </h3>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} record{filtered.length !== 1 && "s"}
          </span>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by reference no. or plate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Reference No.
                </th>
                <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Plate Number
                </th>
                <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Date Created
                </th>
                <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req, i) => {
                const style = STATUS_STYLES[req.status] || STATUS_STYLES.DRAFT;
                return (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs font-medium text-gray-900">
                      {req.referenceNo}
                    </td>
                    <td className="py-3 text-gray-700">{req.plateNumber}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{req.dateCreated}</td>
                    <td className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate?.("request-clearance", req)}
                      >
                        <Eye size={14} />
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No clearance requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
