import { useState } from "react";
import { Card } from "../../components/Card";
import { StatCard } from "./components/StatCard";
import { TicketTabs } from "./components/TicketTabs";
import { TicketSearchBar } from "./components/TicketSearchBar";
import { TicketTable } from "./components/TicketTable";
import { TicketPagination } from "./components/TicketPagination";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { CreateTicketModal } from "./CreateTicketModal";
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
  Plus,
} from "lucide-react";

export const TicketPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeStat, setActiveStat] = useState("total");
  const [tickets, setTickets] = useState(MOCK_TICKETS);

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

  const handleRefresh = () => window.location.reload();

  const handleExport = () => console.log("Exporting tickets...");

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
    await new Promise((r) => setTimeout(r, 1000));

    const newTicket = {
      id: `TKT-${String(tickets.length + 1).padStart(4, "0")}`,
      customer: "New Customer",
      type: formData.type,
      subject: formData.subject,
      description: formData.description,
      status: "pending",
      priority: formData.priority,
      date: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      vehicleInfo: {
        plateNo: "N/A",
        make: "N/A",
        model: "N/A",
        year: "N/A",
      },
    };

    setTickets([newTicket, ...tickets]);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
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

      {/* STATS */}
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

      {/* SEARCH */}
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

      {/* TABLE */}
      <Card className="overflow-hidden">
        <TicketTable
          tickets={filteredByStat}
          onViewDetails={handleViewDetails}
          onAddNote={handleAddNote}
        />

        <TicketPagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          totalItems={filteredByStat.length}
          onPageChange={setCurrentPage}
        />
      </Card>

      {/* MODALS */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
};
