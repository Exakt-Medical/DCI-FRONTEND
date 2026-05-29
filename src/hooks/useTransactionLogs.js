// hooks/useTransactionLogs.js
import { useState, useEffect, useCallback, useRef } from "react";
import { transactionLogsApi } from "../services/transactionLogsApi";

export const useTransactionLogs = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // ✅ Only for first load
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // ✅ Debounce search
  const [totalStats, setTotalStats] = useState({
    authenticated: 0,
    verified: 0,
    failed: 0,
  });

  const searchTimeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  // ✅ Debounce search to avoid too many API calls
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // ✅ Fetch total stats (only once on mount)
  const fetchTotalStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const [authRes, verifiedRes, failedRes] = await Promise.all([
        transactionLogsApi.getTransactionLogs({
          status: "Authenticated",
          page: 1,
          limit: 1,
        }),
        transactionLogsApi.getTransactionLogs({
          status: "Verified",
          page: 1,
          limit: 1,
        }),
        transactionLogsApi.getTransactionLogs({
          status: "Failed",
          page: 1,
          limit: 1,
        }),
      ]);

      setTotalStats({
        authenticated: authRes.total || 0,
        verified: verifiedRes.total || 0,
        failed: failedRes.total || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // ✅ Fetch transactions with better loading states
  const fetchTransactions = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view transactions");
      setInitialLoading(false);
      setLoading(false);
      return;
    }

    // Only show full page loader on initial load
    if (isFirstRender.current) {
      setInitialLoading(true);
    } else {
      setLoading(true); // This shows the small spinner
    }

    setError(null);

    try {
      const data = await transactionLogsApi.getTransactionLogs({
        status: selectedStatus === "all" ? undefined : selectedStatus,
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: 10,
      });

      setTransactions(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.total || 0);
      isFirstRender.current = false;
    } catch (err) {
      setError(err.message);
      console.error("Error fetching transactions:", err);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  }, [selectedStatus, debouncedSearchTerm, currentPage]);

  // ✅ Initial load
  useEffect(() => {
    fetchTotalStats();
    fetchTransactions();
  }, []); // Only run once on mount

  // ✅ Refetch when filters change (but not on initial render)
  useEffect(() => {
    if (!isFirstRender.current) {
      fetchTransactions();
    }
  }, [selectedStatus, debouncedSearchTerm, currentPage]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (search) => {
    setSearchTerm(search);
    // Don't reset page here - it's done in the debounce effect
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setCurrentPage(1);
  };

  const stats = {
    authenticated: totalStats.authenticated,
    verified: totalStats.verified,
    failed: totalStats.failed,
  };

  return {
    transactions,
    loading, // For small spinner (page changes, filter changes)
    initialLoading, // For full page loader (first load only)
    error,
    totalPages,
    totalElements,
    currentPage,
    selectedStatus,
    searchTerm,
    stats,
    handleStatusChange,
    handleSearchChange,
    handlePageChange,
    handleClearFilters,
    refetch: fetchTransactions,
  };
};
