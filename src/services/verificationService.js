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
      insuranceCode: insuranceData.selectedCode,
      policyNumber: insuranceData.policyNumber,
      premiumType: insuranceData.premiumType,
      prescribedPremiumFee: insuranceData.prescribedPremiumFee,
      dst: insuranceData.dst,
      vat: insuranceData.vat,
      lgt: insuranceData.lgt,
      validationFee: insuranceData.validationFee,
      totalAmount: insuranceData.totalAmount,
      voucherCode: voucherCode ?? null,
    }),
};
