import { useMemo, useState } from "react";
import {
  VOUCHER_INVENTORY_FILTERS,
  VOUCHER_INVENTORY_STATUS,
} from "../../../constants/voucherInventoryStatus";
import { voucherInventoryService } from "../../../services/voucherInventoryService";

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

    await new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });

    const batchResult = voucherInventoryService.createPurchasedVouchers(safeQuantity, {
      role: "agent_fixer",
      amount: 500,
    });

    onInventoryChange?.([...(inventory || []), ...batchResult.rows]);

    setLastBatch({
      batchId: batchResult.batchId,
      quantity: batchResult.rows.length,
      createdAt: batchResult.rows[0]?.dateCreated || new Date().toISOString(),
    });

    setActiveTab("inventory");
    setStatusFilter(VOUCHER_INVENTORY_STATUS.AVAILABLE);
    setSearchTerm("");
    setIsProcessingPayment(false);
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
