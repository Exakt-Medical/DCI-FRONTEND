import api from "./api";

export const verificationService = {
  // STEP 1 — POST /api/v1/vvip/verify
  verify: (payload) =>
    api.post("/v1/vvip/verify", {
      mvFileNumber: payload.mvFileNumber,
      plateNumber: payload.plateNumber,
      engineNumber: payload.engineNumber,
      chassisNumber: payload.chassisNumber,
    }),

  // STEP 2 — POST /api/v1/vvip/{verificationId}/confirm
  confirm: (verificationId, { insuranceData, voucherCode }) =>
    api.post(`/v1/vvip/${verificationId}/confirm`, {
      premiumType: insuranceData.premiumType,
      voucherCode: voucherCode ?? null,
    }),

  getByCertNo: (certNo) => api.get(`/v1/vvip/certificate/${certNo}`),
};
