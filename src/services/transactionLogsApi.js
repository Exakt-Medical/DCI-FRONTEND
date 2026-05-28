// services/transactionLogsApi.js

const API_BASE_URL = "http://localhost:8080";

export const transactionLogsApi = {
  // Get all transaction logs with filters
  getTransactionLogs: async ({ status, search, page, limit = 10 }) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const response = await fetch(
      `${API_BASE_URL}/api/transaction-logs?${params}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Get single transaction log by ID
  getTransactionLogById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transaction-logs/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // Create new transaction log (if needed for testing)
  createTransactionLog: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/transaction-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};
