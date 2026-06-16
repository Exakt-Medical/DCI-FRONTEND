import {
  VOUCHER_INVENTORY_STATUS,
  VOUCHER_INVENTORY_STATUS_LABELS,
} from "../constants/voucherInventoryStatus";

const makeVoucherCode = () => `VCH-${String(Date.now() + Math.floor(Math.random() * 1000)).slice(-8)}`;

const makeVoucherId = () => `VOUCH-${Date.now()}-${String(Math.random()).slice(2, 6)}`;

const makeBatchId = () => `BATCH-${Date.now()}`;

export const voucherInventoryService = {
  createPurchasedVouchers(quantity, options = {}) {
    const safeQuantity = Math.max(Number(quantity) || 0, 0);
    const batchId = options.batchId || makeBatchId();
    const createdAt = options.createdAt || new Date().toISOString();

    return {
      batchId,
      rows: Array.from({ length: safeQuantity }, () => ({
        voucherId: makeVoucherId(),
        voucherCode: makeVoucherCode(),
        inventoryStatus: VOUCHER_INVENTORY_STATUS.AVAILABLE,
        assignedToId: null,
        assignedToPlate: "",
        assignedBy: "",
        role: options.role || "agent_fixer",
        amount: options.amount || 500,
        source: "AGENT_BULK",
        dateCreated: createdAt,
        dateAssigned: "",
        dateUsed: "",
        dateExpired: "",
        batchId,
      })),
    };
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
