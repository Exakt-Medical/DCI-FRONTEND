const BASE_URL = "/api/users";
const VOUCHER_URL = "/api/voucher-transfer";

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
  assignedVouchers: 0,
});

export const transferVoucherService = {
  // ─── Users ────────────────────────────────────────────────────────────────

  async getAgents() {
    const res = await fetch(`${BASE_URL}/by-role/AGENT_FIXER`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);
    return data.map(mapUser);
  },

  async getAgentsWithVoucherCounts() {
    // ✅ 2 requests total instead of 1 + N
    // First fetch all agents, then one batch call for all their counts
    const agents = await this.getAgents();

    if (agents.length === 0) return [];

    const userIds = agents.map((a) => a.id);
    const countsMap = await this.countBatch(userIds);
    // countsMap is { [userId]: availableCount } — agents with 0 vouchers won't appear, default to 0

    return agents.map((agent) => ({
      ...agent,
      assignedVouchers: countsMap[agent.id] ?? 0,
    }));
  },

  // ─── Vouchers ─────────────────────────────────────────────────────────────

  async getVoucherCounts(userId) {
    const res = await fetch(`${VOUCHER_URL}/count/by-user/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * POST /api/vouchers/count/batch
   * Sends all agent IDs at once, gets back { userId: availableCount } map.
   * Replaces N individual getVoucherCounts() calls.
   */
  async countBatch(userIds) {
    const res = await fetch(`${VOUCHER_URL}/count/batch`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userIds),
    });
    return handleResponse(res);
  },

  async getManagerBalance(managerId) {
    const res = await fetch(`${VOUCHER_URL}/count/by-user/${managerId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Transfer History ─────────────────────────────────────────────────────

  async getTransferHistory(fromUserId) {
    const res = await fetch(`${VOUCHER_URL}/transfer/history/${fromUserId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ─── Transfer by quantity ─────────────────────────────────────────────────

  async transferByQuantity(fromUserId, toUserId, quantity) {
    const res = await fetch(`${VOUCHER_URL}/transfer/from/${fromUserId}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ toUserId, quantity }),
    });
    return handleResponse(res);
  },
};
