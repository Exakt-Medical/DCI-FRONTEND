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

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRefresh = () => fetchTickets();

  const handleExport = () => {
    console.log("Exporting tickets…");
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const handleAddNote = (ticket) => {
    console.log("Add note:", ticket);
  };

  const handleCreateTicket = async (formData) => {
    const created = await ticketService.create(formData);
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
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors"
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
        <StatCard title="Total" value={stats.total} icon={Ticket} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard
          title="Processing"
          value={stats.processing}
          icon={RefreshCw}
        />
        <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} />
        <StatCard title="Declined" value={stats.declined} icon={XCircle} />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={AlertCircle}
        />
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
