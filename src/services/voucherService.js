import api from "./api";

export const voucherService = {
  getProducts: () => api.get("/vouchers/products"),
  getInsuranceFees: () => api.get("/vouchers/insurance-fees"),
  getInsuranceFee: (code) => api.get(`/vouchers/insurance-fees/${encodeURIComponent(code)}`),
  purchase: (productId) => api.post("/vouchers/purchase", { productId }),
  getHistory: () => api.get("/vouchers/history"),
  validate: (voucherCode) => api.post("/vouchers/validate", { voucherCode }),
  redeem: (voucherCode) => api.post("/vouchers/redeem", { voucherCode }),
};