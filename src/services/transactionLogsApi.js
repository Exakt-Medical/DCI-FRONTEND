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
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const url = `${API_BASE_URL}/api/transaction-logs?${params}`;

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
    return response.json();
  },

  getTransactionLogById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/transaction-logs/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  createTransactionLog: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/transaction-logs`, {
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
