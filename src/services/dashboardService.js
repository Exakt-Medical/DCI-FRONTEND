import api from "./api";

export const dashboardService = {
  getStats: () => api.get("/admin/dashboard/stats"),
  getRecentTransactions: () => api.get("/admin/transactions/recent"),
  getAllTransactions: () => api.get("/admin/transactions"),
};