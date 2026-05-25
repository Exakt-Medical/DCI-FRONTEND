// features/tickets/TicketPage.jsx
import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Dropdown } from "../../components/Dropdown";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  MessageSquare,
} from "lucide-react";

// Mock data for tickets
const MOCK_TICKETS = [
  {
    id: 1,
    referenceNumber: "TKT-2024-0001",
    status: "Pending",
    type: "Data Mismatch",
    requestedBy: {
      name: "Juan M. Dela Cruz",
      company: "Mapfre Insurance",
    },
    processedBy: null,
    dateUpdated: "2024-12-10 09:30:25",
    dateRequested: "2024-12-10 09:30:25",
  },
  {
    id: 2,
    referenceNumber: "TKT-2024-0002",
    status: "Processing",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Maria Santos",
      company: "Prudential Guarantee",
    },
    processedBy: "John Admin",
    dateUpdated: "2024-12-10 10:15:42",
    dateRequested: "2024-12-10 10:15:42",
  },
  {
    id: 3,
    referenceNumber: "TKT-2024-0003",
    status: "Resolved",
    type: "Data Mismatch",
    requestedBy: {
      name: "Ramon Villanueva",
      company: "Malayan Insurance",
    },
    processedBy: "Sarah Manager",
    dateUpdated: "2024-12-09 16:30:18",
    dateRequested: "2024-12-09 14:20:10",
  },
  {
    id: 4,
    referenceNumber: "TKT-2024-0004",
    status: "Declined",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Pedro Fernandez",
      company: "Fortun General Insurance",
    },
    processedBy: "John Admin",
    dateUpdated: "2024-12-09 11:45:33",
    dateRequested: "2024-12-09 11:45:33",
  },
  {
    id: 5,
    referenceNumber: "TKT-2024-0005",
    status: "Cancelled",
    type: "Data Mismatch",
    requestedBy: {
      name: "Ana Reyes",
      company: "BPI MS Insurance",
    },
    processedBy: "Ana Reyes",
    dateUpdated: "2024-12-08 16:30:18",
    dateRequested: "2024-12-08 16:30:18",
  },
  {
    id: 6,
    referenceNumber: "TKT-2024-0006",
    status: "Pending",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Carlos Lopez",
      company: "Standard Insurance",
    },
    processedBy: null,
    dateUpdated: "2024-12-08 13:22:05",
    dateRequested: "2024-12-08 13:22:05",
  },
  {
    id: 7,
    referenceNumber: "TKT-2024-0007",
    status: "Processing",
    type: "Data Mismatch",
    requestedBy: {
      name: "Isabella Cruz",
      company: "Pioneer Insurance",
    },
    processedBy: "Sarah Manager",
    dateUpdated: "2024-12-07 09:55:40",
    dateRequested: "2024-12-07 09:55:40",
  },
  {
    id: 8,
    referenceNumber: "TKT-2024-0008",
    status: "Resolved",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Mark Reyes",
      company: "AXA Philippines",
    },
    processedBy: "John Admin",
    dateUpdated: "2024-12-06 14:20:10",
    dateRequested: "2024-12-06 14:20:10",
  },
];

// Status options for dropdown
const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Resolved", label: "Resolved" },
  { value: "Declined", label: "Declined" },
  { value: "Cancelled", label: "Cancelled" },
];

// Type options for dropdown
const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "Data Mismatch", label: "Data Mismatch" },
  { value: "Vehicle Not Found", label: "Vehicle Not Found" },
];

export const TicketPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const itemsPerPage = 10;

  // Calculate stats
  const totalTickets = MOCK_TICKETS.length;
  const totalPending = MOCK_TICKETS.filter(
    (t) => t.status === "Pending",
  ).length;
  const totalProcessing = MOCK_TICKETS.filter(
    (t) => t.status === "Processing",
  ).length;
  const totalResolved = MOCK_TICKETS.filter(
    (t) => t.status === "Resolved",
  ).length;
  const totalDeclined = MOCK_TICKETS.filter(
    (t) => t.status === "Declined",
  ).length;
  const totalCancelled = MOCK_TICKETS.filter(
    (t) => t.status === "Cancelled",
  ).length;

  // Filter tickets based on search, filters, and tab
  const filteredTickets = MOCK_TICKETS.filter((ticket) => {
    const matchesSearch =
      searchTerm === "" ||
      ticket.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.requestedBy.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.requestedBy.company
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || ticket.status === selectedStatus;
    const matchesType = selectedType === "all" || ticket.type === selectedType;
    const matchesTab = activeTab === "all" || ticket.type === activeTab;

    return matchesSearch && matchesStatus && matchesType && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-700",
      Processing: "bg-blue-100 text-blue-700",
      Resolved: "bg-green-100 text-green-700",
      Declined: "bg-red-100 text-red-700",
      Cancelled: "bg-gray-100 text-gray-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={12} />;
      case "Processing":
        return <RefreshCw size={12} />;
      case "Resolved":
        return <CheckCircle size={12} />;
      case "Declined":
        return <XCircle size={12} />;
      case "Cancelled":
        return <AlertCircle size={12} />;
      default:
        return <Ticket size={12} />;
    }
  };

  const getTypeBadge = (type) => {
    if (type === "Data Mismatch") {
      return "bg-purple-100 text-purple-700";
    }
    return "bg-orange-100 text-orange-700";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg p-5 hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-black text-gray-900 mt-2 tracking-tight">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
          <Icon size={14} className="text-primary-600" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-primary-500 rounded-full group-hover:w-12 transition-all duration-300" />
          <div className="h-1 w-4 bg-primary-300 rounded-full" />
          <div className="h-1 w-2 bg-primary-200 rounded-full" />
        </div>
      </div>
    </div>
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    console.log("Exporting tickets...");
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    setSelectedType("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and track customer support tickets and inquiries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total" value={totalTickets} icon={Ticket} />
        <StatCard title="Pending" value={totalPending} icon={Clock} />
        <StatCard title="Processing" value={totalProcessing} icon={RefreshCw} />
        <StatCard title="Resolved" value={totalResolved} icon={CheckCircle} />
        <StatCard title="Declined" value={totalDeclined} icon={XCircle} />
        <StatCard title="Cancelled" value={totalCancelled} icon={AlertCircle} />
      </div>

      {/* Tab Navigation - Underline Style with Pill Badges (Like Vouchers) */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "all"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {totalTickets}
            </span>
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("Data Mismatch")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "Data Mismatch"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mismatched
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {MOCK_TICKETS.filter((t) => t.type === "Data Mismatch").length}
            </span>
            {activeTab === "Data Mismatch" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("Vehicle Not Found")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "Vehicle Not Found"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Vehicle Not Found
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {
                MOCK_TICKETS.filter((t) => t.type === "Vehicle Not Found")
                  .length
              }
            </span>
            {activeTab === "Vehicle Not Found" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by reference number, name, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} /> Filters
            {(selectedStatus !== "all" || selectedType !== "all") && (
              <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600"
          >
            <Download size={16} /> Export
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Status:</span>
              <Dropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Select status"
                buttonClassName="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-w-[130px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Type:</span>
              <Dropdown
                options={typeOptions}
                value={selectedType}
                onChange={setSelectedType}
                placeholder="Select type"
                buttonClassName="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-w-[130px]"
              />
            </div>
            {(selectedStatus !== "all" || selectedType !== "all") && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Tickets Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reference Number
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Processed By
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Updated
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Requested
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {ticket.referenceNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        ticket.status,
                      )}`}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.requestedBy.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.requestedBy.company}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(
                        ticket.type,
                      )}`}
                    >
                      {ticket.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {ticket.processedBy || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(ticket.dateUpdated)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(ticket.dateRequested)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="p-1 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                      title="Add Note"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredTickets.length)} of{" "}
              {filteredTickets.length} tickets
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
