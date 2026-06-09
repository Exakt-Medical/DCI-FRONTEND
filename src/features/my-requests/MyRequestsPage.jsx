import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { CertificateActionButtons } from "../clearance-request/components/CertificateActionButtons";
import {
  FileText, Plus, Eye, Search, CheckCircle, Clock, CreditCard,
} from "lucide-react";

const getVoucherStatus = (request) => {
  if (request?.voucherStatus) return request.voucherStatus;
  if (
    request?.status === "VOUCHER_ISSUED" ||
    request?.status === "HPG_VERIFIED" ||
    request?.status === "CERTIFICATE_ISSUED"
  ) {
    return "VOUCHER_ISSUED";
  }
  return request?.status || "";
};

const getClearanceStatus = (request) => {
  if (request?.clearanceStatus) return request.clearanceStatus;
  if (request?.status === "CERTIFICATE_ISSUED") {
    return "CERTIFICATE_ISSUED";
  }
  return "";
};

const voucherDone = (request) => getVoucherStatus(request) === "VOUCHER_ISSUED";
const clearanceDone = (request) => getClearanceStatus(request) === "CERTIFICATE_ISSUED";

const summaryCardStyles = {
  all: {
    icon: FileText,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-500/10",
    active: "ring-2 ring-slate-500 bg-slate-50",
  },
  completed: {
    icon: CheckCircle,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    active: "ring-2 ring-emerald-500 bg-emerald-50",
  },
  voucher: {
    icon: CreditCard,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-500/10",
    active: "ring-2 ring-blue-500 bg-blue-50",
  },
  clearance: {
    icon: FileText,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-500/10",
    active: "ring-2 ring-indigo-500 bg-indigo-50",
  },
};

const StatusBadge = ({ done }) => (
  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
    {done ? (
      <>
        <CheckCircle size={14} className="text-green-600 shrink-0" />
        <span className="text-green-700">Completed</span>
      </>
    ) : (
      <>
        <Clock size={14} className="text-amber-600 shrink-0" />
        <span className="text-amber-700">Pending</span>
      </>
    )}
  </div>
);

const isCompletedRequest = (request) => voucherDone(request) && clearanceDone(request);

const matchesFilter = (request, filter) => {
  switch (filter) {
    case "completed":
      return isCompletedRequest(request);
    case "voucher":
      return !voucherDone(request);
    case "clearance":
      return voucherDone(request) && !clearanceDone(request);
    case "all":
    default:
      return true;
  }
};

const getDateValue = (dateCreated) => {
  const timestamp = Date.parse(dateCreated || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const MyRequestsPage = ({ role, requests = [], onNavigate }) => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const isAgent = role === "agent_fixer";

  const filtered = useMemo(() => {
    return requests
      .filter(
        (request) =>
          matchesFilter(request, activeFilter) &&
          ((request.voucherReferenceNo || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.clearanceReferenceNo || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.plateNumber || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.requestId || "").toLowerCase().includes(search.toLowerCase())),
      )
      .sort((left, right) => getDateValue(right.dateCreated) - getDateValue(left.dateCreated));
  }, [requests, search, activeFilter]);

  const summaryCards = useMemo(
    () => [
      {
        id: "all",
        label: "All Requests",
        value: requests.length,
        description: "Show every request in one list",
      },
      {
        id: "completed",
        label: "Completed Requests",
        value: requests.filter((request) => isCompletedRequest(request)).length,
        description: "Voucher and clearance already issued",
      },
      {
        id: "voucher",
        label: "Pending Voucher",
        value: requests.filter((request) => !voucherDone(request)).length,
        description: "Still waiting on voucher issuance",
      },
      {
        id: "clearance",
        label: "Pending Clearance",
        value: requests.filter((request) => voucherDone(request) && !clearanceDone(request)).length,
        description: "Voucher done, clearance still in progress",
      },
    ],
    [requests],
  );

  const activeCard = summaryCards.find((card) => card.id === activeFilter);

  const handleCreateRequest = () => {
    onNavigate?.("new-clearance-request");
  };

  const handleOpenRequest = (req) => {
    onNavigate?.("new-clearance-request", req);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{isAgent ? "Client Requests" : "My Requests"}</h1>
          <p className="text-sm text-gray-500">
            {isAgent
              ? "Manage your clients from voucher issuance to certificate completion"
              : "Track your request progress and bring pending items to the top"}
          </p>
        </div>
        <Button onClick={handleCreateRequest}>
          <Plus size={16} /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {summaryCards.map((card) => {
          const styles = summaryCardStyles[card.id];
          const isActive = activeFilter === card.id;
          const Icon = styles.icon;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveFilter(card.id)}
              className={[
                "bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg p-6 text-left transition-all",
                isActive ? styles.active : "hover:shadow-xl hover:scale-[1.02]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-4xl font-black text-gray-900 mt-2 tracking-tight">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-2">{card.description}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                  <Icon size={18} className={styles.iconColor} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
          <FileText size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">All Requests</h3>
          <span className="text-xs text-gray-400 ml-auto">Showing {activeCard?.label?.toLowerCase()}</span>
          {activeFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setActiveFilter("all")}>
              Show All
            </Button>
          )}
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
            <p className="text-xs mt-1">Click "New Request" to start a certification request</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider"></th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Reference</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Plate No.</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Voucher</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Clearance</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.requestId || req.voucherReferenceNo || req.clearanceReferenceNo} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      {clearanceDone(req) && req.certificateNo ? (
                        <CertificateActionButtons row={req} />
                      ) : (
                        <div className="mx-auto grid w-24 grid-cols-3 items-center justify-items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="col-start-2"
                            onClick={() => handleOpenRequest(req)}
                            title="View Request"
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-xs font-medium text-gray-900">
                        {req.requestId || req.voucherReferenceNo || req.clearanceReferenceNo}
                      </span>
                      {req.clearanceReferenceNo && req.voucherReferenceNo && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{req.clearanceReferenceNo}</div>
                      )}
                    </td>
                    <td className="py-3 text-gray-700">{req.plateNumber || "-"}</td>
                    <td className="py-3">
                      <StatusBadge done={voucherDone(req)} />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge done={clearanceDone(req)} />
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{req.dateCreated || "-"}</td>
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
