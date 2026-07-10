// ---------------------------------------------------------------------------
// clearanceRequestUtils.js
// Pure functions & constants shared across the clearance-request feature.
// No React imports — safe to use in hooks, utils, and tests.
// ---------------------------------------------------------------------------

import { OCR_STATUS } from "../../../hooks/useOcrForm";

// ── Empty shapes ─────────────────────────────────────────────────────────────

export const emptyVehicle = {
  plateNumber: "",
  mvFileNumber: "",
  engineNumber: "",
  chassisNumber: "",

  makeBrand: "",
  color: "",
  classification: "",
  series: "",
  yearModel: "",
  ownerName: "",
  ownerAddress: "",
  bodyType: "",
};

export const emptyMvc = {
  mvcNo: "",
  issueDate: "",
  engineNo: "",
  chassisNo: "",
  plateNo: "",
  mvFileNo: "",
  color: "",
};

export const emptyMec = {
  engineNoStencilled: "",
  chassisNoStencilled: "",
  plateNo: "",
  color: "",
};

export const emptyOcrUploadState = {
  or:       { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  cr:       { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  mvc:      { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  mec:      { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  agentMvc: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  agentMec: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
};

// ── ID / cert-number helpers ─────────────────────────────────────────────────

export const makeId = () =>
  `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;

export const makeCertificateNo = (index = 0) =>
  `DCI-CERT-${String(Date.now() + index).slice(-8)}`;

// ── Field lists ──────────────────────────────────────────────────────────────

export const OR_EXPECTED_FIELDS = [
  "plateNumber",
  "mvFileNumber",
  "classification",

  "color",
  "yearModel",
  "ownerName",
  "ownerAddress",
];

export const CR_EXPECTED_FIELDS = [
  "engineNumber",
  "chassisNumber",
  "plateNumber",
  "mvFileNumber",

  "makeBrand",
  "color",
  "classification",
  "series",
  "yearModel",
  "ownerName",
  "ownerAddress",
  "bodyType",
];

// ── Vehicle field merging ────────────────────────────────────────────────────

/** Shallow-merges `next` fields into `current`, uppercasing non-blank strings. */
export const mergeVehicleFields = (current = {}, next = {}) => {
  const merged = { ...current };
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (typeof value === "string" && value.trim()) {
      let val = value.trim().toUpperCase();
      if (key === "mvFileNumber" && val.length > 15) {
        val = val.slice(0, 15);
      }
      merged[key] = val;
    }
  });
  return merged;
};

// ── Document completeness helpers ────────────────────────────────────────────

/**
 * Returns true when every key in `expectedKeys` (or all keys) is a
 * non-blank, non-"Extracting..." string in `doc`.
 */
export const isDocumentComplete = (doc, expectedKeys = null) => {
  if (!doc) return false;
  const keysToCheck = expectedKeys || Object.keys(doc);
  return keysToCheck.every(
    (key) =>
      typeof doc[key] === "string" &&
      doc[key].trim() !== "" &&
      doc[key] !== "Extracting..."
  );
};

/** Returns a human-readable message listing missing fields, or null when complete. */
export const getMissingFieldsText = (doc, docName, expectedKeys = null) => {
  if (!doc) return null;
  const keysToCheck = expectedKeys || Object.keys(doc);
  const missing = keysToCheck
    .filter(
      (key) =>
        typeof doc[key] !== "string" ||
        doc[key].trim() === "" ||
        doc[key] === "Extracting..."
    )
    .map((key) =>
      key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
    );

  if (missing.length === 0) return null;
  if (missing.length <= 4) return `Missing in ${docName}: ${missing.join(", ")}`;
  return `Missing ${missing.length} required fields in ${docName}`;
};

// ── MVC / MEC cross-validation ───────────────────────────────────────────────

/** Cross-validates MVCC and MEC data against the server-verified vehicle record.
 *  Returns `{ valid: boolean, reason: string }`.
 */
export const evaluateMvcMecValidation = (
  mvcPayload,
  mecPayload,
  verifiedVehicle = {}
) => {
  const norm = (str) => (str || "").trim().toUpperCase();

  const originalEngine  = norm(verifiedVehicle.engineNumber);
  const originalChassis = norm(verifiedVehicle.chassisNumber);
  const originalPlate   = norm(verifiedVehicle.plateNumber);
  const originalColor   = norm(verifiedVehicle.color);
  const originalMvFileNo = norm(verifiedVehicle.mvFileNumber || verifiedVehicle.mvFileNo);
  const originalStatus  = norm(verifiedVehicle.verificationStatus);

  if (originalStatus !== "VERIFIED" && originalStatus !== "COMPLETED" && originalStatus !== "HPG_VERIFIED") {
    return {
      valid: false,
      reason: `DCI validation failed: Verification status is "${originalStatus || "UNKNOWN"}". It must be HPG_VERIFIED to proceed.`,
    };
  }

  const mvcNo      = norm(mvcPayload.mvcNo || mvcPayload.mvcNumber || mvcPayload.mvccNumber);
  const mvcIssueDate = norm(mvcPayload.issueDate);
  const mvcEngine  = norm(mvcPayload.engineNo  || mvcPayload.engineNumber);
  const mvcChassis = norm(mvcPayload.chassisNo || mvcPayload.chassisNumber);
  const mvcPlate   = norm(mvcPayload.plateNo   || mvcPayload.plateNumber);
  const mvcColor   = norm(mvcPayload.color);

  const mecEngine  = norm(mecPayload.engineNoStencilled  || mecPayload.engineNo  || mecPayload.engineNumber);
  const mecChassis = norm(mecPayload.chassisNoStencilled || mecPayload.chassisNo || mecPayload.chassisNumber);
  const mecPlate   = norm(mecPayload.plateNo || mecPayload.plateNumber);
  const mecColor   = norm(mecPayload.color);

  const mvFileNo = norm(mvcPayload.mvFileNo);

  // Presence
  if (!mvcNo)        return { valid: false, reason: "Missing MVCC Number in MVCC.", mismatchedFields: ["mvccControlNo"] };
  if (!mvcIssueDate) return { valid: false, reason: "Missing Issue Date in MVCC.", mismatchedFields: ["mvccDateIssued"] };
  if (!mvcEngine)    return { valid: false, reason: "Missing Engine Number in MVCC.", mismatchedFields: ["engineNo"] };
  if (!mvcChassis)   return { valid: false, reason: "Missing Chassis Number in MVCC.", mismatchedFields: ["chassisNo"] };
  if (!mvcPlate && !mvFileNo) return { valid: false, reason: "Missing Plate Number or MV File No in MVCC.", mismatchedFields: ["plateNo", "mvFileNo"] };
  if (!mvcColor)     return { valid: false, reason: "Missing Color in MVCC.", mismatchedFields: ["color"] };
  if (!mecEngine)    return { valid: false, reason: "Missing Engine Number in MEC.", mismatchedFields: ["mecEngineNo"] };
  if (!mecChassis)   return { valid: false, reason: "Missing Chassis Number in MEC.", mismatchedFields: ["mecChassisNo"] };
  if (!mecPlate && !mvFileNo) return { valid: false, reason: "Missing Plate Number in MEC.", mismatchedFields: ["mecPlateNo"] };
  if (!mecColor)     return { valid: false, reason: "Missing Color in MEC.", mismatchedFields: ["mecColor"] };

  const mismatchedFields = [];
  let reason = "";

  // Document vs. verified vehicle
  if (originalEngine) {
    if (mvcEngine !== originalEngine) { mismatchedFields.push("engineNo"); if (!reason) reason = `MVCC Engine Number (${mvcEngine}) does not match verified Engine Number (${originalEngine}).`; }
    if (mecEngine !== originalEngine) { mismatchedFields.push("mecEngineNo"); if (!reason) reason = `MEC Engine Number (${mecEngine}) does not match verified Engine Number (${originalEngine}).`; }
  }
  if (originalChassis) {
    if (mvcChassis !== originalChassis) { mismatchedFields.push("chassisNo"); if (!reason) reason = `MVCC Chassis Number (${mvcChassis}) does not match verified Chassis Number (${originalChassis}).`; }
    if (mecChassis !== originalChassis) { mismatchedFields.push("mecChassisNo"); if (!reason) reason = `MEC Chassis Number (${mecChassis}) does not match verified Chassis Number (${originalChassis}).`; }
  }
  if (originalPlate) {
    if (mvcPlate !== originalPlate) { mismatchedFields.push("plateNo"); if (!reason) reason = `MVCC Plate Number (${mvcPlate}) does not match verified Plate Number (${originalPlate}).`; }
    if (mecPlate !== originalPlate) { mismatchedFields.push("mecPlateNo"); if (!reason) reason = `MEC Plate Number (${mecPlate}) does not match verified Plate Number (${originalPlate}).`; }
  }
  if (originalColor) {
    if (mvcColor !== originalColor) { mismatchedFields.push("color"); if (!reason) reason = `MVCC Color (${mvcColor}) does not match verified Color (${originalColor}).`; }
    if (mecColor !== originalColor) { mismatchedFields.push("mecColor"); if (!reason) reason = `MEC Color (${mecColor}) does not match verified Color (${originalColor}).`; }
  }
  if (originalMvFileNo) {
    if (mvFileNo && mvFileNo !== originalMvFileNo) { mismatchedFields.push("mvFileNo"); if (!reason) reason = `MVCC MV File No (${mvFileNo}) does not match verified MV File No (${originalMvFileNo}).`; }
  }

  // MVCC vs MEC consistency
  if (mvcEngine  !== mecEngine)  { mismatchedFields.push("engineNo"); mismatchedFields.push("mecEngineNo"); if (!reason) reason = `Engine Numbers do not match: MVCC (${mvcEngine}) vs MEC (${mecEngine}).`; }
  if (mvcChassis !== mecChassis) { mismatchedFields.push("chassisNo"); mismatchedFields.push("mecChassisNo"); if (!reason) reason = `Chassis Numbers do not match: MVCC (${mvcChassis}) vs MEC (${mecChassis}).`; }
  if (mvcPlate   !== mecPlate)   { mismatchedFields.push("plateNo"); mismatchedFields.push("mecPlateNo"); if (!reason) reason = `Plate Numbers do not match: MVCC (${mvcPlate}) vs MEC (${mecPlate}).`; }
  if (mvcColor   !== mecColor)   { mismatchedFields.push("color"); mismatchedFields.push("mecColor"); if (!reason) reason = `Colors do not match: MVCC (${mvcColor}) vs MEC (${mecColor}).`; }

  if (mismatchedFields.length > 0) {
    return { valid: false, reason, mismatchedFields };
  }

  return { valid: true, reason: "Validated by DCI portal." };
};
