import { useState, useMemo } from "react";

export const useTicketFilters = (tickets, itemsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => t.status === "Pending").length,
      processing: tickets.filter((t) => t.status === "Processing").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      declined: tickets.filter((t) => t.status === "Declined").length,
      cancelled: tickets.filter((t) => t.status === "Cancelled").length,
      dataMismatch: tickets.filter((t) => t.type === "Data Mismatch").length,
      vehicleNotFound: tickets.filter((t) => t.type === "Vehicle Not Found")
        .length,
    }),
    [tickets],
  );

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        searchTerm === "" ||
        ticket.referenceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        ticket.requestedBy.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        ticket.requestedBy.company
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || ticket.status === selectedStatus;
      const matchesType =
        selectedType === "all" || ticket.type === selectedType;
      const matchesTab = activeTab === "all" || ticket.type === activeTab;

      return matchesSearch && matchesStatus && matchesType && matchesTab;
    });
  }, [tickets, searchTerm, selectedStatus, selectedType, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const resetPage = () => setCurrentPage(1);

  const clearFilters = () => {
    setSelectedStatus("all");
    setSelectedType("all");
    setSearchTerm("");
    resetPage();
  };

  return {
    // State
    searchTerm,
    selectedStatus,
    selectedType,
    activeTab,
    currentPage,
    stats,
    filteredTickets,
    paginatedTickets,
    totalPages,
    startIndex,
    itemsPerPage,

    // Setters
    setSearchTerm,
    setSelectedStatus,
    setSelectedType,
    setActiveTab,
    setCurrentPage,
    clearFilters,
    resetPage,
  };
};
