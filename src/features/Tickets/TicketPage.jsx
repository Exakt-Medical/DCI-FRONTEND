import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/Card";
import { StatCard } from "./components/StatCard";
import { TicketTabs } from "./components/TicketTabs";
import { TicketSearchBar } from "./components/TicketSearchBar";
import { TicketTable } from "./components/TicketTable";
import { TicketPagination } from "./components/TicketPagination";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { CreateTicketModal } from "./CreateTicketModal";
import { useTicketFilters } from "./hooks/useTicketFilters";
import { ticketService } from "../../services/ticketService"; // ← service layer
import { statusOptions, typeOptions } from "../../constants/ticketMockData";
import {
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react";

export const TicketPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeStat, setActiveStat] = useState("total");

  // ── Data & loading state ──────────────────────────────────────────────────
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch all tickets ─────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getAll();
      setTickets(data);
    } catch (err) {
      setError(err.message ?? "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Filters / pagination (unchanged hook) ────────────────────────────────
  const {
    searchTerm,
    selectedStatus,
    selectedType,
    activeTab,
    currentPage,
    stats,
    paginatedTickets,
    filteredTickets,
    totalPages,
    startIndex,
    itemsPerPage,
    setSearchTerm,
    setSelectedStatus,
    setSelectedType,
    setActiveTab,
    setCurrentPage,
    clearFilters,
  } = useTicketFilters(tickets);

  // 🔥 NORMALIZER (fixes ALL case issues)
  const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

  // 🔥 STAT FILTER (FIXED)
  const filteredByStat = filteredTickets.filter((ticket) => {
    const status = normalize(ticket.status);

    if (activeStat === "total") return true;
    if (activeStat === "pending") return status === "pending";
    if (activeStat === "processing") return status === "processing";
    if (activeStat === "resolved") return status === "resolved";
    if (activeStat === "declined") return status === "declined";
    if (activeStat === "cancelled") return status === "cancelled";

    return true;
  });

  const statConfig = [
    { key: "total", title: "Total", value: stats.total, icon: Ticket },
    { key: "pending", title: "Pending", value: stats.pending, icon: Clock },
    {
      key: "processing",
      title: "Processing",
      value: stats.processing,
      icon: RefreshCw,
    },
    {
      key: "resolved",
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
    },
    {
      key: "declined",
      title: "Declined",
      value: stats.declined,
      icon: XCircle,
    },
    {
      key: "cancelled",
      title: "Cancelled",
      value: stats.cancelled,
      icon: AlertCircle,
    },
  ];

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRefresh = () => fetchTickets();

  const handleExport = () => {
    console.log("Exporting tickets…");
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleTicketUpdated = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
    );
    setSelectedTicket(updatedTicket);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const handleAddNote = (ticket) => {
    console.log("Add note:", ticket);
  };

  const handleCreateTicket = async (formData) => {
    // Map the modal's nested shape → flat TicketRequest DTO
    const typeLabel =
      formData.vehicleSubType === "dataMismatch"
        ? "Data Mismatch"
        : formData.vehicleSubType === "vehicleNotFound"
          ? "Vehicle Not Found"
          : formData.concernType === "other"
            ? "Other"
            : formData.concernType
              ? formData.concernType.charAt(0).toUpperCase() +
                formData.concernType.slice(1)
              : "General";

    // Generate reference number: REF-YYYYMMDD-XXXX
    const pad = (n) => String(n).padStart(4, "0");
    const now = new Date();
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const randPart = pad(Math.floor(Math.random() * 9000) + 1000);
    const referenceNumber = `REF-${datePart}-${randPart}`;

    const payload = {
      referenceNumber,
      requestedBy: formData.requestedBy?.name ?? "",
      type: typeLabel,
      status: "PENDING",
      address: formData.description ?? "",
      name: formData.requestedBy?.name ?? "",
      processedBy: localStorage.getItem("username") ?? null,
      dateRequested: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
      escalated: "NO",
      roleBased: localStorage.getItem("role")?.toUpperCase() ?? null,
      // Vehicle fields
      plateNo: formData.vehicleInfo?.plateNo ?? null,
      mvFileNo: formData.vehicleInfo?.mvFileNo ?? null,
      make: formData.vehicleInfo?.make ?? null,
      series: formData.vehicleInfo?.model ?? null,
      engineNo: formData.vehicleInfo?.engineNo ?? null,
      chassisNo: formData.vehicleInfo?.chassisNo ?? null,
    };
    const created = await ticketService.create(payload);
    setTickets((prev) => [created, ...prev]);
  };

  // ── Tab counts ────────────────────────────────────────────────────────────
  const tabCounts = {
    all: stats.total,
    dataMismatch: stats.dataMismatch,
    vehicleNotFound: stats.vehicleNotFound,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Support Tickets
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track customer support tickets and inquiries
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl"
          >
            <Plus size={16} />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={fetchTickets}
            className="ml-3 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statConfig.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            isActive={activeStat === stat.key}
            onClick={() => {
              setActiveStat(stat.key);
              setCurrentPage(1);
            }}
          />
        ))}
      </div>

      {/* Tabs */}
      <TicketTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Search & Filters */}
      <Card className="p-4">
        <TicketSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onClearFilters={clearFilters}
          statusOptions={statusOptions}
          typeOptions={typeOptions}
        />
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading tickets…
          </div>
        ) : (
          <>
            <TicketTable
              tickets={paginatedTickets}
              onViewDetails={handleViewDetails}
              onAddNote={handleAddNote}
            />
            <TicketPagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTickets.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTicketUpdated={handleTicketUpdated}
      />

      {/* Create Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
};
