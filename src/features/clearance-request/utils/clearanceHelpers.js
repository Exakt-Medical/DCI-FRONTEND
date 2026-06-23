import { OCR_STATUS } from "../../../hooks/useOcrForm";

export const emptyVehicle = {
  plateNumber: "",
  mvFileNumber: "",
  classification: "",
  vehicleType: "",
  fuelType: "",
  engineNumber: "",
  chassisNumber: "",
  make: "",
  series: "",
  yearModel: "",
  color: "",
  ownerName: "",
  ownerAddress: "",
};

export const emptyMvc = {
  mvccNo: "",
  mvccIssueDate: "",
  mvccStatus: "",
  remarks: "",
  mvFileNo: "",
  makeType: "",
  ownerName: "",
  ownerAddress: "",
  ownerContact: "",
  engineNo: "",
  chassisNo: "",
  plateNo: "",
};

export const emptyMec = {
  engineNoStencilled: "",
  chassisNoStencilled: "",
  plateNo: "",
  color: "",
  makeType: "",
};

export const makeId = () =>
  `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;
export const makeCertificateNo = (index = 0) =>
  `DCI-CERT-${String(Date.now() + index).slice(-8)}`;

export const emptyOcrUploadState = {
  or: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  cr: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  mvc: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  mec: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  agentMvc: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  agentMec: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
};

export const mergeVehicleFields = (current = {}, next = {}) => {
  const merged = { ...current };
  Object.entries(next).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      merged[key] = value.trim().toUpperCase();
    }
  });
  return merged;
};

export const OR_EXPECTED_FIELDS = [
  "plateNumber",
  "mvFileNumber",
  "classification",
  "vehicleType",
  "fuelType",
  "yearModel",
  "color",
  "ownerName",
  "ownerAddress",
];

export const CR_EXPECTED_FIELDS = [
  "plateNumber",
  "mvFileNumber",
  "engineNumber",
  "chassisNumber",
  "make",
  "series",
  "yearModel",
  "color",
  "ownerName",
  "ownerAddress",
];

export const isDocumentComplete = (doc, expectedKeys = null) => {
  if (!doc) return false;
  const keysToCheck = expectedKeys || Object.keys(doc);
  return keysToCheck.every(
    (key) => typeof doc[key] === "string" && doc[key].trim() !== "" && doc[key] !== "Extracting..."
  );
};

export const getMissingFieldsText = (doc, docName, expectedKeys = null) => {
  if (!doc) return null;
  const keysToCheck = expectedKeys || Object.keys(doc);
  const missing = keysToCheck
    .filter((key) => typeof doc[key] !== "string" || doc[key].trim() === "" || doc[key] === "Extracting...")
    .map((key) => key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()));
  
  if (missing.length === 0) return null;
  if (missing.length <= 4) return `Missing in ${docName}: ${missing.join(", ")}`;
  return `Missing ${missing.length} required fields in ${docName}`;
};

export const evaluateMvcMecValidation = (mvcPayload, mecPayload, verifiedVehicle = {}) => {
  const norm = (str) => (str || "").trim().toUpperCase();

  const originalEngine = norm(verifiedVehicle.engineNumber);
  const originalChassis = norm(verifiedVehicle.chassisNumber);
  const originalPlate = norm(verifiedVehicle.plateNumber);
  const originalColor = norm(verifiedVehicle.color);
  const originalStatus = norm(verifiedVehicle.verificationStatus);

  // 0. Verification status check
  if (originalStatus !== "VERIFIED" && originalStatus !== "COMPLETED") {
    return { valid: false, reason: `DCI validation failed: Verification status is "${originalStatus || "UNKNOWN"}". It must be VERIFIED to proceed.` };
  }

  const mvcEngine = norm(mvcPayload.engineNo || mvcPayload.engineNumber);
  const mvcChassis = norm(mvcPayload.chassisNo || mvcPayload.chassisNumber);
  const mvcPlate = norm(mvcPayload.plateNo || mvcPayload.plateNumber);

  const mecEngine = norm(mecPayload.engineNoStencilled || mecPayload.engineNo || mecPayload.engineNumber);
  const mecChassis = norm(mecPayload.chassisNoStencilled || mecPayload.chassisNo || mecPayload.chassisNumber);
  const mecPlate = norm(mecPayload.plateNo || mecPayload.plateNumber);
  const mecColor = norm(mecPayload.color);

  // 1. Basic presence checks
  if (!mvcEngine) return { valid: false, reason: "Missing Engine Number in MVCC." };
  if (!mvcChassis) return { valid: false, reason: "Missing Chassis Number in MVCC." };
  if (!mvcPlate) return { valid: false, reason: "Missing Plate Number in MVCC." };

  if (!mecEngine) return { valid: false, reason: "Missing Engine Number in MEC." };
  if (!mecChassis) return { valid: false, reason: "Missing Chassis Number in MEC." };
  if (!mecPlate) return { valid: false, reason: "Missing Plate Number in MEC." };
  if (!mecColor) return { valid: false, reason: "Missing Color in MEC." };

  // 2. Mismatch checks between documents and verified vehicle
  if (originalEngine) {
    if (mvcEngine !== originalEngine) {
      return { valid: false, reason: `MVCC Engine Number (${mvcEngine}) does not match verified Engine Number (${originalEngine}).` };
    }
    if (mecEngine !== originalEngine) {
      return { valid: false, reason: `MEC Engine Number (${mecEngine}) does not match verified Engine Number (${originalEngine}).` };
    }
  }
  if (originalChassis) {
    if (mvcChassis !== originalChassis) {
      return { valid: false, reason: `MVCC Chassis Number (${mvcChassis}) does not match verified Chassis Number (${originalChassis}).` };
    }
    if (mecChassis !== originalChassis) {
      return { valid: false, reason: `MEC Chassis Number (${mecChassis}) does not match verified Chassis Number (${originalChassis}).` };
    }
  }
  if (originalPlate) {
    if (mvcPlate !== originalPlate) {
      return { valid: false, reason: `MVCC Plate Number (${mvcPlate}) does not match verified Plate Number (${originalPlate}).` };
    }
    if (mecPlate !== originalPlate) {
      return { valid: false, reason: `MEC Plate Number (${mecPlate}) does not match verified Plate Number (${originalPlate}).` };
    }
  }

  // 3. Color validation checks
  if (originalColor) {
    if (mecColor !== originalColor) {
      return { valid: false, reason: `MEC Color (${mecColor}) does not match verified Color (${originalColor}).` };
    }
  }

  // Double check consistency between MVCC and MEC directly
  if (mvcEngine !== mecEngine) {
    return { valid: false, reason: `Engine Numbers do not match: MVCC (${mvcEngine}) vs MEC (${mecEngine}).` };
  }
  if (mvcChassis !== mecChassis) {
    return { valid: false, reason: `Chassis Numbers do not match: MVCC (${mvcChassis}) vs MEC (${mecChassis}).` };
  }
  if (mvcPlate !== mecPlate) {
    return { valid: false, reason: `Plate Numbers do not match: MVCC (${mvcPlate}) vs MEC (${mecPlate}).` };
  }

  return { valid: true, reason: "Validated by DCI portal." };
};
