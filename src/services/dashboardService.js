// services/dashboardService.js
import api from "./api";

export const dashboardService = {
  async getDashboardData(page = 1, size = 8) {
    const response = await api.get(
      `/dashboard/data?page=${page}&size=${size}`,
    );
    return response.data;
  },

  async getHealthCheck() {
    const response = await api.get("/health");
    return response.data;
  },
};
