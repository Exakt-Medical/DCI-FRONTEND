import api from "./api";

export const paymentsService = {
  createTlpePayment: (request) => api.post("/orders/tlpe", request),
};

export default paymentsService;
