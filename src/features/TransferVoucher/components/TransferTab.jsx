import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import {
  Users,
  Ticket,
  Send,
  Search,
  Building2,
  AlertCircle,
  Minus,
  Plus,
} from "lucide-react";
import { VOUCHER_VALUE, formatCurrency } from "../TransferVoucherPage";

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
  // Quantity props (replaces voucher card selection)
  quantity,
  setQuantity,
}) => {
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrement = () =>
    setQuantity((q) => Math.min(remainingBalance, q + 1));

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (val > remainingBalance) {
      setQuantity(remainingBalance);
    } else {
      setQuantity(val);
    }
  };

  const totalValue = quantity * VOUCHER_VALUE;

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
                  Current Voucher: {agent.assignedVouchers ?? 0}{" "}
                  {(agent.assignedVouchers ?? 0) === 1 ? "voucher" : "vouchers"}
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

      {/* ── Right: Quantity + Transfer ───────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Ticket size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">Select Quantity</h3>
          <span className="ml-auto text-xs text-gray-400">
            {remainingBalance} available
          </span>
        </div>

        {/* Balance summary */}
        <div className="mb-6 p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm">
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

        {/* Quantity stepper */}
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm font-medium text-gray-600">
            Number of vouchers to transfer
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1 || remainingBalance === 0}
              className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Minus size={18} />
            </button>

            <input
              type="number"
              value={quantity}
              onChange={handleInputChange}
              min={1}
              max={remainingBalance}
              disabled={remainingBalance === 0}
              className="w-24 h-11 text-center text-xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button
              onClick={handleIncrement}
              disabled={quantity >= remainingBalance || remainingBalance === 0}
              className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Transfer value preview */}
          {remainingBalance > 0 ? (
            <div className="text-center">
              <p className="text-xs text-gray-400">Total transfer value</p>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(totalValue)}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-600 text-sm">
              <AlertCircle size={15} />
              No available vouchers to transfer
            </div>
          )}
        </div>

        {/* Transfer button */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <Button
            onClick={handleTransfer}
            disabled={
              !selectedAgent ||
              isProcessing ||
              remainingBalance === 0 ||
              quantity < 1
            }
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Transfer {quantity} Voucher{quantity !== 1 ? "s" : ""} to Agent
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TransferTab;
