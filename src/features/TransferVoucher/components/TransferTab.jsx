import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import {
  Users,
  Ticket,
  Search,
  Send,
  Building2,
  AlertCircle,
  Calendar,
  Hash,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { VOUCHER_VALUE, formatCurrency } from "../TransferVoucherPage";

// ✅ Individual voucher card
const VoucherCard = ({ voucher, isSelected, onToggle }) => {
  const isExpired =
    voucher.expiresAt && new Date(voucher.expiresAt) < new Date();
  const expiresAt = voucher.expiresAt
    ? new Date(voucher.expiresAt + "+08:00").toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      })
    : "No expiry";

  return (
    <div
      onClick={() => !isExpired && onToggle(voucher.id)}
      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
        isExpired
          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
          : isSelected
            ? "border-primary-500 bg-primary-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm"
      }`}
    >
      {/* Selected / unselected icon */}
      <div className="absolute top-2 right-2">
        {isExpired ? (
          <span className="text-[10px] font-semibold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
            Expired
          </span>
        ) : isSelected ? (
          <CheckSquare size={15} className="text-primary-500" />
        ) : (
          <Square size={15} className="text-gray-300" />
        )}
      </div>

      {/* Voucher code */}
      <div className="flex items-center gap-1.5 mb-2 pr-5">
        <Hash size={11} className="text-primary-400 flex-shrink-0" />
        <p className="text-xs font-mono font-bold text-gray-900 tracking-wide truncate">
          {voucher.voucherCode}
        </p>
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar size={10} className="text-gray-400 flex-shrink-0" />
        <p
          className={`text-[10px] ${isExpired ? "text-red-400" : "text-gray-400"}`}
        >
          {expiresAt}
        </p>
      </div>

      {/* Value */}
      <p className="text-xs font-semibold text-primary-600">
        {formatCurrency(VOUCHER_VALUE)}
      </p>
    </div>
  );
};

const TransferTab = ({
  agents,
  isLoadingAgents,
  agentsError,
  selectedAgent,
  setSelectedAgent,
  searchTerm,
  setSearchTerm,
  isProcessing,
  handleTransfer,
  remainingBalance,
  companyBalance,
  // Voucher props
  availableVouchers,
  isLoadingVouchers,
  selectedVoucherIds,
  onToggleVoucher,
  // Pagination props
  voucherSearch,
  setVoucherSearch,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Select Agent ──────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Users size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">Select Agent</h3>
          {!isLoadingAgents && (
            <span className="ml-auto text-xs text-gray-400">
              {agents.length} agent{agents.length !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or branch..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {isLoadingAgents && (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Spinner size="sm" />
              <span className="text-sm">Loading agents...</span>
            </div>
          )}
          {!isLoadingAgents && agentsError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              <AlertCircle size={16} /> {agentsError}
            </div>
          )}
          {!isLoadingAgents &&
            !agentsError &&
            agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {agent.branch}
                      {agent.branchCompanyName &&
                        agent.branchCompanyName !== "—" && (
                          <span className="text-gray-300">
                            {" "}
                            · {agent.branchCompanyName}
                          </span>
                        )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-700">
                      {agent.assignedVouchers ?? 0} vouchers
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {agent.userId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          {!isLoadingAgents && !agentsError && agents.length === 0 && (
            <p className="text-center text-gray-500 py-4">No agents found</p>
          )}
        </div>
      </Card>

      {/* ── Right: Voucher Cards ─────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Ticket size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">My Vouchers</h3>
          <span className="ml-auto text-xs text-gray-400">
            {remainingBalance} available
          </span>
        </div>

        {/* Balance summary */}
        <div className="mb-4 p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-primary-100" />
              <div>
                <p className="text-primary-100 text-xs">Total Balance</p>
                <p className="text-white text-lg font-bold">
                  {companyBalance} vouchers
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-xs">Available Value</p>
              <p className="text-white text-base font-bold">
                {formatCurrency(remainingBalance * VOUCHER_VALUE)}
              </p>
            </div>
          </div>
        </div>

        {/* Search voucher code */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={voucherSearch}
            onChange={(e) => setVoucherSearch(e.target.value)}
            placeholder="Search voucher code..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-8 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {voucherSearch && (
            <button
              onClick={() => setVoucherSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Selected vouchers summary */}
        {selectedVoucherIds.length > 0 && (
          <div className="mb-3 flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-primary-700">
              {selectedVoucherIds.length} selected
              <span className="text-primary-500 ml-1 font-normal">
                · {formatCurrency(selectedVoucherIds.length * VOUCHER_VALUE)}
              </span>
            </p>
            <button
              onClick={() => onToggleVoucher(null)}
              className="text-xs text-primary-400 hover:text-primary-600 flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}

        {/* Voucher cards grid */}
        <div className="min-h-48">
          {isLoadingVouchers ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Spinner size="sm" />
              <span className="text-sm">Loading vouchers...</span>
            </div>
          ) : availableVouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Ticket size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No available vouchers</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableVouchers.map((voucher) => (
                <VoucherCard
                  key={voucher.id}
                  voucher={voucher}
                  isSelected={selectedVoucherIds.includes(voucher.id)}
                  onToggle={onToggleVoucher}
                />
              ))}
            </div>
          )}
        </div>

        {/* ✅ Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {currentPage + 1} of {totalPages}
              <span className="ml-1">({totalElements} total)</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page =
                  Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                      page === currentPage
                        ? "bg-primary-500 border-primary-500 text-white font-medium"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Transfer button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            onClick={handleTransfer}
            disabled={
              !selectedAgent || isProcessing || selectedVoucherIds.length === 0
            }
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Transfer{" "}
                {selectedVoucherIds.length > 0
                  ? selectedVoucherIds.length
                  : ""}{" "}
                Voucher{selectedVoucherIds.length !== 1 ? "s" : ""} to Agent
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TransferTab;
