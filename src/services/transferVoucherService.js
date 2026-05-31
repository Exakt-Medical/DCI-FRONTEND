const BASE_URL = "/api/users";
const VOUCHER_URL = "/api/vouchers";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

const mapUser = (u) => ({
  id: u.id,
  userId: u.userId,
  username: u.username,
  name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  mobile: u.mobile,
  role: u.role,
  branch: u.branchName ?? "—",
  branchId: u.branchId,
  branchCompanyName: u.branchCompanyName ?? "—",
  managerId: u.managerId,
  managerName: u.managerName ?? "—",
  status: u.status,
  isBuyVoucherAllowed: u.isBuyVoucherAllowed ?? false,
  assignedVouchers: 0,
});

export const transferVoucherService = {
  // ─── Users ────────────────────────────────────────────────────────────────

  async getAgents() {
    const res = await fetch(`${BASE_URL}/by-role/AGENT`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);
    return data.map(mapUser);
  },

  async getAgentsWithVoucherCounts() {
    const agents = await this.getAgents();
    const agentsWithCounts = await Promise.all(
      agents.map(async (agent) => {
        try {
          const counts = await this.getVoucherCounts(agent.id);
          return {
            ...agent,
            // ✅ Option A: agents now hold vouchers as AVAILABLE so this is correct again
            assignedVouchers: counts.available ?? 0,
            voucherCounts: counts,
          };
        } catch {
          return {
            ...agent,
            assignedVouchers: 0,
            voucherCounts: {
              total: 0,
              available: 0,
              transferred: 0,
              redeemed: 0,
            },
          };
        }
      }),
    );
    return agentsWithCounts;
  },

  // ─── Vouchers ─────────────────────────────────────────────────────────────

  /** GET /api/vouchers/count/by-user/:userId */
  async getVoucherCounts(userId) {
    const res = await fetch(`${VOUCHER_URL}/count/by-user/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /** GET /api/vouchers/by-user/:userId/available?page=0&size=8&search= */
  async getAvailableVouchersPaginated(userId, page = 0, size = 8, search = "") {
    const params = new URLSearchParams({ page, size, search });
    const res = await fetch(
      `${VOUCHER_URL}/by-user/${userId}/available?${params}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(res);
    // Returns Spring Page: { content, totalPages, totalElements, number, size }
  },

  /** GET /api/vouchers/count/by-user/:userId — for manager's own balance */
  async getManagerBalance(managerId) {
    const res = await fetch(`${VOUCHER_URL}/count/by-user/${managerId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * GET /api/vouchers/transfer/history/:fromUserId
   * Returns transfer history grouped by batch (one entry per transfer action).
   * Shape: { referenceNumber, fromUserId, toUserId, quantity, voucherCodes, transferredAt }[]
   */
  async getTransferHistory(fromUserId) {
    const res = await fetch(`${VOUCHER_URL}/transfer/history/${fromUserId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * POST /api/vouchers/transfer/from/:fromUserId
   * Transfers specific vouchers by ID from manager to agent.
   */
  async transfer(fromUserId, toUserId, voucherIds) {
    const res = await fetch(`${VOUCHER_URL}/transfer/from/${fromUserId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ toUserId, voucherIds }),
    });
    return handleResponse(res);
  },
};
