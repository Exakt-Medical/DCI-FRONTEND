import {
  VOUCHER_INVENTORY_STATUS,
  VOUCHER_INVENTORY_STATUS_LABELS,
} from "../constants/voucherInventoryStatus";

import api from "./api";

export const voucherInventoryService = {
  async fetchAgentInventory(userId, page = 1, size = 10, search = "", filter = "ALL") {
    if (!userId) return { content: [], counts: {}, totalPages: 0, totalElements: 0 };
    try {
      const res = await api.get(`/voucher-transfer/by-user/${userId}/paginated`, {
        params: {
          page: page - 1, // backend is 0-indexed
          size,
          search,
          filter: filter === "ALL" ? "" : filter,
        }
      });

      const { content, totalPages, totalElements, counts } = res.data;

      const mappedContent = (content || []).map(v => {
        return {
          voucherId: String(v.id),
          voucherCode: v.voucherCode,
          inventoryStatus: v.computedStatus || v.status,
          dateCreated: v.createdAt,
          batchId: v.orderId ? `ORDER-${v.orderId}` : "N/A",
          assignedToPlate: v.assignedToPlate || v.voucherReference || "",
          assignedToId: v.assignedToId || null,
          assignedBy: "agent_fixer",
          role: "agent_fixer",
          dateAssigned: v.updatedAt || "",
          dateUsed: v.redeemedAt || "",
          dateExpired: v.expiresAt || "",
        };
      });

      return {
        content: mappedContent,
        totalPages,
        totalElements,
        counts
      };
    } catch (error) {
      console.error("Failed to fetch agent inventory", error);
      return { content: [], counts: {}, totalPages: 0, totalElements: 0 };
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
