import api from "./api";

export const fetchMyRequests = async (page = 0, size = 10, search = "", filter = "all") => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("size", size);
  if (search) params.append("search", search);
  if (filter) params.append("filter", filter);
  
  const response = await api.get(`/certificate-requests?${params.toString()}`);
  return response.data;
};

export const fetchRequestById = async (id) => {
  const response = await api.get(`/certificate-requests/${id}`);
  return response.data;
};

export const upsertRequest = async (payload) => {
  const response = await api.post("/certificate-requests", payload);
  return response.data;
};
