import { useState, useEffect, useCallback } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);

  // Quantity replaces selectedVoucherIds
  const [quantity, setQuantity] = useState(1);

  // Transfer history
  const [transferHistory, setTransferHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Agents
  const [agents, setAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState(null);

  // Manager balance
  const [companyBalance, setCompanyBalance] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const managerId = localStorage.getItem("userId");

  // ─── Fetch agents ──────────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // ─── Fetch manager balance ─────────────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    if (!managerId) return;
    try {
      const counts = await transferVoucherService.getManagerBalance(managerId);
      setCompanyBalance(counts.total ?? 0);
      setRemainingBalance(counts.available ?? 0);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [managerId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // ─── Fetch transfer history ────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!managerId) return;
    try {
      setIsLoadingHistory(true);
      const data = await transferVoucherService.getTransferHistory(managerId);
      setTransferHistory(data ?? []);
    } catch (err) {
      console.error("Failed to fetch transfer history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [managerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── Filtered agents ───────────────────────────────────────────────────────
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.branch.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ─── Transfer ──────────────────────────────────────────────────────────────
  const handleTransfer = async () => {
    if (!selectedAgent) {
      alert("Please select an agent");
      return;
    }
    if (quantity < 1) {
      alert("Please select at least 1 voucher to transfer");
      return;
    }
    if (quantity > remainingBalance) {
      alert(
        `Insufficient vouchers. You only have ${remainingBalance} available.`,
      );
      return;
    }

    setIsProcessing(true);
    try {
      // Send quantity only — backend picks which vouchers to transfer
      await transferVoucherService.transferByQuantity(
        managerId,
        selectedAgent,
        quantity,
      );

      const agent = agents.find((a) => a.id === selectedAgent);

      setTransferSuccess({
        agent: agent.name,
        agentUserId: agent.userId,
        quantity,
        totalValue: quantity * VOUCHER_VALUE,
        newAssignedCount: (agent.assignedVouchers ?? 0) + quantity,
        remainingBalance: remainingBalance - quantity,
      });

      setQuantity(1);
      setSelectedAgent(null);
      setShowSuccessModal(true);

      // Re-fetch everything from the server
      await Promise.all([fetchAgents(), fetchBalance(), fetchHistory()]);
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
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isProcessing={isProcessing}
          handleTransfer={handleTransfer}
          remainingBalance={remainingBalance}
          companyBalance={companyBalance}
          quantity={quantity}
          setQuantity={setQuantity}
        />
      )}

      {activeTab === "agents" && (
        <AgentsTab
  agents={agents}
  transferHistory={transferHistory}
  isLoadingAgents={isLoadingAgents}
  agentsError={agentsError}
/>
      )}

      {activeTab === "history" && (
        <HistoryTab
          transferHistory={transferHistory}
          isLoadingHistory={isLoadingHistory}
        />
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
