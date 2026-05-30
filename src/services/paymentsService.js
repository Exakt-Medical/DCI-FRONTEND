import api from "./api";

export const paymentsService = {
  createTlpePayment: (request) => api.post("/payments/tlpe", request),
  savePayment: (request) => api.post("/add", request),
};

export default paymentsService;
