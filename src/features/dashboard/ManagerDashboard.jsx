// features/dashboard/ManagerDashboard.jsx
import { useState } from "react";
import { Card } from "../../components/Card";
import {
  Calendar,
  TrendingUp,
  ShoppingBag,
  Ticket,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsGrid } from "./components/StatsGrid";
import { TransactionSearch } from "./components/TransactionSearch";
import { TransactionTable } from "./components/TransactionTable";
import { Pagination } from "./components/Pagination";
import { useDashboard } from "../../hooks/useDashboard";

export const ManagerDashboard = () => {
  const {
    stats,
    transactions,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    handlePageChange,
    handleSearchChange,
    refetch,
  } = useDashboard();

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
          <p className="text-red-600 font-medium">Error loading dashboard</p>
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

  // Prepare stats with ALL the data from backend
  const dashboardStats = {
    totalAgents: stats.totalAgents || 0,
    totalTransactions: stats.totalTransactions || 0,
    lastWeekAuthenticated: stats.lastWeekAuthenticated || 0,
    todayAuthenticated: stats.todayAuthenticated || 0,
    todayPurchasedVouchers: stats.todayPurchasedVouchers || 0,
    availableVouchers: stats.availableVouchers || 0,
    agentsCount: stats.agentsCount || 0,
    subagentsCount: stats.subagentsCount || 0,
    // Icons for the cards
    lastWeekAuthenticatedIcon: Calendar,
    todayAuthenticatedIcon: TrendingUp,
    todayPurchasedVouchersIcon: ShoppingBag,
    availableVouchersIcon: Ticket,
    agentsCountIcon: UserPlus,
    subagentsCountIcon: UserMinus,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardHeader />
      <StatsGrid stats={dashboardStats} />

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Recent Transactions
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Latest authentication activities from your team
              </p>
            </div>
            <TransactionSearch
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </div>
        </div>

        {loading && transactions.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        )}

        <TransactionTable transactions={transactions} />

        {!loading && transactions.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500">No transactions found.</p>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          startIndex={(currentPage - 1) * 8}
          itemsPerPage={8}
          totalItems={totalItems}
        />
      </Card>
    </div>
  );
};
