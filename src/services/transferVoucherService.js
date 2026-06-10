import api from "./api";

const BASE_URL = "/users";
const VOUCHER_URL = "/voucher-transfer";

const handleResponse = (res) => {
  if (res.status === 204) return null;
  return res.data;
};

const normalizeError = (error) => {
  if (error?.response) {
    const body = error.response.data;
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Error(`${error.response.status}: ${text}`);
  }
  return error;
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
    try {
      const res = await api.get(`${BASE_URL}/by-role/AGENT_FIXER`);
      const data = handleResponse(res);
      return data.map(mapUser);
    } catch (error) {
      throw normalizeError(error);
    }
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
    try {
      const res = await api.get(`${VOUCHER_URL}/count/by-user/${userId}`);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * POST /api/vouchers/count/batch
   * Sends all agent IDs at once, gets back { userId: availableCount } map.
   * Replaces N individual getVoucherCounts() calls.
   */
  async countBatch(userIds) {
    try {
      const res = await api.post(`${VOUCHER_URL}/count/batch`, userIds);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getManagerBalance(managerId) {
    try {
      const res = await api.get(`${VOUCHER_URL}/count/by-user/${managerId}`);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // ─── Transfer History ─────────────────────────────────────────────────────

  async getTransferHistory(fromUserId) {
    try {
      const res = await api.get(
        `${VOUCHER_URL}/transfer/history/${fromUserId}`,
      );
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // ─── Transfer by quantity ─────────────────────────────────────────────────

  async transferByQuantity(fromUserId, toUserId, quantity) {
    try {
      const res = await api.post(`${VOUCHER_URL}/transfer/from/${fromUserId}`, {
        toUserId,
        quantity,
      });
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
