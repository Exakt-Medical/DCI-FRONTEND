// hooks/useDashboard.js
import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboardService";

export const useDashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    lastWeekAuthenticated: 0,
    todayAuthenticated: 0,
    todayPurchasedVouchers: 0,
    availableVouchers: 0,
    agentsCount: 0,
    subagentsCount: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDashboardData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardService.getDashboardData(page, 8);

      console.log("Dashboard data received:", data); // Debug log

      setStats(
        data.stats || {
          totalAgents: 0,
          totalTransactions: 0,
          lastWeekAuthenticated: 0,
          todayAuthenticated: 0,
          todayPurchasedVouchers: 0,
          availableVouchers: 0,
          agentsCount: 0,
          subagentsCount: 0,
        },
      );
      setTransactions(data.recentTransactions || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage + 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter transactions based on search term (client-side filtering)
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      (transaction.agent &&
        transaction.agent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.dciAuthCode &&
        transaction.dciAuthCode
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (transaction.plateNo &&
        transaction.plateNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.mvFile &&
        transaction.mvFile.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.chassisNo &&
        transaction.chassisNo
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (transaction.engineNo &&
        transaction.engineNo.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // Pagination for filtered results
  const itemsPerPage = 8;
  const totalFilteredPages = Math.ceil(
    filteredTransactions.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const refetch = () => {
    fetchDashboardData(currentPage);
  };

  useEffect(() => {
    fetchDashboardData(1);
  }, [fetchDashboardData]);

  return {
    stats,
    transactions: paginatedTransactions,
    allTransactions: filteredTransactions,
    loading,
    error,
    currentPage,
    totalPages: totalFilteredPages,
    totalItems: filteredTransactions.length,
    searchTerm,
    handlePageChange,
    handleSearchChange,
    refetch,
  };
};
