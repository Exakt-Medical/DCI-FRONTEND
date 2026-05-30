import { useState, useEffect } from "react";
import TabNavigation from "./components/TabNavigation";
import TransferTab from "./components/TransferTab";
import AgentsTab from "./components/AgentsTab";
import HistoryTab from "./components/HistoryTab";
import SuccessModal from "./components/SuccessModal";
import { transferVoucherService } from "../../services/transferVoucherService";

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
  const [transferHistory, setTransferHistory] = useState([]);

  // ✅ Agents with real voucher counts from API
  const [agents, setAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState(null);

  // ✅ Manager's real voucher balance from API
  const [companyBalance, setCompanyBalance] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // ✅ Get logged-in manager's ID from localStorage
  const managerId =
    JSON.parse(localStorage.getItem("user") || "{}")?.id ||
    localStorage.getItem("userId");
  console.log("user from storage:", localStorage.getItem("user"));
  console.log("userId:", localStorage.getItem("userId"));

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoadingAgents(true);
        setAgentsError(null);
        const data = await transferVoucherService.getAgentsWithVoucherCounts();
        setAgents(data);
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        setAgentsError("Failed to load agents. Please try again.");
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  // ✅ Fetch manager's voucher balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      if (!managerId) return;
      try {
        setIsLoadingBalance(true);
        const counts =
          await transferVoucherService.getManagerBalance(managerId);
        setCompanyBalance(counts.total ?? 0);
        setRemainingBalance(counts.available ?? 0);
      } catch (err) {
        console.error("Failed to fetch manager balance:", err);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [managerId]);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.branch.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const incrementQuantity = () => {
    if (quantity < remainingBalance) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const totalVoucherValue = quantity * VOUCHER_VALUE;

  const handleTransfer = async () => {
    if (!selectedAgent) {
      alert("Please select an agent");
      return;
    }
    if (quantity > remainingBalance) {
      alert(
        `Insufficient balance. Only ${remainingBalance} vouchers available.`,
      );
      return;
    }

    setIsProcessing(true);
    try {
      await transferVoucherService.transfer(managerId, selectedAgent, quantity);

      const agent = agents.find((a) => a.id === selectedAgent);
      const newAssignedCount = (agent.assignedVouchers ?? 0) + quantity;

      setAgents(
        agents.map((a) =>
          a.id === selectedAgent
            ? { ...a, assignedVouchers: newAssignedCount }
            : a,
        ),
      );

      setRemainingBalance((prev) => prev - quantity);

      const newTransfer = {
        id: transferHistory.length + 1,
        agentId: agent.id,
        agentUserId: agent.userId,
        toAgent: agent.name,
        branch: agent.branch,
        quantity,
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
        agentUserId: agent.userId,
        quantity,
        totalValue: totalVoucherValue,
        newAssignedCount,
        remainingBalance: remainingBalance - quantity,
      });

      setShowSuccessModal(true);
      setSelectedAgent(null);
      setQuantity(1);
    } catch (err) {
      console.error("Transfer failed:", err);
      alert(err.message || "Transfer failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
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
          isLoadingAgents={isLoadingAgents}
          agentsError={agentsError}
          isLoadingBalance={isLoadingBalance}
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
          remainingBalance={remainingBalance}
          companyBalance={companyBalance}
        />
      )}

      {activeTab === "agents" && (
        <AgentsTab
          agents={agents}
          isLoadingAgents={isLoadingAgents}
          agentsError={agentsError}
        />
      )}

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
