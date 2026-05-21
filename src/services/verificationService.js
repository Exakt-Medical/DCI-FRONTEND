import api from "./api";

export const verificationService = {
  lookup: (data) => api.post("/verification/lookup", data),
  generateCertificate: (data) => api.post("/verification/certificate", data),
};