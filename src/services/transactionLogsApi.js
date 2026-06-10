// services/transactionLogsApi.js
import api from "./api";

export const transactionLogsApi = {
  // Get all transaction logs with filters
  getTransactionLogs: async ({ status, search, page, limit = 10 }) => {
    // Backend uses 0-based page index, frontend uses 1-based
    const pageIndex = page ? page - 1 : 0;

    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (pageIndex) params.append("page", pageIndex);
    if (limit) params.append("size", limit);

    try {
      // ✅ Changed from /api/transaction-logs to /api/transactions
      const { data } = await api.get("/transactions", { params });

      // ✅ Transform backend response to match frontend expectations
      return {
        data: data.transactions || [],
        totalPages: data.totalPages || 1,
        total: data.totalElements || 0,
        currentPage: (data.currentPage || 0) + 1, // Convert back to 1-based
        stats: data.stats || { authenticated: 0, verified: 0, failed: 0 },
      };
    } catch (error) {
      if (error?.response?.status === 401) {
        console.error("401 Unauthorized - Token may be invalid or expired");
      }
      const status = error?.response?.status;
      throw new Error(
        status
          ? `HTTP error! status: ${status}`
          : "Failed to fetch transaction logs",
      );
    }
  },

  getTransactionLogById: async (id) => {
    try {
      // ✅ Changed endpoint to match backend
      const { data } = await api.get(`/transactions/${id}`);
      return data;
    } catch (error) {
      const status = error?.response?.status;
      throw new Error(
        status
          ? `HTTP error! status: ${status}`
          : "Failed to fetch transaction log",
      );
    }
  },

  // Note: You might not need this for transaction logs since they're read-only
  createTransactionLog: async (data) => {
    try {
      const response = await api.post("/transactions", data);
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      throw new Error(
        status
          ? `HTTP error! status: ${status}`
          : "Failed to create transaction log",
      );
    }
  },
};
