// services/transactionLogsApi.js

const API_BASE_URL = "http://localhost:8080";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

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

    // ✅ Changed from /api/transaction-logs to /api/transactions
    const url = `${API_BASE_URL}/api/transactions?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("401 Unauthorized - Token may be invalid or expired");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // ✅ Transform backend response to match frontend expectations
    return {
      data: data.transactions || [],
      totalPages: data.totalPages || 1,
      total: data.totalElements || 0,
      currentPage: (data.currentPage || 0) + 1, // Convert back to 1-based
      stats: data.stats || { authenticated: 0, verified: 0, failed: 0 },
    };
  },

  getTransactionLogById: async (id) => {
    // ✅ Changed endpoint to match backend
    const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Note: You might not need this for transaction logs since they're read-only
  createTransactionLog: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
