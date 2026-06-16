import api from "./api";

export const fetchMyRequests = async () => {
  const response = await api.get("/user-requests");
  return response.data;
};

export const upsertRequest = async (payload) => {
  const response = await api.post("/user-requests", payload);
  return response.data;
};
