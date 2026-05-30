import api from "./api";

export const paymentsService = {
  createTlpePayment: (request) => api.post("/payments/tlpe", request),
};

export default paymentsService;
