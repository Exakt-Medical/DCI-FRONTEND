import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { CertificateActionButtons } from "../clearance-request/components/CertificateActionButtons";
import { useAuth } from "../../context/AuthContext";
import { fetchMyRequests } from "../../services/certificateRequestService";
import {
  FileText, Plus, Eye, Search, CheckCircle, Clock, CreditCard, Car, ClipboardList, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { VEHICLE_TYPE_LABELS } from "../new-vehicle-registration/utils/newVehicleRegistrationUtils";

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

const isNewReg = (request) => request.type === "NEW_REGISTRATION";
const voucherDone = (request) => isNewReg(request) ? request.status === "CERTIFICATE_ISSUED" : getVoucherStatus(request) === "VOUCHER_ISSUED";
const clearanceDone = (request) => isNewReg(request) ? request.status === "CERTIFICATE_ISSUED" : getClearanceStatus(request) === "CERTIFICATE_ISSUED";

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
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("dateCreated");
  const [sortDir, setSortDir] = useState("desc");
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);

  const loadAllRequests = async () => {
    try {
      // MOCK BEHAVIOR: Load from localStorage
      const savedRequests = JSON.parse(localStorage.getItem('dci_mock_requests') || '[]');
      setRequests(savedRequests);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, []);

  const navigate = useNavigate();
  const isAgent = role === "agent_fixer";

  const filtered = useMemo(() => {
    return requests
      .filter((request) => {
        const typeMatch =
          vehicleFilter === "all" ||
          (vehicleFilter === "new" && request.type === "NEW_REGISTRATION") ||
          (vehicleFilter === "existing" && (!request.type || request.type !== "NEW_REGISTRATION"));
        return typeMatch && matchesFilter(request, activeFilter) &&
          ((request.voucherReferenceNo || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.clearanceReferenceNo || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.plateNumber || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.refNumber || "").toLowerCase().includes(search.toLowerCase()) ||
            (request.id || "").toLowerCase().includes(search.toLowerCase()));
      });
  }, [requests, search, activeFilter, vehicleFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      let cmp = String(aVal).localeCompare(String(bVal));
      if (sortField === "dateCreated") {
        cmp = getDateValue(a.dateCreated) - getDateValue(b.dateCreated);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = sortedFiltered.slice(safePage * pageSize, (safePage + 1) * pageSize);

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
        description: "Transaction code and clearance already issued",
      },
      {
        id: "voucher",
        label: "In Progress Transaction Code",
        value: requests.filter((request) => !voucherDone(request)).length,
        description: "Still waiting on transaction code issuance",
      },
      {
        id: "clearance",
        label: "Awaiting Clearance",
        value: requests.filter((request) => voucherDone(request) && !clearanceDone(request)).length,
        description: "Transaction code done, clearance still in progress",
      },
    ],
    [requests],
  );

  const activeCard = summaryCards.find((card) => card.id === activeFilter);

  const handleCreateRequest = () => {
    navigate("/dci-access/new-clearance-request");
  };

  const handleOpenRequest = (req) => {
    if (req.type === "NEW_REGISTRATION") {
      navigate("/dci-access/new-vehicle-registration", { state: { request: req } });
    } else {
      navigate("/dci-access/new-clearance-request", { state: { request: req } });
    }
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
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/dci-access/new-vehicle-registration")}>
            <Plus size={16} /> New Registration
          </Button>
          <Button onClick={handleCreateRequest}>
            <Plus size={16} /> New Request
          </Button>
        </div>
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
                "bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg p-5 text-left transition-all",
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

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => setVehicleFilter("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            vehicleFilter === "all" ? "bg-white text-[#0059b5] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClipboardList size={16} />
          All
        </button>
        <button
          onClick={() => setVehicleFilter("new")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            vehicleFilter === "new" ? "bg-white text-[#0059b5] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Car size={16} />
          New Vehicles
          <span className="text-xs bg-[#0059b5]/10 text-[#0059b5] px-1.5 py-0.5 rounded-full">
            {requests.filter((r) => r.type === "NEW_REGISTRATION").length}
          </span>
        </button>
        <button
          onClick={() => setVehicleFilter("existing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            vehicleFilter === "existing" ? "bg-white text-[#0059b5] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClipboardList size={16} />
          Existing Vehicles
          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
            {requests.filter((r) => !r.type || r.type !== "NEW_REGISTRATION").length}
          </span>
        </button>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
          <FileText size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">
            {vehicleFilter === "new" ? "New Vehicle Registrations" : vehicleFilter === "existing" ? "Existing Vehicle Requests" : "All Requests"}
          </h3>
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

        {sortedFiltered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No requests yet</p>
            <p className="text-xs mt-1">Click "New Request" to start a certification request</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider"></th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("type")}>
                      <span className="inline-flex items-center gap-1">
                        Type {sortField === "type" && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("refNumber")}>
                      <span className="inline-flex items-center gap-1">
                        Reference {sortField === "refNumber" && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Details</th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("status")}>
                      <span className="inline-flex items-center gap-1">
                        Status {sortField === "status" && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                    <th className="pb-3 font-semibold text-gray-600 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("dateCreated")}>
                      <span className="inline-flex items-center gap-1">
                        Date {sortField === "dateCreated" && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((req) => {
                    const isNewReg = req.type === "NEW_REGISTRATION";
                    return (
                    <tr key={req.id || req.voucherReferenceNo || req.clearanceReferenceNo} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        {req.certificateNo ? (
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
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isNewReg ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {isNewReg ? "New" : "Existing"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-xs font-medium text-gray-900">
                          {req.refNumber || req.voucherReferenceNo || req.clearanceReferenceNo || req.id}
                        </span>
                        {isNewReg && req.transactionCode && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">TXN: {req.transactionCode}</div>
                        )}
                        {!isNewReg && req.voucherReferenceNo && req.clearanceReferenceNo && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{req.clearanceReferenceNo}</div>
                        )}
                      </td>
                      <td className="py-3 text-gray-700">
                        {isNewReg ? (
                          <span>{VEHICLE_TYPE_LABELS[req.vehicleType] || req.vehicleType || "-"}</span>
                        ) : (
                          <span>{req.plateNumber || "-"}</span>
                        )}
                      </td>
                      <td className="py-3">
                        {isNewReg ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            req.status === "CERTIFICATE_ISSUED" ? "bg-green-100 text-green-700" :
                            req.status === "VEHICLE_VERIFIED" ? "bg-sky-100 text-sky-700" :
                            req.status === "REGISTRATION_PAID" ? "bg-amber-100 text-amber-700" :
                            req.status === "DOCUMENTS_UPLOADED" ? "bg-teal-100 text-teal-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {req.status === "CERTIFICATE_ISSUED" && <><CheckCircle size={12} /> Issued</>}
                            {req.status === "VEHICLE_VERIFIED" && "Verified"}
                            {req.status === "REGISTRATION_PAID" && "Paid"}
                            {req.status === "DOCUMENTS_UPLOADED" && "Uploaded"}
                            {!["CERTIFICATE_ISSUED","VEHICLE_VERIFIED","REGISTRATION_PAID","DOCUMENTS_UPLOADED"].includes(req.status) && (req.status || "Draft")}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <StatusBadge done={voucherDone(req)} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-gray-500 text-xs">
                        {req.dateCreated ? new Date(req.dateCreated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0059b5] bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="mr-2">
                  Showing {safePage * pageSize + 1} to {Math.min((safePage + 1) * pageSize, sortedFiltered.length)} of {sortedFiltered.length}
                </span>
                <button
                  onClick={() => setPage(0)}
                  disabled={safePage === 0}
                  className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 0}
                  className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages - 1}
                  className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={safePage >= totalPages - 1}
                  className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
