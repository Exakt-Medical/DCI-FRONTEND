import {
  VOUCHER_INVENTORY_STATUS,
  VOUCHER_INVENTORY_STATUS_LABELS,
} from "../constants/voucherInventoryStatus";

import api from "./api";

export const voucherInventoryService = {
  async fetchAgentInventory(userId) {
    if (!userId) return [];
    try {
      const response = await api.get(`/voucher-transfer/by-user/${userId}`);
      return (response.data || []).map(v => ({
        voucherId: String(v.id),
        voucherCode: v.voucherCode,
        inventoryStatus: v.status,
        dateCreated: v.createdAt,
        batchId: v.orderId ? `ORDER-${v.orderId}` : "N/A",
        assignedToPlate: v.voucherReference || "",
        assignedToId: null,
        assignedBy: "agent_fixer",
        role: "agent_fixer",
        dateAssigned: v.updatedAt || "",
        dateUsed: v.redeemedAt || "",
        dateExpired: v.expiresAt || "",
      }));
    } catch (error) {
      console.error("Failed to fetch agent inventory", error);
      return [];
    }
  },

  getSummary(vouchers = []) {
    return vouchers.reduce(
      (acc, item) => {
        if (item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE) acc.available += 1;
        if (item.inventoryStatus === VOUCHER_INVENTORY_STATUS.ASSIGNED) acc.assigned += 1;
        if (item.inventoryStatus === VOUCHER_INVENTORY_STATUS.USED) acc.used += 1;
        if (item.inventoryStatus === VOUCHER_INVENTORY_STATUS.EXPIRED) acc.expired += 1;
        return acc;
      },
      {
        all: vouchers.length,
        available: 0,
        assigned: 0,
        used: 0,
        expired: 0,
      },
    );
  },

  getStatusLabel(status) {
    return VOUCHER_INVENTORY_STATUS_LABELS[status] || status || "Unknown";
  },

  assignVoucherToRequest(vouchers = [], { voucherId, id, plateNumber = "", assignedBy = "agent_fixer" }) {
    if (!voucherId || !id) return vouchers;

    const now = new Date().toISOString();
    return vouchers.map((item) => {
      if (item.voucherId === voucherId) {
        return {
          ...item,
          inventoryStatus: VOUCHER_INVENTORY_STATUS.ASSIGNED,
          assignedToId: id,
          assignedToPlate: plateNumber || item.assignedToPlate || "",
          assignedBy,
          dateAssigned: item.dateAssigned || now,
        };
      }

      if (
        item.assignedToId === id &&
        item.voucherId !== voucherId &&
        item.inventoryStatus === VOUCHER_INVENTORY_STATUS.ASSIGNED
      ) {
        return {
          ...item,
          inventoryStatus: VOUCHER_INVENTORY_STATUS.AVAILABLE,
          assignedToId: null,
          assignedToPlate: "",
          assignedBy: "",
          dateAssigned: "",
        };
      }

      return item;
    });
  },

  markVoucherUsed(vouchers = [], { voucherId, id }) {
    if (!voucherId) return vouchers;

    return vouchers.map((item) => {
      if (item.voucherId !== voucherId) return item;

      return {
        ...item,
        inventoryStatus: VOUCHER_INVENTORY_STATUS.USED,
        assignedToId: id || item.assignedToId || null,
        dateUsed: new Date().toISOString(),
      };
    });
  },
};
