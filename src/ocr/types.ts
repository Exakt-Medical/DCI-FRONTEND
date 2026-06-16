export type FormFields = {
  mvccControlNo: string;
  ownerName: string;
  address: string;
  makeBrand: string;
  color: string;
  plateNo: string;
  engineNo: string;
  chassisNo: string;
  date: string;
  yearModel: string;
  mvFileNo: string;
  hpgOffice: string;
  purpose: string;
  hpgTechnician: string;
  mvrrNumber: string;
  crNumber: string;
  sbrNo: string;
  acquiredFrom: string;
  tin: string;
  processingOfficer: string;
  clearanceOfficer: string;
  meNumber: string;
  nhqPid: string;
  examinedBy: string;
  notedBy: string;
  vehicleType: string;
  remarks: string;
  engineNoStencilled: string;
  chassisNoStencilled: string;
};

export type OcrWord = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FieldExtractionEntry = {
  label: string;
  candidates: Record<string, string>;
  selected: string;
  valid: boolean;
  source: string;
  confidence: number;
};

export type FieldExtractionMap = Record<keyof FormFields, FieldExtractionEntry>;

export type OcrItem = { text?: string; poly?: number[][] };

export type ParseResult = {
  fields: FormFields;
  extraction: FieldExtractionMap;
  layoutText: string;
};

export const INITIAL_FIELDS: FormFields = {
  mvccControlNo: "",
  ownerName: "",
  address: "",
  makeBrand: "",
  color: "",
  plateNo: "",
  engineNo: "",
  chassisNo: "",
  date: "",
  yearModel: "",
  mvFileNo: "",
  hpgOffice: "",
  purpose: "",
  hpgTechnician: "",
  mvrrNumber: "",
  crNumber: "",
  sbrNo: "",
  acquiredFrom: "",
  tin: "",
  processingOfficer: "",
  clearanceOfficer: "",
  meNumber: "",
  nhqPid: "",
  examinedBy: "",
  notedBy: "",
  vehicleType: "",
  remarks: "",
  engineNoStencilled: "",
  chassisNoStencilled: "",
};

export const EMPTY_EXTRACTION: FieldExtractionMap = {
  mvccControlNo: { label: "MVCC CONTROL NO.", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  ownerName: { label: "OWNER NAME", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  address: { label: "ADDRESS", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  makeBrand: { label: "MAKE / BRAND", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  color:     { label: "COLOR",        candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  plateNo:   { label: "PLATE NO.",    candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  engineNo:  { label: "ENGINE NO.",   candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  chassisNo: { label: "CHASSIS NO.",  candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  date:      { label: "DATE",         candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  yearModel: { label: "YEAR MODEL",   candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  mvFileNo: { label: "MV FILE NO.", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  hpgOffice: { label: "HPG OFFICE", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  purpose: { label: "PURPOSE", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  hpgTechnician: { label: "HPG TECHNICIAN", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  mvrrNumber: { label: "MVRR NUMBER", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  crNumber: { label: "C.R. NUMBER", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  sbrNo: { label: "SBR NO.", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  acquiredFrom: { label: "ACQUIRED FROM / ADDRESS", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  tin: { label: "TIN", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  processingOfficer: { label: "PROCESSING OFFICER", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  clearanceOfficer: { label: "CLEARANCE OFFICER", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  meNumber: { label: "ME# / LTOCC", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  nhqPid: { label: "NHQ-PID/RFU/PFU/CFU", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  examinedBy: { label: "EXAMINED BY", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  notedBy: { label: "NOTED BY", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  vehicleType: { label: "VEHICLE TYPE", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  remarks: { label: "REMARKS", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  engineNoStencilled: { label: "ENGINE NO. (STENCILLED)", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
  chassisNoStencilled: { label: "CHASSIS / FRAME NO. (STENCILLED)", candidates: {}, selected: "", valid: false, source: "none", confidence: 0 },
};
