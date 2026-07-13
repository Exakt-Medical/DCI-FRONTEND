import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { CertificateActionButtons } from "../clearance-request/components/CertificateActionButtons";
import { useAuth } from "../../context/AuthContext";
import { fetchMyRequests } from "../../services/certificateRequestService";
import {
  FileText, Plus, Eye, Search, CheckCircle, Clock, CreditCard, ChevronLeft, ChevronRight, Loader2, XCircle
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
        <span className="text-amber-700">For Uploading of HPG Clearance</span>
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

export const MyRequestsPage = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [counts, setCounts] = useState({ all: 0, completed: 0, voucher: 0, clearance: 0 });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const loadAllRequests = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyRequests(currentPage - 1, itemsPerPage, debouncedSearch, activeFilter);
      setRequests(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, [currentPage, itemsPerPage, debouncedSearch, activeFilter]);

  const navigate = useNavigate();
  const isAgent = role === "agent_fixer";

  const summaryCards = useMemo(
    () => [
      {
        id: "all",
        label: "All Requests",
        value: counts.all,
        description: "Show every request in one list",
      },
      {
        id: "completed",
        label: "Completed Requests",
        value: counts.completed,
        description: "Transaction code and clearance already issued",
      },
      {
        id: "voucher",
        label: "In Progress Transaction Code",
        value: counts.voucher,
        description: "Still waiting on transaction code issuance",
      },
      {
        id: "clearance",
        label: "Awaiting Clearance",
        value: counts.clearance,
        description: "Transaction code done, clearance still in progress",
      },
    ],
    [counts],
  );

  const activeCard = summaryCards.find((card) => card.id === activeFilter);

  const handleCreateRequest = () => {
    navigate("/dci-access/new-clearance-request");
  };

  const handleOpenRequest = (req) => {
    navigate(`/dci-access/new-clearance-request?id=${req.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{isAgent ? "Client Requests" : "My Requests"}</h1>
          <p className="text-sm text-gray-500">
            {isAgent
              ? "Manage your clients from transaction code issuance to certificate completion"
              : "Track your request progress."}
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
              onClick={() => {
                setActiveFilter(card.id);
                setCurrentPage(1);
              }}
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
            <Button variant="ghost" size="sm" onClick={() => { setActiveFilter("all"); setCurrentPage(1); }}>
              Show All
            </Button>
          )}
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search by reference or plate number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            icon={<Search size={16} />}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
            <p className="text-gray-500 text-sm font-medium">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
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
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Transaction Code</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Clearance</th>
                  <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id || req.voucherReferenceNo || req.clearanceReferenceNo} className="border-b border-gray-100 hover:bg-gray-50">
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
                        {req.id || req.voucherReferenceNo || req.clearanceReferenceNo}
                      </span>
                      {req.clearanceReferenceNo && req.voucherReferenceNo && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{req.clearanceReferenceNo}</div>
                      )}
                    </td>
                    <td className="py-3 text-gray-700">{req.plateNumber || "-"}</td>
                    {req.status === "VERIFICATION_FAILED" ? (
                      <td colSpan={2} className="py-3 pr-4">
                        <div className="flex items-center justify-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-red-50 border border-red-500 w-full">
                          <XCircle size={14} className="text-red-600 shrink-0" />
                          <span className="text-red-700">VERIFICATION FAILED REQUEST</span>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-3">
                          <StatusBadge done={voucherDone(req)} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge done={clearanceDone(req)} />
                          </div>
                        </td>
                      </>
                    )}
                    <td className="py-3 text-gray-500 text-xs">
                      {req.dateCreated ? new Date(req.dateCreated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-sm text-gray-500">
              Showing {totalElements === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalElements)} of {totalElements} entries
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
