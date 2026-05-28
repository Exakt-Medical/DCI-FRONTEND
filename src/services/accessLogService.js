import api from "./api";

export const accessLogService = {
  getAll: () => api.get("/access-logs"),
};
