import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import {
  Users,
  Ticket,
  Search,
  Plus,
  Minus,
  Send,
  Building2,
} from "lucide-react";
import { VOUCHER_VALUE, formatCurrency } from "../TransferVoucherPage";

const TransferTab = ({
  agents,
  selectedAgent,
  setSelectedAgent,
  searchTerm,
  setSearchTerm,
  quantity,
  incrementQuantity,
  decrementQuantity,
  setQuantity,
  totalVoucherValue,
  isProcessing,
  handleTransfer,
  remainingBalance,
  companyBalance,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Select Agent */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Users size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">Select Agent </h3>
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
            placeholder="Search agents by name, email, or branch..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {agents.map((agent) => (
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
                  <p className="text-xs text-gray-400 mt-1">{agent.branch}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
                    Current Vouchers: {agent.assignedVouchers} vouchers
                  </p>
                </div>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <p className="text-center text-gray-500 py-4">No agents found</p>
          )}
        </div>
      </Card>

      {/* Right Column - Voucher Details */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Ticket size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">Voucher Details</h3>
        </div>

        {/* Current Vouchers (Manager) - Company Balance */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-primary-100" />
            <p className="text-primary-100 text-sm font-medium">
              Current Vouchers (Manager)
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-2xl font-bold">
                {remainingBalance} vouchers remaining
              </p>
              <p className="text-primary-100 text-xs mt-1">
                Total company balance: {companyBalance} vouchers
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm">
                Running / Remaining Balance
              </p>
              <p className="text-white text-xl font-bold">
                {formatCurrency(remainingBalance * VOUCHER_VALUE)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-1">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= remainingBalance) {
                    setQuantity(val);
                  }
                }}
                className="w-20 text-center text-xl font-semibold text-gray-900 border-0 focus:outline-none focus:ring-0"
                min="1"
                max={remainingBalance}
              />
              <button
                onClick={incrementQuantity}
                disabled={quantity >= remainingBalance}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} className="text-gray-600" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              vouchers (max: {remainingBalance} available)
            </span>
          </div>
        </div>

        <Button
          onClick={handleTransfer}
          disabled={
            !selectedAgent || isProcessing || quantity > remainingBalance
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
      </Card>
    </div>
  );
};

export default TransferTab;
