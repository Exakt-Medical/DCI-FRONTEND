// hooks/useTransactionLogs.js
import { useState, useEffect, useCallback } from "react";
import { transactionLogsApi } from "../services/transactionLogsApi";

export const useTransactionLogs = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransactions = useCallback(async () => {
    // Check if token exists
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view transactions");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await transactionLogsApi.getTransactionLogs({
        status: selectedStatus,
        search: searchTerm,
        page: currentPage,
        limit: 10,
      });

      setTransactions(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.total || 0);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchTerm, currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (search) => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Calculate stats
  const stats = {
    authenticated: transactions.filter((t) => t.status === "Authenticated")
      .length,
    verified: transactions.filter((t) => t.status === "Verified").length,
    failed: transactions.filter((t) => t.status === "Failed").length,
  };

  return {
    // State
    transactions,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    selectedStatus,
    searchTerm,
    stats,

    // Actions
    handleStatusChange,
    handleSearchChange,
    handlePageChange,
    handleClearFilters,
    refetch: fetchTransactions,
  };
};
