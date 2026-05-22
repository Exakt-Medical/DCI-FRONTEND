import api from "./api";

export const verificationService = {
  lookup: (data) =>
    api.post("/v1/vvip/lookup", {
      mvFileNumber: data.mvFileNo,
      plateNumber: data.plateNo,
      engineNumber: data.engineNo,
      chassisNumber: data.chassisNo,
    }),

  verify: (data) =>
    api.post("/v1/vvip/verify", {
      mvFileNumber: data.mvFileNumber,
      plateNumber: data.plateNumber,
      engineNumber: data.engineNumber,
      chassisNumber: data.chassisNumber,
    }),

  downloadCertificate: (certNo) =>
    api.get(`/v1/vvip/certificates/${certNo}/download`, {
      responseType: "blob",
    }),
};
