import api from "./api";

export const auditTrailService = {
  getAll: () => api.get("/audit-trail"),
  getById: (id) => api.get(`/audit-trail/${id}`),
};
