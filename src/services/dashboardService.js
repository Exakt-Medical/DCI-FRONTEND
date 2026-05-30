// services/dashboardService.js
import api from "./api";

export const dashboardService = {
  async getDashboardData(page = 1, size = 8) {
    try {
      // Remove the extra /api - your baseURL already adds it
      const response = await api.get(
        `/dashboard/data?page=${page}&size=${size}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  },
};
