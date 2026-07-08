import { useMemo, useState, useEffect } from "react";
import {
  VOUCHER_INVENTORY_FILTERS,
  VOUCHER_INVENTORY_STATUS,
} from "../../../constants/voucherInventoryStatus";
import { voucherInventoryService } from "../../../services/voucherInventoryService";
import paymentsService from "../../../services/paymentsService";
import Swal from "sweetalert2";

export const useVoucherInventory = ({
  inventory,
  onInventoryChange,
}) => {
  const [activeTab, setActiveTab] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastBatch, setLastBatch] = useState(null);
  const fetchInventory = async () => {
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const userId = localStorage.getItem("userId") || profile.id;
    if (userId) {
      // MOCK BEHAVIOR: Fetch from localStorage
      const data = JSON.parse(localStorage.getItem("mock_agent_vouchers") || "[]");
      onInventoryChange?.(data);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const summary = useMemo(() => voucherInventoryService.getSummary(inventory), [inventory]);

  const filteredRows = useMemo(() => {
    return inventory.filter((item) => {
      const statusMatch =
        statusFilter === "ALL" ? true : item.inventoryStatus === statusFilter;

      const text = `${item.voucherCode} ${item.batchId} ${item.assignedToPlate}`.toLowerCase();
      const searchMatch = searchTerm ? text.includes(searchTerm.toLowerCase()) : true;

      return statusMatch && searchMatch;
    });
  }, [inventory, searchTerm, statusFilter]);

  const filterOptions = useMemo(
    () =>
      VOUCHER_INVENTORY_FILTERS.map((filter) => ({
        ...filter,
        count:
          filter.id === "ALL"
            ? summary.all
            : inventory.filter((item) => item.inventoryStatus === filter.id).length,
      })),
    [inventory, summary.all],
  );

  const handlePurchase = async () => {
    if (isProcessingPayment) return;

    const safeQuantity = Math.max(Number(quantity) || 0, 0);
    if (!safeQuantity) return;

    setIsProcessingPayment(true);

    try {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newVouchers = Array.from({ length: safeQuantity }).map(() => ({
        id: "VCH-" + Math.floor(Math.random() * 1000000),
        voucherCode: "DCI-VCH-" + Math.floor(Math.random() * 1000000),
        inventoryStatus: "AVAILABLE",
        batchId: `BATCH-${Date.now()}`
      }));
      
      const existing = JSON.parse(localStorage.getItem("mock_agent_vouchers") || "[]");
      const updated = [...existing, ...newVouchers];
      localStorage.setItem("mock_agent_vouchers", JSON.stringify(updated));
      
      Swal.fire({
        icon: "success",
        title: "Payment Successful",
        text: "Your vouchers have been added to your inventory.",
      });
      
      await fetchInventory();
      setActiveTab("inventory");
    } catch (error) {
      console.error("[Agent Voucher] Payment setup failed:", error);
      Swal.fire({
        icon: "error",
        title: "Payment Setup Failed",
        text: "Failed to initiate payment.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    quantity,
    setQuantity,
    isProcessingPayment,
    handlePurchase,
    summary,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    filteredRows,
    filterOptions,
    lastBatch,
  };
};
