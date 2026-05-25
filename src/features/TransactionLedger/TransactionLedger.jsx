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
  const itemsPerPage = 10;

  // Calculate stats
  const totalTransactions = MOCK_TRANSACTIONS.length;
  const totalVoucherRequests = MOCK_TRANSACTIONS.filter((t) =>
    t.referenceNumber.startsWith("VR"),
  ).length;
  const totalVoucherAdjustments = MOCK_TRANSACTIONS.filter((t) =>
    t.referenceNumber.startsWith("VA"),
  ).length;

  // Filter transactions
  const filteredTransactions = MOCK_TRANSACTIONS.filter((transaction) => {
    const matchesSearch =
      searchTerm === "" ||
      transaction.referenceNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.voucher.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      (selectedType === "transaction" &&
        !transaction.referenceNumber.startsWith("VR") &&
        !transaction.referenceNumber.startsWith("VA")) ||
      (selectedType === "request" &&
        transaction.referenceNumber.startsWith("VR")) ||
      (selectedType === "adjustment" &&
        transaction.referenceNumber.startsWith("VA"));

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
    // Export logic here
    console.log("Exporting...");
  };

  const handleClearFilters = () => {
    setSelectedType("all");
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

      {/* Stats Cards */}
      <TransactionStats
        totalTransactions={totalTransactions}
        totalVoucherRequests={totalVoucherRequests}
        totalVoucherAdjustments={totalVoucherAdjustments}
      />

      {/* Search and Filters */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
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
