export const CLEARANCE_REQUEST_STATUS_STYLES = {
  CERTIFICATE_ISSUED: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  DEFAULT: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  }
};

export const CITIZEN_STEPS = [
  "Select Vehicle",
  "Upload OR/CR",
  "Pay",
  "Verify Vehicle",
  "Issue Certificate",
];

export const AGENT_STEPS = [
  "Select Vehicle",
  "Upload OR/CR",
  "Verify Vehicle",
  "Issue Certificate",
];

export const HPG_STATUS = {
  PENDING: "PENDING_HPG",
  INSPECTION: "UNDER_INSPECTION",
  APPROVED: "HPG_APPROVED",
  REJECTED: "HPG_REJECTED",
};

export const VALIDATION_STATE = {
  IDLE: "IDLE",
  PENDING: "PENDING",
  VALIDATING: "VALIDATING",
  PASSED: "PASSED",
  FAILED: "FAILED",
};

export const getClearanceStatusStyle = (status) =>
  CLEARANCE_REQUEST_STATUS_STYLES[status] ||
  CLEARANCE_REQUEST_STATUS_STYLES.DEFAULT;
