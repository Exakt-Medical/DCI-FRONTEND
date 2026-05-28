// TransactionLedger.jsx
import { useState } from "react";
import { TransactionStats } from "./components/TransactionStats";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionTable } from "./components/TransactionTable";
import { MOCK_TRANSACTIONS } from "../../constants/mockLedger";

export const TransactionLedger = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [activeStatFilter, setActiveStatFilter] = useState("all");
  const itemsPerPage = 10;

  // Calculate stats
  const totalTransactions = MOCK_TRANSACTIONS.length;
  const totalVoucherRequests = MOCK_TRANSACTIONS.filter(
    (t) => t.type === "request",
  ).length;
  const totalVoucherAdjustments = MOCK_TRANSACTIONS.filter(
    (t) => t.type === "adjustment",
  ).length;

  // Handle stat card click
  const handleStatFilterChange = (filterType) => {
    setActiveStatFilter(filterType);
    setSelectedType(filterType); // Also update the dropdown filter
    setCurrentPage(1); // Reset to first page
  };

  // Filter transactions
  const filteredTransactions = MOCK_TRANSACTIONS.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.referenceNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.account.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.voucher.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      (selectedType === "transaction" && transaction.type === "transaction") ||
      (selectedType === "request" && transaction.type === "request") ||
      (selectedType === "adjustment" && transaction.type === "adjustment");

    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    console.log("Exporting...");
  };

  const handleClearFilters = () => {
    setSelectedType("all");
    setActiveStatFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Transaction Ledger
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all voucher transactions, requests, and adjustments
        </p>
      </div>

      {/* Stats Cards - Now clickable */}
      <TransactionStats
        totalTransactions={totalTransactions}
        totalVoucherRequests={totalVoucherRequests}
        totalVoucherAdjustments={totalVoucherAdjustments}
        activeFilter={activeStatFilter}
        onFilterChange={handleStatFilterChange}
      />

      {/* Search and Filters */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={(value) => {
          setSelectedType(value);
          setActiveStatFilter(value);
          setCurrentPage(1);
        }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onClearFilters={handleClearFilters}
      />

      {/* Transactions Table */}
      <TransactionTable
        transactions={paginatedTransactions}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTransactions.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
