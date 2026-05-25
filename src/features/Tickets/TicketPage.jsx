import { useState } from "react";
import { Card } from "../../components/Card";
import { StatCard } from "./components/StatCard";
import { TicketTabs } from "./components/TicketTabs";
import { TicketSearchBar } from "./components/TicketSearchBar";
import { TicketTable } from "./components/TicketTable";
import { TicketPagination } from "./components/TicketPagination";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { useTicketFilters } from "./hooks/useTicketFilters";
import {
  MOCK_TICKETS,
  statusOptions,
  typeOptions,
} from "../../constants/ticketMockData";
import {
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const TicketPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  } = useTicketFilters(MOCK_TICKETS);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    console.log("Exporting tickets...");
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

  const tabCounts = {
    all: stats.total,
    dataMismatch: stats.dataMismatch,
    vehicleNotFound: stats.vehicleNotFound,
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

      {/* Tab Navigation */}
      <TicketTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Search and Filters */}
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

      {/* Tickets Table */}
      <Card className="overflow-hidden">
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
      </Card>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
