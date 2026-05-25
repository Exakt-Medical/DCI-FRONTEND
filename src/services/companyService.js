import api from "./api";

export const companyService = {
  getAll: () => api.get("/companies"),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post("/companies", data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  bulkCreate: (data) => api.post("/companies/bulk", data),
};
