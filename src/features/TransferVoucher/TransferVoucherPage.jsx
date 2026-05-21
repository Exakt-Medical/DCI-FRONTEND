import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import {
  Send,
  Users,
  Ticket,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  UserPlus,
  History,
  RefreshCw
} from "lucide-react";

// Mock agents list
const mockAgents = [
  { id: 1, name: "Juan Dela Cruz", email: "juan.delacruz@agent.com", branch: "Manila Branch", status: "Active", assignedVouchers: 5 },
  { id: 2, name: "Maria Santos", email: "maria.santos@agent.com", branch: "Quezon City Branch", status: "Active", assignedVouchers: 3 },
  { id: 3, name: "Jose Reyes", email: "jose.reyes@agent.com", branch: "Makati Branch", status: "Active", assignedVouchers: 2 },
  { id: 4, name: "Ana Gonzales", email: "ana.gonzales@agent.com", branch: "Taguig Branch", status: "Inactive", assignedVouchers: 0 },
];

// Mock available vouchers for transfer
const mockAvailableVouchers = [
  { id: 1, voucherCode: "VCH-ABC123XYZ", policyNumber: "CTPL-2024-123456", productName: "Basic CTPL", status: "Available", purchaseDate: "Dec 1, 2024", expiryDate: "Dec 1, 2025" },
  { id: 2, voucherCode: "VCH-DEF456UVW", policyNumber: "CTPL-2024-789012", productName: "Premium CTPL", status: "Available", purchaseDate: "Nov 25, 2024", expiryDate: "Nov 25, 2025" },
  { id: 3, voucherCode: "VCH-GHI789RST", policyNumber: "CTPL-2024-345678", productName: "Motorcycle CTPL", status: "Available", purchaseDate: "Oct 15, 2024", expiryDate: "Apr 15, 2025" },
  { id: 4, voucherCode: "VCH-JKL123MNO", policyNumber: "CTPL-2024-901234", productName: "Commercial Vehicle CTPL", status: "Available", purchaseDate: "Dec 10, 2024", expiryDate: "Dec 10, 2025" },
  { id: 5, voucherCode: "VCH-PQR456STU", policyNumber: "CTPL-2024-567890", productName: "Heavy Equipment CTPL", status: "Available", purchaseDate: "Dec 15, 2024", expiryDate: "Dec 15, 2025" },
];

// Mock transfer history
const mockTransferHistory = [
  { id: 1, voucherCode: "VCH-ABC123XYZ", fromManager: "Manager User", toAgent: "Juan Dela Cruz", quantity: 1, transferDate: "Dec 20, 2024", status: "Completed" },
  { id: 2, voucherCode: "VCH-DEF456UVW", fromManager: "Manager User", toAgent: "Maria Santos", quantity: 2, transferDate: "Dec 18, 2024", status: "Completed" },
  { id: 3, voucherCode: "VCH-GHI789RST", fromManager: "Manager User", toAgent: "Jose Reyes", quantity: 1, transferDate: "Dec 15, 2024", status: "Pending" },
];

const TransferVoucherPage = () => {
  const [activeTab, setActiveTab] = useState("transfer");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [agents, setAgents] = useState(mockAgents);
  const [availableVouchers, setAvailableVouchers] = useState(mockAvailableVouchers);
  const [transferHistory, setTransferHistory] = useState(mockTransferHistory);

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTransfer = async () => {
    if (!selectedAgent || selectedVouchers.length === 0) {
      alert("Please select an agent and at least one voucher");
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const agent = agents.find(a => a.id === parseInt(selectedAgent));
    const newTransfer = {
      id: transferHistory.length + 1,
      voucherCode: selectedVouchers.join(", "),
      fromManager: "Manager User",
      toAgent: agent.name,
      quantity: selectedVouchers.length,
      transferDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Completed"
    };
    
    setTransferHistory([newTransfer, ...transferHistory]);
    
    // Update agent's assigned vouchers count
    setAgents(agents.map(a => 
      a.id === parseInt(selectedAgent) 
        ? { ...a, assignedVouchers: a.assignedVouchers + selectedVouchers.length }
        : a
    ));
    
    // Remove transferred vouchers from available list
    setAvailableVouchers(availableVouchers.filter(v => !selectedVouchers.includes(v.voucherCode)));
    
    setTransferSuccess({
      agent: agent.name,
      quantity: selectedVouchers.length,
      vouchers: selectedVouchers
    });
    
    setIsProcessing(false);
    setShowSuccessModal(true);
    setSelectedVouchers([]);
    setSelectedAgent("");
    setQuantity(1);
  };

  const toggleVoucherSelection = (voucherCode) => {
    if (selectedVouchers.includes(voucherCode)) {
      setSelectedVouchers(selectedVouchers.filter(v => v !== voucherCode));
    } else {
      setSelectedVouchers([...selectedVouchers, voucherCode]);
    }
  };

  const handleSelectAll = () => {
    if (selectedVouchers.length === availableVouchers.length) {
      setSelectedVouchers([]);
    } else {
      setSelectedVouchers(availableVouchers.map(v => v.voucherCode));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Voucher Management</h1>
        <p className="text-sm text-gray-500">Transfer vouchers to agents and manage distribution</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === "transfer"
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Send size={14} className="inline mr-2" />
          Transfer Vouchers
          {activeTab === "transfer" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === "inventory"
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Ticket size={14} className="inline mr-2" />
          Voucher Inventory
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{availableVouchers.length}</span>
          {activeTab === "inventory" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === "history"
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <History size={14} className="inline mr-2" />
          Transfer History
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
          )}
        </button>
      </div>

      {/* Transfer Vouchers Tab */}
      {activeTab === "transfer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Select Agent */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <Users size={18} className="text-primary-600" />
              <h3 className="text-base font-bold text-gray-900">Select Agent</h3>
            </div>
            
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search agents by name, email, or branch..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pl-9 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id.toString())}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAgent === agent.id.toString()
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
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        agent.status === "Active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {agent.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Assigned: {agent.assignedVouchers} vouchers
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAgents.length === 0 && (
                <p className="text-center text-gray-500 py-4">No agents found</p>
              )}
            </div>
          </Card>

          {/* Right Column - Select Vouchers */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-primary-600" />
                <h3 className="text-base font-bold text-gray-900">Select Vouchers</h3>
              </div>
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                {selectedVouchers.length === availableVouchers.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {availableVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  onClick={() => toggleVoucherSelection(voucher.voucherCode)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedVouchers.includes(voucher.voucherCode)
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900">{voucher.voucherCode}</p>
                      <p className="text-xs text-gray-500">{voucher.productName}</p>
                      <p className="text-xs text-gray-400">Policy: {voucher.policyNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-green-600">Available</span>
                      <p className="text-xs text-gray-400 mt-1">Expires: {voucher.expiryDate}</p>
                    </div>
                  </div>
                </div>
              ))}
              {availableVouchers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No available vouchers to transfer</p>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Selected Vouchers:</span>
                <span className="text-sm font-bold text-gray-900">{selectedVouchers.length}</span>
              </div>
              <Button
                onClick={handleTransfer}
                disabled={!selectedAgent || selectedVouchers.length === 0 || isProcessing}
                className="w-full"
              >
                {isProcessing ? <Spinner size="sm" /> : <><Send size={16} className="mr-2" /> Transfer to Agent</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Voucher Inventory Tab */}
      {activeTab === "inventory" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-primary-600" />
              <h3 className="text-base font-bold text-gray-900">Available Vouchers</h3>
            </div>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw size={12} className="mr-1" /> Refresh
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Voucher Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Policy Number</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Purchase Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Expiry Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {availableVouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-gray-900">{voucher.voucherCode}</code>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{voucher.policyNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{voucher.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{voucher.purchaseDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{voucher.expiryDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                        Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {availableVouchers.length === 0 && (
              <div className="text-center py-8">
                <Ticket size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No vouchers available</p>
                <p className="text-sm text-gray-400 mt-1">Purchase vouchers first to see them here</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Transfer History Tab */}
      {activeTab === "history" && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <History size={18} className="text-primary-600" />
            <h3 className="text-base font-bold text-gray-900">Transfer History</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Voucher Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Transferred To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Quantity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{transfer.transferDate}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-gray-900">{transfer.voucherCode}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{transfer.toAgent}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transfer.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        transfer.status === "Completed" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {transfer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transferHistory.length === 0 && (
              <div className="text-center py-8">
                <History size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transfer history found</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Success Modal */}
      {showSuccessModal && transferSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Transfer Successful!</h2>
                <p className="text-xs text-gray-500">Vouchers have been assigned to agent</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Agent:</span>
                    <span className="text-sm font-medium text-gray-900">{transferSuccess.agent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="text-sm font-medium text-gray-900">{transferSuccess.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vouchers:</span>
                    <span className="text-sm font-mono text-gray-900">{transferSuccess.vouchers.join(", ")}</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setTransferSuccess(null);
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferVoucherPage;