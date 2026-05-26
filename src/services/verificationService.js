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
  confirm: (verificationId) => api.post(`/v1/vvip/${verificationId}/confirm`),

  // Optional preview — no record saved
  lookup: (payload) =>
    api.post("/api/v1/vvip/lookup", {
      mvFileNumber: payload.mvFileNumber || payload.mvFileNo,
      plateNumber: payload.plateNumber || payload.plateNo,
      engineNumber: payload.engineNumber || payload.engineNo,
      chassisNumber: payload.chassisNumber || payload.chassisNo,
    }),
};
