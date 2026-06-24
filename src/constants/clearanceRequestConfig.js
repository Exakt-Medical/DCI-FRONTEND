export const CLEARANCE_REQUEST_STATUS_STYLES = {
  MVC_MEC_UPLOADED: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
  MVC_MEC_VALIDATION_PENDING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  MVC_MEC_VALIDATED: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  HPG_VERIFICATION: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  CERTIFICATE_ISSUED: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

export const CITIZEN_STEPS = [
  "Select Vehicle",
  "Upload OR/CR",
  "Pay",
  "Go To HPG",
  "Upload MVCC/MEC",
  "Issue Certificate",
];

export const AGENT_STEPS = [
  "Upload OR/CR",
  "HPG Portal",
  "Upload MVCC/MEC",
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
  CLEARANCE_REQUEST_STATUS_STYLES.MVC_MEC_UPLOADED;
