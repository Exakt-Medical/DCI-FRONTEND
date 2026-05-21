import api from "./api";

export const companyService = {
  getAll: () => api.get("/admin/companies"),
  getByStatus: (status) => api.get(`/admin/companies/status/${status}`),
  create: (data) => api.post("/admin/companies", data),
  update: (id, data) => api.put(`/admin/companies/${id}`, data),
  updateStatus: (id, action) =>
    api.put(`/admin/companies/${id}/status`, { action }),
};