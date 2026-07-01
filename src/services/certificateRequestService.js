import api from "./api";

export const fetchMyRequests = async () => {
  const response = await api.get("/certificate-requests");
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
