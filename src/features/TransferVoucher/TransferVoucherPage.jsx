import { useState } from "react";
import TabNavigation from "./components/TabNavigation";
import TransferTab from "./components/TransferTab";
import AgentsTab from "./components/AgentsTab";
import HistoryTab from "./components/HistoryTab";
import SuccessModal from "./components/SuccessModal";

// Mock agents list
export const mockAgents = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@agent.com",
    branch: "Manila Branch",
    assignedVouchers: 5,
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@agent.com",
    branch: "Quezon City Branch",
    assignedVouchers: 3,
  },
  {
    id: 3,
    name: "Jose Reyes",
    email: "jose.reyes@agent.com",
    branch: "Makati Branch",
    assignedVouchers: 2,
  },
];

export const VOUCHER_VALUE = 60;

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const TransferVoucherPage = () => {
  const [activeTab, setActiveTab] = useState("transfer");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [agents, setAgents] = useState(mockAgents);
  const [transferHistory, setTransferHistory] = useState([]);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.branch.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const totalVoucherValue = quantity * VOUCHER_VALUE;

  const handleTransfer = async () => {
    if (!selectedAgent) {
      alert("Please select an agent");
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const agent = agents.find((a) => a.id === selectedAgent);
    const newAssignedCount = agent.assignedVouchers + quantity;

    setAgents(
      agents.map((a) =>
        a.id === selectedAgent
          ? {
              ...a,
              assignedVouchers: newAssignedCount,
            }
          : a,
      ),
    );

    const newTransfer = {
      id: transferHistory.length + 1,
      toAgent: agent.name,
      quantity: quantity,
      totalValue: totalVoucherValue,
      transferDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Completed",
      referenceNumber: `TRF-${Date.now().toString().slice(-8)}`,
    };
    setTransferHistory([newTransfer, ...transferHistory]);

    setTransferSuccess({
      agent: agent.name,
      quantity: quantity,
      totalValue: totalVoucherValue,
      newAssignedCount: newAssignedCount,
    });

    setIsProcessing(false);
    setShowSuccessModal(true);
    setSelectedAgent(null);
    setQuantity(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Voucher Transfer
        </h1>
        <p className="text-sm text-gray-500">
          Transfer Basic CTPL vouchers to agents (₱{VOUCHER_VALUE} each)
        </p>
      </div>

      <TabNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        agentsCount={agents.length}
      />

      {activeTab === "transfer" && (
        <TransferTab
          agents={filteredAgents}
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          quantity={quantity}
          incrementQuantity={incrementQuantity}
          decrementQuantity={decrementQuantity}
          setQuantity={setQuantity}
          totalVoucherValue={totalVoucherValue}
          isProcessing={isProcessing}
          handleTransfer={handleTransfer}
        />
      )}

      {activeTab === "agents" && <AgentsTab agents={agents} />}

      {activeTab === "history" && (
        <HistoryTab transferHistory={transferHistory} />
      )}

      <SuccessModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        transferSuccess={transferSuccess}
        setTransferSuccess={setTransferSuccess}
      />
    </div>
  );
};

export default TransferVoucherPage;
