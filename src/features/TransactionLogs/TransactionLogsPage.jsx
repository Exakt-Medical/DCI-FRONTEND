// features/transactions/TransactionLogsPage.jsx
import { useState } from "react";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { MOCK_TRANSACTIONS } from "../../constants/mockData";
import { TransactionStatCard } from "./components/TransactionStatCard";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionTable } from "./components/TransactionTable";

export const TransactionLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate stats
  const totalAuthenticated = MOCK_TRANSACTIONS.filter(
    (t) => t.status === "Authenticated",
  ).length;
  const totalVerified = MOCK_TRANSACTIONS.filter(
    (t) => t.status === "Verified",
  ).length;
  const totalFailed = MOCK_TRANSACTIONS.filter(
    (t) => t.status === "Failed",
  ).length;

  // Handle stat card click
  const handleStatClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Filter transactions
  const filteredTransactions = MOCK_TRANSACTIONS.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.account?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Transaction Logs
        </h1>
        <p className="text-sm text-gray-500">
          Monitor and track all system activities and verifications
        </p>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <TransactionStatCard
          title="Authenticated"
          value={totalAuthenticated}
          icon={CheckCircle}
          color="green"
          isActive={selectedStatus === "Authenticated"}
          onClick={() => handleStatClick("Authenticated")}
        />
        <TransactionStatCard
          title="Verified"
          value={totalVerified}
          icon={RefreshCw}
          color="green"
          isActive={selectedStatus === "Verified"}
          onClick={() => handleStatClick("Verified")}
        />
        <TransactionStatCard
          title="Failed"
          value={totalFailed}
          icon={XCircle}
          color="red"
          isActive={selectedStatus === "Failed"}
          onClick={() => handleStatClick("Failed")}
        />
      </div>

      {/* Filters */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={paginatedTransactions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
