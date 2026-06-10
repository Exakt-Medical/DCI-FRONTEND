import { useState, useMemo } from "react";

export const useTicketFilters = (tickets, itemsPerPage = 10) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate stats — compare lowercase since mapTicket lowercases status
  const stats = useMemo(
    () => ({
      total: tickets.length,
      pending: tickets.filter((t) => t.status?.toLowerCase() === "pending")
        .length,
      processing: tickets.filter(
        (t) => t.status?.toLowerCase() === "processing",
      ).length,
      resolved: tickets.filter((t) => t.status?.toLowerCase() === "resolved")
        .length,
      declined: tickets.filter((t) => t.status?.toLowerCase() === "declined")
        .length,
      cancelled: tickets.filter((t) => t.status?.toLowerCase() === "cancelled")
        .length,
      dataMismatch: tickets.filter((t) => t.type === "Data Mismatch").length,
      vehicleNotFound: tickets.filter((t) => t.type === "Vehicle Not Found")
        .length,
    }),
    [tickets],
  );

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // requestedBy is a plain string from the API, not an object
      const requestedBy =
        typeof ticket.requestedBy === "string"
          ? ticket.requestedBy
          : (ticket.requestedBy?.name ?? "");

      const matchesSearch =
        searchTerm === "" ||
        ticket.referenceNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        requestedBy.toLowerCase().includes(searchTerm.toLowerCase());

      // Compare lowercase so "PENDING", "pending", "Pending" all match
      const matchesStatus =
        selectedStatus === "all" ||
        ticket.status?.toLowerCase() === selectedStatus.toLowerCase();

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
    setSearchTerm,
    setSelectedStatus,
    setSelectedType,
    setActiveTab,
    setCurrentPage,
    clearFilters,
    resetPage,
  };
};
