// features/transactions/TransactionLogsPage.jsx
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { TransactionStatCard } from "./components/TransactionStatCard";
import { TransactionFilters } from "./components/TransactionFilters";
import { TransactionTable } from "./components/TransactionTable";
import { useTransactionLogs } from "../../hooks/useTransactionLogs";

export const TransactionLogsPage = () => {
  const {
    transactions,
    loading,
    error,
    totalPages,
    currentPage,
    selectedStatus,
    searchTerm,
    stats,
    handleStatusChange,
    handleSearchChange,
    handlePageChange,
    handleClearFilters,
    refetch,
  } = useTransactionLogs();

  if (loading && transactions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Error loading transactions</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
          value={stats.authenticated}
          icon={CheckCircle}
          color="green"
          isActive={selectedStatus === "Authenticated"}
          onClick={() => handleStatusChange("Authenticated")}
        />
        <TransactionStatCard
          title="Verified"
          value={stats.verified}
          icon={RefreshCw}
          color="green"
          isActive={selectedStatus === "Verified"}
          onClick={() => handleStatusChange("Verified")}
        />
        <TransactionStatCard
          title="Failed"
          value={stats.failed}
          icon={XCircle}
          color="red"
          isActive={selectedStatus === "Failed"}
          onClick={() => handleStatusChange("Failed")}
        />
      </div>

      {/* Filters */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
      />

      {/* Loading indicator for subsequent loads */}
      {loading && transactions.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </div>
  );
};
