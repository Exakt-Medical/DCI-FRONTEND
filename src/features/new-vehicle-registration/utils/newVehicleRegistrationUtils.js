export const VEHICLE_TYPE = {
  MC: "MC",
  MV: "MV",
};

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPE.MC]: "Motorcycle",
  [VEHICLE_TYPE.MV]: "Motor Vehicle",
};

export const NEW_REG_DOC_TYPES = {
  SALES_INVOICE: "SALES_INVOICE",
  CSR: "CSR",
  CTPL: "CTPL",
  STENCIL: "STENCIL",
};

export const DOC_TYPE_LABELS = {
  [NEW_REG_DOC_TYPES.SALES_INVOICE]: "Sales Invoice",
  [NEW_REG_DOC_TYPES.CSR]: "Certificate of Stock Report (CSR)",
  [NEW_REG_DOC_TYPES.CTPL]: "Compulsory Third Party Liability (CTPL)",
  [NEW_REG_DOC_TYPES.STENCIL]: "Stencil / MV Plate Detail",
};

export const DOC_TYPE_ICONS = {
  [NEW_REG_DOC_TYPES.SALES_INVOICE]: "Receipt",
  [NEW_REG_DOC_TYPES.CSR]: "FileText",
  [NEW_REG_DOC_TYPES.CTPL]: "Shield",
  [NEW_REG_DOC_TYPES.STENCIL]: "Car",
};

export const CITIZEN_REG_STEPS = [
  "Register Vehicle",
  "Pay Registration Fee",
  "Verify Vehicle",
  "Issue DCI Certificate",
];

export const AGENT_REG_STEPS = [
  "Register Vehicle",
  "Transaction Code",
  "Verify Vehicle",
  "Issue DCI Certificate",
];

export const NEW_REG_STATUS_STYLES = {
  DOCUMENTS_UPLOADED: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    dot: "bg-teal-500",
  },
  REGISTRATION_PAID: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  VEHICLE_VERIFIED: {
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  CERTIFICATE_ISSUED: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
};

export const VALIDATION_STATE = {
  IDLE: "IDLE",
  PENDING: "PENDING",
  VALIDATING: "VALIDATING",
  PASSED: "PASSED",
  FAILED: "FAILED",
};

export const emptyVehicleInfo = {
  plateNumber: "",
  mvFileNumber: "",
  engineNumber: "",
  chassisNumber: "",
  make: "",
  series: "",
  yearModel: "",
  color: "",
  bodyType: "",
  grossWeight: "",
  netCapacity: "",
  fuelType: "",
  pistonDisplacement: "",
  noOfCylinders: "",
  region: "",
  expiryDate: "",
};

export const emptySalesInvoice = {
  invoiceNo: "",
  date: "",
  sellerName: "",
  buyerName: "",
  vehicleMake: "",
  vehicleSeries: "",
  vehicleYearModel: "",
  amount: "",
};

export const emptyCsr = {
  csrNo: "",
  dateIssued: "",
  dealerName: "",
  mvFileNumber: "",
  plateNumber: "",
  engineNumber: "",
  chassisNumber: "",
  make: "",
  series: "",
  yearModel: "",
  color: "",
};

export const emptyCtpl = {
  policyNo: "",
  insuredName: "",
  plateNumber: "",
  engineNumber: "",
  chassisNumber: "",
  make: "",
  yearModel: "",
  effectiveDate: "",
  expiryDate: "",
  insuranceCompany: "",
};

export const emptyStencil = {
  plateNumber: "",
  mvFileNumber: "",
  engineNumber: "",
  chassisNumber: "",
  make: "",
  series: "",
  yearModel: "",
  color: "",
  grossWeight: "",
  netCapacity: "",
};

export const emptyRegDocuments = {
  [NEW_REG_DOC_TYPES.SALES_INVOICE]: emptySalesInvoice,
  [NEW_REG_DOC_TYPES.CSR]: emptyCsr,
  [NEW_REG_DOC_TYPES.CTPL]: emptyCtpl,
  [NEW_REG_DOC_TYPES.STENCIL]: emptyStencil,
};

export const emptyRegistrationRequest = {
  vehicleType: VEHICLE_TYPE.MC,
  ownerName: "",
  ownerAddress: "",
  documents: { ...emptyRegDocuments },
  paymentDone: false,
  transactionCode: "",
  verificationPassed: false,
  certificateNo: "",
};

export const getDocUploadConfig = (docType) => {
  const configs = {
    [NEW_REG_DOC_TYPES.SALES_INVOICE]: {
      label: DOC_TYPE_LABELS.SALES_INVOICE,
      expectedFields: ["invoiceNo", "buyerName", "vehicleMake", "amount"],
      fieldLabels: {
        invoiceNo: "Invoice No.",
        date: "Date",
        sellerName: "Seller Name",
        buyerName: "Buyer Name",
        vehicleMake: "Vehicle Make",
        vehicleSeries: "Vehicle Series",
        vehicleYearModel: "Year Model",
        amount: "Amount",
      },
    },
    [NEW_REG_DOC_TYPES.CSR]: {
      label: DOC_TYPE_LABELS.CSR,
      expectedFields: ["csrNo", "mvFileNumber", "plateNumber", "make"],
      fieldLabels: {
        csrNo: "CSR No.",
        dateIssued: "Date Issued",
        dealerName: "Dealer Name",
        mvFileNumber: "MV File No.",
        plateNumber: "Plate No.",
        engineNumber: "Engine No.",
        chassisNumber: "Chassis No.",
        make: "Make",
        series: "Series",
        yearModel: "Year Model",
        color: "Color",
      },
    },
    [NEW_REG_DOC_TYPES.CTPL]: {
      label: DOC_TYPE_LABELS.CTPL,
      expectedFields: ["policyNo", "insuredName", "plateNumber", "make"],
      fieldLabels: {
        policyNo: "Policy No.",
        insuredName: "Insured Name",
        plateNumber: "Plate No.",
        engineNumber: "Engine No.",
        chassisNumber: "Chassis No.",
        make: "Make",
        yearModel: "Year Model",
        effectiveDate: "Effective Date",
        expiryDate: "Expiry Date",
        insuranceCompany: "Insurance Company",
      },
    },
    [NEW_REG_DOC_TYPES.STENCIL]: {
      label: DOC_TYPE_LABELS.STENCIL,
      expectedFields: ["plateNumber", "mvFileNumber", "engineNumber", "chassisNumber"],
      fieldLabels: {
        plateNumber: "Plate No.",
        mvFileNumber: "MV File No.",
        engineNumber: "Engine No.",
        chassisNumber: "Chassis No.",
        make: "Make",
        series: "Series",
        yearModel: "Year Model",
        color: "Color",
        grossWeight: "Gross Weight (kg)",
        netCapacity: "Net Capacity (cc)",
      },
    },
  };
  return configs[docType] || null;
};

export const getDocMockOcrData = (docType) => {
  const mockData = {
    [NEW_REG_DOC_TYPES.SALES_INVOICE]: {
      invoiceNo: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
      date: new Date().toISOString().split("T")[0],
      sellerName: "Quezon City Motor Sales Inc.",
      buyerName: "JUAN T. DELA CRUZ",
      vehicleMake: "TOYOTA",
      vehicleSeries: "HIACE",
      vehicleYearModel: "2025",
      amount: "1,250,000.00",
    },
    [NEW_REG_DOC_TYPES.CSR]: {
      csrNo: `CSR-${Math.floor(Math.random() * 900000) + 100000}`,
      dateIssued: new Date().toISOString().split("T")[0],
      dealerName: "Quezon City Motor Sales Inc.",
      mvFileNumber: `MV-${Math.floor(Math.random() * 90000) + 10000}`,
      plateNumber: `ABC${Math.floor(Math.random() * 9000) + 1000}`,
      engineNumber: `ENG-${Math.floor(Math.random() * 900000) + 100000}`,
      chassisNumber: `CHS-${Math.floor(Math.random() * 900000) + 100000}`,
      make: "TOYOTA",
      series: "HIACE",
      yearModel: "2025",
      color: "WHITE",
    },
    [NEW_REG_DOC_TYPES.CTPL]: {
      policyNo: `CTPL-${Math.floor(Math.random() * 90000) + 10000}`,
      insuredName: "JUAN T. DELA CRUZ",
      plateNumber: `ABC${Math.floor(Math.random() * 9000) + 1000}`,
      engineNumber: `ENG-${Math.floor(Math.random() * 900000) + 100000}`,
      chassisNumber: `CHS-${Math.floor(Math.random() * 900000) + 100000}`,
      make: "TOYOTA",
      yearModel: "2025",
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      insuranceCompany: "Standard Insurance Co.",
    },
    [NEW_REG_DOC_TYPES.STENCIL]: {
      plateNumber: `ABC${Math.floor(Math.random() * 9000) + 1000}`,
      mvFileNumber: `MV-${Math.floor(Math.random() * 90000) + 10000}`,
      engineNumber: `ENG-${Math.floor(Math.random() * 900000) + 100000}`,
      chassisNumber: `CHS-${Math.floor(Math.random() * 900000) + 100000}`,
      make: "TOYOTA",
      series: "HIACE",
      yearModel: "2025",
      color: "WHITE",
      grossWeight: "1980",
      netCapacity: "1998",
    },
  };
  return mockData[docType] || {};
};

export const isDocumentComplete = (docData, docType) => {
  const config = getDocUploadConfig(docType);
  if (!config) return false;
  return config.expectedFields.every((field) => {
    const val = docData[field];
    return val && String(val).trim().length > 0;
  });
};

export const getMissingFieldsText = (docData, docType) => {
  const config = getDocUploadConfig(docType);
  if (!config) return "Unknown document type";
  const missing = config.expectedFields.filter((f) => {
    const val = docData[f];
    return !val || String(val).trim().length === 0;
  });
  if (missing.length === 0) return "";
  const labels = missing.map((f) => config.fieldLabels[f] || f);
  return `Missing: ${labels.join(", ")}`;
};

export const isAllDocumentsComplete = (documents) => {
  const types = Object.values(NEW_REG_DOC_TYPES);
  return types.every((t) => isDocumentComplete(documents[t], t));
};

export function generateRegRefNumber() {
  const pad = (n) => String(n).padStart(4, "0");
  const now = new Date();
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = pad(Math.floor(Math.random() * 9000) + 1000);
  return `REG-${date}-${rand}`;
}
