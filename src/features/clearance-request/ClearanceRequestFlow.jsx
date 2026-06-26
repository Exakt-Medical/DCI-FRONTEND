import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  Upload,
  FileText,
  CreditCard,
  Ticket,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  X,
} from "lucide-react";
import { VOUCHER_INVENTORY_STATUS } from "../../constants/voucherInventoryStatus";
import {
  AGENT_STEPS,
  CITIZEN_STEPS,
  HPG_STATUS,
  VALIDATION_STATE,
} from "../../constants/clearanceRequestConfig";
import { voucherInventoryService } from "../../services/voucherInventoryService";
import {
  MvcMecUploadCard,
  VehicleDocumentUploadCard,
} from "./components/FlowFormCards";
import { CertificateActionButtons } from "./components/CertificateActionButtons";
import {
  CLEARANCE_OCR_DOCUMENT_TYPE,
  extractClearanceDocumentData,
  formatOcrHint,
  OCR_STATUS,
} from "../../hooks/useOcrForm";
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";
import paymentsService from "../../services/paymentsService";
import merchantCallbackService from "../../services/merchantCallbackService";
import { transferVoucherService } from "../../services/transferVoucherService";

const emptyVehicle = {
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

const emptyMvc = {
  mvcNo: "",
  issueDate: "",
  engineNo: "",
  chassisNo: "",
  plateNo: "",
  mvFileNo: "",
  color: "",
};

const emptyMec = {
  engineNoStencilled: "",
  chassisNoStencilled: "",
  plateNo: "",
  color: "",
};

const makeId = () =>
  `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;
const makeCertificateNo = (index = 0) =>
  `DCI-CERT-${String(Date.now() + index).slice(-8)}`;

const emptyOcrUploadState = {
  or: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  cr: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  mvc: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  mec: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  agentMvc: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
  agentMec: { status: OCR_STATUS.IDLE, confidence: 0, error: "" },
};

const mergeVehicleFields = (current = {}, next = {}) => {
  const merged = { ...current };
  Object.entries(next).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      merged[key] = value.trim().toUpperCase();
    }
  });
  return merged;
};

const OR_EXPECTED_FIELDS = [
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

const CR_EXPECTED_FIELDS = [
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

const isDocumentComplete = (doc, expectedKeys = null) => {
  if (!doc) return false;
  const keysToCheck = expectedKeys || Object.keys(doc);
  return keysToCheck.every(
    (key) => typeof doc[key] === "string" && doc[key].trim() !== "" && doc[key] !== "Extracting..."
  );
};

const getMissingFieldsText = (doc, docName, expectedKeys = null) => {
  if (!doc) return null;
  const keysToCheck = expectedKeys || Object.keys(doc);
  const missing = keysToCheck
    .filter((key) => typeof doc[key] !== "string" || doc[key].trim() === "" || doc[key] === "Extracting...")
    .map((key) => key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()));
  
  if (missing.length === 0) return null;
  if (missing.length <= 4) return `Missing in ${docName}: ${missing.join(", ")}`;
  return `Missing ${missing.length} required fields in ${docName}`;
};

const evaluateMvcMecValidation = (mvcPayload, mecPayload, verifiedVehicle = {}) => {
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

  const mvcNo = norm(mvcPayload.mvcNo || mvcPayload.mvcNumber || mvcPayload.mvccNumber);
  const mvcIssueDate = norm(mvcPayload.issueDate);
  const mvcEngine = norm(mvcPayload.engineNo || mvcPayload.engineNumber);
  const mvcChassis = norm(mvcPayload.chassisNo || mvcPayload.chassisNumber);
  const mvcPlate = norm(mvcPayload.plateNo || mvcPayload.plateNumber);
  const mvcColor = norm(mvcPayload.color);

  const mecEngine = norm(mecPayload.engineNoStencilled || mecPayload.engineNo || mecPayload.engineNumber);
  const mecChassis = norm(mecPayload.chassisNoStencilled || mecPayload.chassisNo || mecPayload.chassisNumber);
  const mecPlate = norm(mecPayload.plateNo || mecPayload.plateNumber);
  const mecColor = norm(mecPayload.color);

  // 1. Basic presence checks
  if (!mvcNo) return { valid: false, reason: "Missing MVCC Number in MVCC." };
  if (!mvcIssueDate) return { valid: false, reason: "Missing Issue Date in MVCC." };
  if (!mvcEngine) return { valid: false, reason: "Missing Engine Number in MVCC." };
  if (!mvcChassis) return { valid: false, reason: "Missing Chassis Number in MVCC." };
  if (!mvcPlate) return { valid: false, reason: "Missing Plate Number in MVCC." };
  if (!mvcColor) return { valid: false, reason: "Missing Color in MVCC." };

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
    if (mvcColor !== originalColor) {
      return { valid: false, reason: `MVCC Color (${mvcColor}) does not match verified Color (${originalColor}).` };
    }
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
  if (mvcColor !== mecColor) {
    return { valid: false, reason: `Colors do not match: MVCC (${mvcColor}) vs MEC (${mecColor}).` };
  }

  return { valid: true, reason: "Validated by DCI portal." };
};

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRequest } from "../../context/RequestContext";
import { fetchMyRequests } from "../../services/certificateRequestService";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";
import { ticketService } from "../../services/ticketService";

export const ClearanceRequestFlow = () => {
  const { error: showError, success: showSuccessAlert } = useAlert();
  const { role } = useAuth();
  const isAgent = role === "agent_fixer";
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const {
    voucherInventory: contextVoucherInventory,
    setVoucherInventory: contextSetVoucherInventory,
    handleRequestSave: onSaveRequest,
    handleClearanceRequestComplete: onComplete,
  } = useRequest();

  const [localVoucherInventory, setLocalVoucherInventory] = useState(() => {
    if (role !== "agent_fixer") return [];
    const saved = localStorage.getItem("mock_agent_voucher_inventory");
    if (saved) return JSON.parse(saved);
    const { rows } = voucherInventoryService.createPurchasedVouchers(10, { role: "agent_fixer" });
    localStorage.setItem("mock_agent_voucher_inventory", JSON.stringify(rows));
    return rows;
  });

  const voucherInventory = isAgent ? localVoucherInventory : contextVoucherInventory;
  const setVoucherInventory = (updater) => {
    if (isAgent) {
      setLocalVoucherInventory((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        localStorage.setItem("mock_agent_voucher_inventory", JSON.stringify(next));
        return next;
      });
    } else {
      contextSetVoucherInventory(updater);
    }
  };

  const [availableVoucherRequests, setAvailableVoucherRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const loadAllRequests = async () => {
    try {
      setIsLoadingRequests(true);
      if (isAgent) {
        const data = JSON.parse(localStorage.getItem("mock_agent_requests") || "[]");
        setAvailableVoucherRequests(data);
      } else {
        const data = await fetchMyRequests();
        setAvailableVoucherRequests(data || []);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, [isAgent]);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const idFromQuery = searchParams.get("id") || "";
  const paymentTransactionId =
    searchParams.get("transaction_id") ||
    searchParams.get("transactionId") ||
    "";
  const selectedRequest =
    location.state?.request ||
    availableVoucherRequests.find(
      (item) => String(item.id) === String(idFromQuery),
    ) ||
    null;
  const onCancel = () => navigate("/dci-access/requests");
  // const isAgent = role === "agent_fixer";
  const flowSteps = isAgent ? AGENT_STEPS : CITIZEN_STEPS;
  const maxStep = flowSteps.length;
  const handledPaymentTransactionRef = useRef("");
  const hasSyncedStep = useRef(false);
  const [id, setId] = useState(
    () => selectedRequest?.id || idFromQuery || "",
  );
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const queryStep = Number(params.get("step"));
    if (queryStep && queryStep > 0) {
      return Math.min(queryStep, maxStep);
    }
    const txnId = params.get("transaction_id") || params.get("transactionId");
    if (txnId) {
      return 3;
    }
    const storedStep = selectedRequest?.currentStep || 1;
    return Math.min(storedStep, maxStep);
  });

  useEffect(() => {
    hasSyncedStep.current = false;
  }, [id]);

  useEffect(() => {
    if (id) {
      const params = new URLSearchParams(location.search);
      let changed = false;
      if (params.get("id") !== String(id)) {
        params.set("id", id);
        changed = true;
      }
      if (params.get("step") !== String(step)) {
        params.set("step", String(step));
        changed = true;
      }
      if (changed) {
        navigate({ search: params.toString() }, { replace: true });
      }
    }
  }, [id, step, location.search, navigate]);
  const [requestStatus, setRequestStatus] = useState(
    () => selectedRequest?.status || "DRAFT",
  );
  const [dateCreated] = useState(
    () =>
      selectedRequest?.dateCreated || new Date().toISOString().split("T")[0],
  );
  const [vehicleOption, setVehicleOption] = useState(
    () => selectedRequest?.vehicleOption || "",
  );

  const [orPreview, setOrPreview] = useState(
    selectedRequest?.orPreview || null,
  );
  const [orNumber, setOrNumber] = useState(selectedRequest?.orNumber || "");
  const [orCr, setOrCr] = useState(() => selectedRequest?.orCr || emptyVehicle);

  const [crPreview, setCrPreview] = useState(
    selectedRequest?.crPreview || null,
  );
  const [crNumber, setCrNumber] = useState(selectedRequest?.crNumber || "");
  const [crCr, setCrCr] = useState(() => selectedRequest?.crCr || emptyVehicle);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [isVerifyingDocuments, setIsVerifyingDocuments] = useState(false);
  const [paymentDone, setPaymentDone] = useState(
    Boolean(isAgent || selectedRequest?.paymentDone),
  );

  const [issuingVoucher, setIssuingVoucher] = useState(false);
  const [fetchVoucherFailed, setFetchVoucherFailed] = useState(false);
  const [voucherCode, setVoucherCode] = useState(
    selectedRequest?.voucherCode || selectedRequest?.voucherReferenceNo || "",
  );
  const [voucherAssigned, setVoucherAssigned] = useState(
    Boolean(
      selectedRequest?.voucherAssigned ||
      selectedRequest?.voucherCode ||
      selectedRequest?.voucherReferenceNo,
    ),
  );

  const [hpgVerified, setHpgVerified] = useState(
    Boolean(selectedRequest?.hpgVerified),
  );

  const [mvcPreview, setMvcPreview] = useState(
    selectedRequest?.mvcPreview || null,
  );
  const [mvcFileName, setMvcFileName] = useState(
    selectedRequest?.mvcFileName || "",
  );
  const [mvcData, setMvcData] = useState(
    () => selectedRequest?.mvcData || emptyMvc,
  );

  const [mecPreview, setMecPreview] = useState(
    selectedRequest?.mecPreview || null,
  );
  const [mecFileName, setMecFileName] = useState(
    selectedRequest?.mecFileName || "",
  );
  const [mecData, setMecData] = useState(
    () => selectedRequest?.mecData || emptyMec,
  );

  const [agentMvcPreview, setAgentMvcPreview] = useState(null);
  const [agentMvcFileName, setAgentMvcFileName] = useState("");
  const [agentMvcData, setAgentMvcData] = useState(emptyMvc);
  const [agentMecPreview, setAgentMecPreview] = useState(null);
  const [agentMecFileName, setAgentMecFileName] = useState("");
  const [agentMecData, setAgentMecData] = useState(emptyMec);
  const [agentMvcMecId, setAgentMvcMecId] = useState("");

  const [isIssuingBulk, setIsIssuingBulk] = useState(false);
  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [certificateNo, setCertificateNo] = useState(
    selectedRequest?.certificateNo || "",
  );
  const [selectedMvcMecIds, setSelectedMvcMecIds] = useState([]);
  const [citizenValidationState, setCitizenValidationState] = useState(
    selectedRequest?.mvcMecValidationState || VALIDATION_STATE.IDLE,
  );
  const [citizenValidationMessage, setCitizenValidationMessage] = useState(
    selectedRequest?.mvcMecValidationMessage || "",
  );
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (selectedRequest) {
      if (selectedRequest.id && !id) setId(selectedRequest.id);
      if (selectedRequest.currentStep && !hasSyncedStep.current) {
        setStep(Math.min(selectedRequest.currentStep, maxStep));
        hasSyncedStep.current = true;
      }
      if (selectedRequest.status) setRequestStatus(selectedRequest.status);
      if (selectedRequest.orNumber) setOrNumber(selectedRequest.orNumber);
      if (selectedRequest.orCr) setOrCr(selectedRequest.orCr);
      if (selectedRequest.crNumber) setCrNumber(selectedRequest.crNumber);
      if (selectedRequest.crCr) setCrCr(selectedRequest.crCr);
      if (selectedRequest.voucherCode || selectedRequest.voucherReferenceNo) {
        const code = selectedRequest.voucherCode || selectedRequest.voucherReferenceNo;
        setVoucherCode(code);
        setVoucherAssigned(true);
      }
      if (selectedRequest.paymentDone) setPaymentDone(true);
      if (selectedRequest.hpgVerified || selectedRequest.status === "HPG_VERIFIED") setHpgVerified(true);
      if (selectedRequest.certificateNo) setCertificateNo(selectedRequest.certificateNo);
      if (selectedRequest.mvcMecValidationState) setCitizenValidationState(selectedRequest.mvcMecValidationState);
      if (selectedRequest.mvcMecValidationMessage) setCitizenValidationMessage(selectedRequest.mvcMecValidationMessage);
      if (selectedRequest.mvcData) setMvcData(selectedRequest.mvcData);
      if (selectedRequest.mecData) setMecData(selectedRequest.mecData);
      if (selectedRequest.vehicleOption) setVehicleOption(selectedRequest.vehicleOption);
    }
  }, [selectedRequest, maxStep, id]);

  const [ocrUploadState, setOcrUploadState] = useState(emptyOcrUploadState);
  const ocrUploadVersionRef = useRef({
    or: 0,
    cr: 0,
    mvc: 0,
    mec: 0,
    agentMvc: 0,
    agentMec: 0,
  });

  const [queueRows, setQueueRows] = useState(() => {
    if (!isAgent) return [];

    const mockRequests = JSON.parse(localStorage.getItem("mock_agent_requests") || "[]");
    const activeRequests = mockRequests.filter(
      (r) => r.status !== "CERTIFICATE_ISSUED" && r.clearanceStatus !== "CERTIFICATE_ISSUED"
    );

    if (selectedRequest?.id) {
      const idx = activeRequests.findIndex(r => r.id === selectedRequest.id);
      if (idx === -1) {
        activeRequests.unshift({
          ...selectedRequest,
          hpgStatus: selectedRequest.hpgStatus || HPG_STATUS.PENDING,
          mvcMecUploaded: Boolean(
            selectedRequest.mvcData?.mvcNo && selectedRequest.mecData?.engineNoStencilled,
          ),
        });
      }
    }
    return activeRequests;
  });

  const getMismatches = () => {
    const m = [];
    if (orCr.plateNumber && crCr.plateNumber && orCr.plateNumber !== crCr.plateNumber) m.push("Plate Number");
    if (orCr.yearModel && crCr.yearModel && orCr.yearModel !== crCr.yearModel) m.push("Year Model");
    if (orCr.color && crCr.color && orCr.color !== crCr.color) m.push("Color");
    if (orCr.mvFileNumber && crCr.mvFileNumber && orCr.mvFileNumber !== crCr.mvFileNumber) m.push("MV File Number");
    if (orCr.ownerName && crCr.ownerName && orCr.ownerName !== crCr.ownerName) m.push("Owner Name");
    if (orCr.ownerAddress && crCr.ownerAddress && orCr.ownerAddress !== crCr.ownerAddress) m.push("Owner Address");
    return m;
  };

  const mismatches = getMismatches();
  const hasMismatch = mismatches.length > 0;

  const updateOrCr = (field, value) => {
    setOrCr((prev) => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
    setValidationErrors((prev) => ({ ...prev, [field]: false }));
  };
  const updateCrCr = (field, value) => {
    setCrCr((prev) => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
    setValidationErrors((prev) => ({ ...prev, [field]: false }));
  };

  const isResume = Boolean(selectedRequest?.id);

  const fallbackRows = useMemo(() => {
    if (!isAgent || !isResume) return [];

    return availableVoucherRequests
      .filter(
        (item) =>
          item.status !== "CERTIFICATE_ISSUED" &&
          item.clearanceStatus !== "CERTIFICATE_ISSUED",
      )
      .map((item) => ({
        ...item,
        hpgStatus: item.hpgStatus || HPG_STATUS.PENDING,
        mvcMecUploaded: Boolean(item.mvcData?.mvcNo && item.mecData?.engineNoStencilled),
      }));
  }, [availableVoucherRequests, isAgent, isResume]);

  const certificationQueue = queueRows.length > 0 ? queueRows : fallbackRows;

  const pendingMvcMecRows = useMemo(
    () => certificationQueue.filter((row) => !row.mvcMecUploaded),
    [certificationQueue],
  );

  const selectableMvcMecRows = useMemo(
    () =>
      certificationQueue.filter(
        (row) =>
          row.status !== "CERTIFICATE_ISSUED" &&
          row.clearanceStatus !== "CERTIFICATE_ISSUED",
      ),
    [certificationQueue],
  );

  const getQueueTimestamp = (row) => {
    const requestTs = Number(String(row?.id || "").split("-")[1]);
    if (Number.isFinite(requestTs)) return requestTs;

    const createdTs = Date.parse(row?.dateCreated || "");
    if (Number.isFinite(createdTs)) return createdTs;

    return Number.MAX_SAFE_INTEGER;
  };

  const clearOrCrForm = () => {
    setOrPreview(null);
    setOrNumber("");
    setOrCr(emptyVehicle);
    setCrPreview(null);
    setCrNumber("");
    setCrCr(emptyVehicle);
    setOcrUploadState((prev) => ({
      ...prev,
      or: emptyOcrUploadState.or,
      cr: emptyOcrUploadState.cr,
    }));
  };

  const nextOcrVersion = (key) => {
    const current = (ocrUploadVersionRef.current[key] || 0) + 1;
    ocrUploadVersionRef.current[key] = current;
    return current;
  };

  const isCurrentOcrVersion = (key, version) =>
    ocrUploadVersionRef.current[key] === version;

  const setOcrState = (key, patch) => {
    setOcrUploadState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...patch,
      },
    }));
  };

  const persistRow = async (row) => {
    if (isAgent) {
      const currentList = JSON.parse(localStorage.getItem("mock_agent_requests") || "[]");
      let updatedRow = {
        ...row,
        plateNumber: row.plateNumber || row.orCr?.plateNumber || "",
        voucherReferenceNo: row.voucherReferenceNo || "",
        voucherStatus: row.voucherId ? "VOUCHER_ISSUED" : "PENDING_ASSIGNMENT",
        hpgVerified: row.hpgStatus === HPG_STATUS.APPROVED,
        mvcData: row.mvcData || {},
        mecData: row.mecData || {},
        currentStep: row.currentStep || step,
        status: row.status || "OR_CR_UPLOADED",
        clearanceStatus: row.clearanceStatus || "",
        certificateNo: row.certificateNo || "",
      };

      if (!updatedRow.id) {
        updatedRow.id = `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;
      }

      if ((updatedRow.status === "CERTIFICATE_ISSUED" || updatedRow.clearanceStatus === "CERTIFICATE_ISSUED") && !updatedRow.certificateNo) {
        updatedRow.certificateNo = `DCI-CERT-${String(Date.now() + Math.floor(Math.random() * 1000)).slice(-8)}`;
        updatedRow.clearanceReferenceNo = updatedRow.certificateNo;
      }

      const idx = currentList.findIndex(r => r.id === updatedRow.id);
      if (idx > -1) {
        currentList[idx] = { ...currentList[idx], ...updatedRow };
      } else {
        currentList.unshift(updatedRow);
      }
      localStorage.setItem("mock_agent_requests", JSON.stringify(currentList));
      setAvailableVoucherRequests(currentList);

      return updatedRow.id;
    }

    if (onSaveRequest) {
      const resObj = await onSaveRequest({
        ...row,
        id: row.id,
        plateNumber: row.plateNumber || row.orCr?.plateNumber || "",
        voucherReferenceNo: row.voucherReferenceNo || "",
        voucherStatus: row.voucherId ? "VOUCHER_ISSUED" : "PENDING_ASSIGNMENT",
        hpgVerified: row.hpgStatus === HPG_STATUS.APPROVED,
        mvcData: row.mvcData || {},
        mecData: row.mecData || {},
        currentStep: row.currentStep || step,
        status: row.status || "OR_CR_UPLOADED",
        clearanceStatus: row.clearanceStatus || "",
        certificateNo: row.certificateNo || "",
      });
      const savedId = resObj?.id || resObj;
      if (resObj?.certificateNo && row.certificateNo !== resObj.certificateNo) {
        setQueueRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  certificateNo: resObj.certificateNo,
                  clearanceReferenceNo: resObj.certificateNo,
                  clearanceStatus: "CERTIFICATE_ISSUED",
                }
              : r,
          ),
        );
      }
      return savedId;
    }
    return row.id;
  };

  const saveCitizenRequest = async (overrides = {}) => {
    const record = {
      id,
      dateCreated,
      currentStep: step,
      status: requestStatus,
      role,
      vehicleOption,
      plateNumber:
        orCr.plateNumber ||
        crCr.plateNumber ||
        selectedRequest?.plateNumber ||
        "",
      voucherCode,
      voucherReferenceNo: voucherCode,
      voucherAssigned,
      voucherStatus: voucherAssigned
        ? "VOUCHER_ISSUED"
        : selectedRequest?.voucherStatus ||
          (selectedRequest?.voucherCode ? "VOUCHER_ISSUED" : ""),

      paymentDone,
      hpgVerified,
      certificateNo,
      clearanceReferenceNo: certificateNo,
      clearanceStatus: certificateNo
        ? "CERTIFICATE_ISSUED"
        : selectedRequest?.clearanceStatus || "",
      orNumber: orNumber && orNumber !== "Extracting..." ? orNumber : selectedRequest?.orNumber || "",
      crNumber: crNumber && crNumber !== "Extracting..." ? crNumber : selectedRequest?.crNumber || "",
      verificationId: selectedRequest?.verificationId || "",
      ...overrides,
    };

    const hasOrCrDetails = Object.values(orCr).some(val => typeof val === "string" && val.trim() !== "" && val !== "Extracting...");
    const hasCrCrDetails = Object.values(crCr).some(val => typeof val === "string" && val.trim() !== "" && val !== "Extracting...");

    if (hasOrCrDetails) {
      record.orCr = orCr;
    }
    if (hasCrCrDetails) {
      record.crCr = crCr;
    }

    if (onSaveRequest) {
      const resObj = await onSaveRequest(record);
      const savedId = resObj?.id || resObj;
      if (savedId && !id) {
        setId(savedId);
        record.id = savedId;
      }
      if (resObj?.certificateNo) {
        setCertificateNo(resObj.certificateNo);
        record.certificateNo = resObj.certificateNo;
        record.clearanceReferenceNo = resObj.certificateNo;
        record.clearanceStatus = "CERTIFICATE_ISSUED";
      }
    }
    return record;
  };

  const handleOrUpload = async (file, preview) => {
    setOrPreview(preview);
    setValidationErrors({});
    if (!file) {
      setOcrState("or", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("or");
    const previousState = {
      orNumber,
      orCr,
    };
    setOcrState("or", {
      status: OCR_STATUS.EXTRACTING,
      confidence: 0,
      error: "",
    });

    setOrNumber("Extracting...");
    setOrCr({
      plateNumber: "Extracting...",
      mvFileNumber: "Extracting...",
      classification: "Extracting...",
      vehicleType: "Extracting...",
      fuelType: "Extracting...",
      engineNumber: "Extracting...",
      chassisNumber: "Extracting...",
      make: "Extracting...",
      series: "Extracting...",
      yearModel: "Extracting...",
      color: "Extracting...",
      ownerName: "Extracting...",
      ownerAddress: "Extracting...",
    });

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.OR,
      );
      if (!isCurrentOcrVersion("or", runId)) return;

      const parsed = result.fields || {};
      const nextVehicle = mergeVehicleFields(orCr, parsed.vehicle || {});
      setOrNumber(parsed.orNumber || previousState.orNumber || "");
      setOrCr(nextVehicle);
      setOcrState("or", {
        status: OCR_STATUS.SUCCESS,
        confidence: result.confidence || 0,
        error: "",
      });
    } catch (error) {
      if (!isCurrentOcrVersion("or", runId)) return;

      setOrNumber(previousState.orNumber || "");
      setOrCr(previousState.orCr || emptyVehicle);
      setOcrState("or", {
        status: OCR_STATUS.ERROR,
        confidence: 0,
        error: error?.message || "Unable to extract OR details.",
      });
    }
  };

  const handleCrUpload = async (file, preview) => {
    setCrPreview(preview);
    setValidationErrors({});
    if (!file) {
      setOcrState("cr", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("cr");
    const previousState = {
      crNumber,
      crCr,
    };
    setOcrState("cr", {
      status: OCR_STATUS.EXTRACTING,
      confidence: 0,
      error: "",
    });

    setCrNumber("Extracting...");
    setCrCr({
      plateNumber: "Extracting...",
      mvFileNumber: "Extracting...",
      classification: "Extracting...",
      vehicleType: "Extracting...",
      fuelType: "Extracting...",
      engineNumber: "Extracting...",
      chassisNumber: "Extracting...",
      make: "Extracting...",
      series: "Extracting...",
      yearModel: "Extracting...",
      color: "Extracting...",
      ownerName: "Extracting...",
      ownerAddress: "Extracting...",
    });

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.CR,
      );
      if (!isCurrentOcrVersion("cr", runId)) return;

      const parsed = result.fields || {};
      const nextVehicle = mergeVehicleFields(crCr, parsed.vehicle || {});
      setCrNumber(parsed.crNumber || previousState.crNumber || "");
      setCrCr(nextVehicle);
      setOcrState("cr", {
        status: OCR_STATUS.SUCCESS,
        confidence: result.confidence || 0,
        error: "",
      });
    } catch (error) {
      if (!isCurrentOcrVersion("cr", runId)) return;

      setCrNumber(previousState.crNumber || "");
      setCrCr(previousState.crCr || emptyVehicle);
      setOcrState("cr", {
        status: OCR_STATUS.ERROR,
        confidence: 0,
        error: error?.message || "Unable to extract CR details.",
      });
    }
  };

  const handleAddToQueue = async () => {
    if (!isAgent) return;

    const orOk = isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && orNumber && orNumber !== "Extracting...";
    const crOk = isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && crNumber && crNumber !== "Extracting...";
    if (!(orOk && crOk && !hasMismatch)) return;

    const normalizeStr = (str) => (str || "").trim().toUpperCase();
    const newPlate = normalizeStr(orCr.plateNumber || crCr.plateNumber || "");

    const isDuplicate = certificationQueue.some((row) => {
      const existingPlate = normalizeStr(row.plateNumber || row.orCr?.plateNumber || row.crCr?.plateNumber || "");
      return (
        (newPlate && existingPlate && newPlate === existingPlate)
      );
    });

    if (isDuplicate) {
      await showError(
        "Duplicate Entry",
        "An entry with the same Plate Number already exists in the staging queue."
      );
      return;
    }

    const row = {
      role,
      dateCreated: new Date().toISOString().split("T")[0],
      currentStep: 1,
      status: "OR_CR_UPLOADED",
      voucherStatus: "PENDING_ASSIGNMENT",
      clearanceStatus: "",
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orNumber,
      crNumber,
      orCr,
      crCr,
      orPreview,
      crPreview,
      hpgStatus: HPG_STATUS.PENDING,
      mvcMecUploaded: false,
    };

    const newId = await persistRow(row);
    row.id = newId;
    setQueueRows((prev) => [row, ...prev]);
    clearOrCrForm();
  };

  const updateVoucherInventory = (updater) => {
    if (!setVoucherInventory) return;
    setVoucherInventory((prev) =>
      updater(Array.isArray(prev) ? prev : voucherInventory),
    );
  };

  const setHpgForRow = (idForRow, nextStatus) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.id !== idForRow) return row;
        const statusMap = {
          [HPG_STATUS.PENDING]: "PENDING_HPG",
          [HPG_STATUS.INSPECTION]: "UNDER_INSPECTION",
          [HPG_STATUS.APPROVED]: "HPG_VERIFIED",
          [HPG_STATUS.REJECTED]: "HPG_REJECTED",
        };
        const updated = {
          ...row,
          hpgStatus: nextStatus,
          hpgVerified: nextStatus === HPG_STATUS.APPROVED,
          status: statusMap[nextStatus],
          currentStep: 2,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const setHpgForAll = (nextStatus) => {
    certificationQueue.forEach((row) =>
      setHpgForRow(row.id, nextStatus),
    );
  };

  const uploadMvcMecForRow = (idForRow, uploadPayload = {}) => {
    const now = new Date().toISOString().split("T")[0];
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.id !== idForRow) return row;
        const nextMvcData = {
          mvcNo: uploadPayload.mvcData?.mvcNo || "",
          issueDate: uploadPayload.mvcData?.issueDate || "",
          engineNo: uploadPayload.mvcData?.engineNo || "",
          chassisNo: uploadPayload.mvcData?.chassisNo || "",
          plateNo: uploadPayload.mvcData?.plateNo || "",
          color: uploadPayload.mvcData?.color || "",
          mvFileNo: uploadPayload.mvcData?.mvFileNo || "",
        };
        const nextMecData = {
          engineNoStencilled: uploadPayload.mecData?.engineNoStencilled || "",
          chassisNoStencilled: uploadPayload.mecData?.chassisNoStencilled || "",
          plateNo: uploadPayload.mecData?.plateNo || "",
          color: uploadPayload.mecData?.color || "",
        };
        const updated = {
          ...row,
          mvcMecUploaded: true,
          mvcMecValidationState: VALIDATION_STATE.PENDING,
          mvcMecValidationMessage: "Awaiting DCI validation.",
          mvcData: nextMvcData,
          mecData: nextMecData,
          mvcPreview: uploadPayload.mvcPreview || row.mvcPreview || null,
          mecPreview: uploadPayload.mecPreview || row.mecPreview || null,
          mvcFileName: uploadPayload.mvcFileName || row.mvcFileName || "",
          mecFileName: uploadPayload.mecFileName || row.mecFileName || "",
          status: "MVC_MEC_VALIDATION_PENDING",
          currentStep: 3,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const uploadMvcMecForAll = () => {
    certificationQueue.forEach((row) => uploadMvcMecForRow(row.id));
  };

  const validateMvcMecForRow = (idForRow) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.id !== idForRow) return row;
        const validating = {
          ...row,
          mvcMecValidationState: VALIDATION_STATE.VALIDATING,
          mvcMecValidationMessage: "DCI validation in progress...",
          status: "MVC_MEC_VALIDATING",
        };
        persistRow(validating);
        return validating;
      });
    });

    setTimeout(() => {
      setQueueRows((prev) => {
        const source = prev.length > 0 ? prev : fallbackRows;
        return source.map((row) => {
          if (row.id !== idForRow) return row;
          const validated = {
            ...row,
            mvcMecValidationState: VALIDATION_STATE.PASSED,
            mvcMecValidationMessage: "Validated by DCI portal.",
            status: "MVC_MEC_VALIDATED",
            currentStep: 3,
          };
          persistRow(validated);
          return validated;
        });
      });
    }, 1300);
  };

  const validateSelectedMvcMecRows = () => {
    selectedMvcMecIds.forEach((idForRow) => {
      validateMvcMecForRow(idForRow);
    });
    setSelectedMvcMecIds([]);
  };

  const toggleSelectedMvcMecRow = (idForRow) => {
    setSelectedMvcMecIds((prev) =>
      prev.includes(idForRow)
        ? prev.filter((id) => id !== idForRow)
        : [...prev, idForRow],
    );
  };

  const toggleSelectAllMvcMecRows = () => {
    const selectableIds = certificationQueue
      .filter((row) => row.mvcMecUploaded)
      .map((row) => row.id);

    setSelectedMvcMecIds((prev) =>
      prev.length === selectableIds.length && selectableIds.length > 0
        ? []
        : selectableIds,
    );
  };

  const selectedMvcMecRows = certificationQueue.filter((row) =>
    selectedMvcMecIds.includes(row.id),
  );
  const allMvcMecSelectableSelected =
    certificationQueue.some((row) => row.mvcMecUploaded) &&
    certificationQueue
      .filter((row) => row.mvcMecUploaded)
      .every((row) => selectedMvcMecIds.includes(row.id));
  const hasSelectedMvcMecRows = selectedMvcMecRows.length > 0;

  useEffect(() => {
    const validIds = new Set(certificationQueue.map((row) => row.id));
    setSelectedMvcMecIds((prev) =>
      prev.filter((idForRow) => validIds.has(idForRow)),
    );
  }, [certificationQueue]);

  const clearAgentMvcMecForm = () => {
    setAgentMvcPreview(null);
    setAgentMvcFileName("");
    setAgentMvcData(emptyMvc);
    setAgentMecPreview(null);
    setAgentMecFileName("");
    setAgentMecData(emptyMec);
  };

  const handleAgentMvcUpload = async (file, preview) => {
    setAgentMvcPreview(preview);
    setAgentMvcFileName(file?.name || "");
    if (!file) {
      setOcrState("agentMvc", {
        status: OCR_STATUS.IDLE,
        confidence: 0,
        error: "",
      });
      return;
    }

    const runId = nextOcrVersion("agentMvc");
    const previousState = { ...agentMvcData };
    setOcrState("agentMvc", {
      status: OCR_STATUS.EXTRACTING,
      confidence: 0,
      error: "",
    });

    setAgentMvcData({
      mvcNo: "Extracting...",
      issueDate: "Extracting...",
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      mvFileNo: "Extracting...",
      color: "Extracting...",
    });

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MVC,
      );
      if (!isCurrentOcrVersion("agentMvc", runId)) return;

      const parsed = result.fields || {};
      setAgentMvcData({
        mvcNo: String(parsed.mvcNo || previousState.mvcNo || "").toUpperCase(),
        issueDate: String(parsed.mvcIssueDate || previousState.issueDate || "").toUpperCase(),
        engineNo: String(parsed.engineNo || parsed.engineNumber || previousState.engineNo || "").toUpperCase(),
        chassisNo: String(parsed.chassisNo || parsed.chassisNumber || previousState.chassisNo || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        mvFileNo: String(parsed.mvFileNo || parsed.mvFileNumber || previousState.mvFileNo || "").toUpperCase(),
        color: String(parsed.color || previousState.color || "").toUpperCase(),
      });
      setOcrState("agentMvc", {
        status: OCR_STATUS.SUCCESS,
        confidence: result.confidence || 0,
        error: "",
      });
    } catch (error) {
      if (!isCurrentOcrVersion("agentMvc", runId)) return;

      setAgentMvcData(previousState);
      setOcrState("agentMvc", {
        status: OCR_STATUS.ERROR,
        confidence: 0,
        error: error?.message || "Unable to extract MVC details.",
      });
    }
  };

  const handleAgentMecUpload = async (file, preview) => {
    setAgentMecPreview(preview);
    setAgentMecFileName(file?.name || "");
    if (!file) {
      setOcrState("agentMec", {
        status: OCR_STATUS.IDLE,
        confidence: 0,
        error: "",
      });
      return;
    }

    const runId = nextOcrVersion("agentMec");
    const previousState = { ...agentMecData };
    setOcrState("agentMec", {
      status: OCR_STATUS.EXTRACTING,
      confidence: 0,
      error: "",
    });

    setAgentMecData({
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
    });

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MEC,
      );
      if (!isCurrentOcrVersion("agentMec", runId)) return;

      const parsed = result.fields || {};
      setAgentMecData({
        engineNoStencilled: String(parsed.engineNoStencilled || parsed.engineNo || parsed.engineNumber || previousState.engineNoStencilled || "").toUpperCase(),
        chassisNoStencilled: String(parsed.chassisNoStencilled || parsed.chassisNo || parsed.chassisNumber || previousState.chassisNoStencilled || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        color: String(parsed.color || previousState.color || "").toUpperCase(),
      });
      setOcrState("agentMec", {
        status: OCR_STATUS.SUCCESS,
        confidence: result.confidence || 0,
        error: "",
      });
    } catch (error) {
      if (!isCurrentOcrVersion("agentMec", runId)) return;

      setAgentMecData(previousState);
      setOcrState("agentMec", {
        status: OCR_STATUS.ERROR,
        confidence: 0,
        error: error?.message || "Unable to extract MEC details.",
      });
    }
  };

  const handleAddAgentMvcMecToQueue = () => {
    if (!agentMvcMecId) return;
    if (!agentMvcPreview || !agentMecPreview) return;

    uploadMvcMecForRow(agentMvcMecId, {
      mvcData: agentMvcData,
      mecData: agentMecData,
      mvcPreview: agentMvcPreview,
      mecPreview: agentMecPreview,
      mvcFileName: agentMvcFileName,
      mecFileName: agentMecFileName,
    });

    clearAgentMvcMecForm();
  };

  const validateCitizenMvcMecStep = async () => {
    if (!isDocumentComplete(mvcData) || !isDocumentComplete(mecData)) return;

    setIsVerifyingDocuments(true);
    setCitizenValidationState(VALIDATION_STATE.VALIDATING);
    setCitizenValidationMessage("DCI validation in progress...");
    setRequestStatus("MVC_MEC_VALIDATING");

    try {
      await saveCitizenRequest({
        currentStep: 5,
        status: "MVC_MEC_VALIDATING",
        mvcData,
        mecData,
        mvcMecValidationState: VALIDATION_STATE.VALIDATING,
        mvcMecValidationMessage: "DCI validation in progress...",
      });

      // Simulate DCI validation latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await saveCitizenRequest({
        currentStep: 6,
        status: "MVC_MEC_VALIDATED",
        mvcData,
        mecData,
        mvcMecValidationState: VALIDATION_STATE.PASSED,
        mvcMecValidationMessage: "Validated by DCI portal.",
      });

      setCitizenValidationState(VALIDATION_STATE.PASSED);
      setCitizenValidationMessage("Validated by DCI portal.");
      setRequestStatus("MVC_MEC_VALIDATED");
      setStep(6);
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || "An error occurred during DCI validation.";
      setCitizenValidationState(VALIDATION_STATE.FAILED);
      setCitizenValidationMessage(errMsg);
      setRequestStatus("MVC_MEC_VALIDATION_PENDING");

      await saveCitizenRequest({
        currentStep: 5,
        status: "MVC_MEC_VALIDATION_PENDING",
        mvcData,
        mecData,
        mvcMecValidationState: VALIDATION_STATE.FAILED,
        mvcMecValidationMessage: errMsg,
      });

      await showError("DCI Validation Failed", errMsg);
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

  const issueCertificatesForAll = () => {
    if (isIssuingBulk) return;
    setIsIssuingBulk(true);

    setTimeout(() => {
      setQueueRows((prev) => {
        const source = prev.length > 0 ? prev : fallbackRows;
        const next = source.map((row, idx) => {
          if (row.certificateNo) return row;
          const mockCertNo = `DCI-CERT-${String(Date.now() + idx).slice(-8)}`;
          const updated = {
            ...row,
            certificateNo: mockCertNo,
            clearanceReferenceNo: mockCertNo,
            clearanceStatus: "CERTIFICATE_ISSUED",
            status: "CERTIFICATE_ISSUED",
            currentStep: 4,
          };
          persistRow(updated);
          return updated;
        });

        updateVoucherInventory((inventoryRows) => {
          return next.reduce((acc, row) => {
            if (!row.voucherId) return acc;
            return voucherInventoryService.markVoucherUsed(acc, {
              voucherId: row.voucherId,
              id: row.id,
            });
          }, inventoryRows);
        });

        return next;
      });

      setIsIssuingBulk(false);
    }, 1200);
  };

  useEffect(() => {
    if (!isAgent) return;

    const rowsInOrder = [...certificationQueue].sort(
      (a, b) => getQueueTimestamp(a) - getQueueTimestamp(b),
    );
    const rowsNeedingVoucher = rowsInOrder.filter((row) => !row.voucherId);
    if (rowsNeedingVoucher.length === 0) return;

    const availableVouchers = [...voucherInventory]
      .filter(
        (item) => item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE,
      )
      .sort(
        (a, b) =>
          Date.parse(a.dateCreated || "") - Date.parse(b.dateCreated || ""),
      );
    if (availableVouchers.length === 0) return;

    const pairCount = Math.min(
      rowsNeedingVoucher.length,
      availableVouchers.length,
    );
    const assignments = Array.from({ length: pairCount }, (_, index) => ({
      id: rowsNeedingVoucher[index].id,
      plateNumber: rowsNeedingVoucher[index].plateNumber || "",
      voucherId: availableVouchers[index].voucherId,
      voucherCode: availableVouchers[index].voucherCode,
    }));
    if (assignments.length === 0) return;

    updateVoucherInventory((prev) =>
      assignments.reduce(
        (inventoryRows, assignment) =>
          voucherInventoryService.assignVoucherToRequest(inventoryRows, {
            voucherId: assignment.voucherId,
            id: assignment.id,
            plateNumber: assignment.plateNumber,
            assignedBy: role,
          }),
        prev,
      ),
    );

    const assignmentByRequest = assignments.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      let changed = false;
      const next = source.map((row) => {
        const assignment = assignmentByRequest[row.id];
        if (!assignment || row.voucherId) return row;

        changed = true;
        const updated = {
          ...row,
          voucherId: assignment.voucherId,
          voucherReferenceNo: assignment.voucherCode,
          voucherStatus: "VOUCHER_ISSUED",
          status: "VOUCHER_ASSIGNED",
          currentStep: Math.max(row.currentStep || 1, 2),
        };
        persistRow(updated);
        return updated;
      });

      return changed ? next : prev;
    });
  }, [certificationQueue, fallbackRows, isAgent, role, voucherInventory]);

  useEffect(() => {
    if (!isAgent) return;
    if (
      agentMvcMecId &&
      selectableMvcMecRows.some((row) => row.id === agentMvcMecId)
    ) {
      return;
    }
    setAgentMvcMecId(selectableMvcMecRows[0]?.id || "");
  }, [agentMvcMecId, isAgent, selectableMvcMecRows]);

  useEffect(() => {
    if (
      isAgent ||
      step !== 6 ||
      citizenValidationState !== VALIDATION_STATE.PASSED
    )
      return;
    if (certificateNo || isIssuingCertificate) return;
    if (!voucherAssigned) return;

    setIsIssuingCertificate(true);
    setTimeout(() => {
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      saveCitizenRequest({
        currentStep: 6,
        status: "CERTIFICATE_ISSUED",
        certificateNo: "", // Let backend generate a unique certificate number
        clearanceReferenceNo: "",
        clearanceStatus: "CERTIFICATE_ISSUED",
        voucherAssigned: true,
        voucherStatus: "VOUCHER_ISSUED",
        voucherCode: voucherCode,
        voucherReferenceNo: voucherCode,
      });
    }, 1500);
  }, [
    certificateNo,
    citizenValidationState,
    isAgent,
    isIssuingCertificate,
    step,
    voucherAssigned,
    voucherCode,
  ]);

  useEffect(() => {
    if (!isAgent || step !== 4 || isIssuingBulk) return;
    const allValidated =
      certificationQueue.length > 0 &&
      certificationQueue.every(
        (row) => row.mvcMecValidationState === VALIDATION_STATE.PASSED,
      );
    const hasPendingCert = certificationQueue.some((row) => !row.certificateNo);

    if (allValidated && hasPendingCert) {
      issueCertificatesForAll();
    }
  }, [certificationQueue, isAgent, isIssuingBulk, step]);

  const handleProceedToPayment = async () => {
    if (isAgent || processingPayment) return;

    const storedProfile = JSON.parse(
      localStorage.getItem("userProfile") || "{}",
    );
    const storedFirstName =
      localStorage.getItem("firstname") || storedProfile.firstName || "";
    const storedLastName =
      localStorage.getItem("lastname") || storedProfile.lastName || "";
    const storedEmail =
      localStorage.getItem("email") || storedProfile.email || "";
    const storedMobile =
      localStorage.getItem("mobile") || storedProfile.mobile || "";
    const companyId = Number(
      localStorage.getItem("companyId") || storedProfile.companyId || 0,
    );
    const companyCode =
      localStorage.getItem("companyCode") || storedProfile.companyCode || "";
    const ownerName = (orCr.ownerName || crCr.ownerName || "").trim();
    const ownerNameParts = ownerName.split(/\s+/).filter(Boolean);
    const fallbackFirstName = ownerNameParts[0] || "Citizen";
    const fallbackLastName = ownerNameParts.slice(1).join(" ") || "User";
    const billingLine =
      orCr.ownerAddress || crCr.ownerAddress || storedProfile.address || "";

    if (!companyId || !companyCode) {
      console.error(
        "[Clearance] Payment setup failed: missing company information",
        {
          id,
          companyId,
          companyCode,
        },
      );
      await showError(
        "Payment Setup Failed",
        "Missing company information required for payment processing.",
      );
      return;
    }

    const callbackUrl = `${window.location.origin}/dci-access/new-clearance-request?id=${encodeURIComponent(id)}&step=3`;
    const paymentRequest = {
      customer: {
        contact: {
          email: storedEmail,
          mobile: storedMobile,
        },
        first_name: storedFirstName || fallbackFirstName,
        last_name: storedLastName || fallbackLastName,
        billing_address: {
          line1: billingLine,
          line2: "",
          zip: "",
          city_municipality: "",
          state_province_region: "",
          country_code: "PH",
        },
      },
      payment: {
        description: "DCI Clearance Request Fee",
        amount: "60.00",
        currency: "PHP",
        merchant_reference_id: id,
      },
      route: {
        callback_url: callbackUrl,
        notify_user: true,
      },
      company_id: companyId,
      company_code: companyCode,
      voucher_fee: 60,
      voucher_count: 1,
    };

    console.log("[Clearance] TLPE payment request body:", {paymentRequest});

    setProcessingPayment(true);
    try {
      const response = await paymentsService.createTlpePayment(paymentRequest);
      const payload = response?.data || {};
      const paymentLink = payload.link;

      if (!paymentLink) {
        throw new Error("Payment gateway link was not returned."); 
      }

      saveCitizenRequest({
        currentStep: 2,
        status: "PAYMENT_PENDING",
        paymentDone: false,
        tlpeOrderId: payload.order_id || payload.orderId || null,
        merchantReferenceId:
          payload.merchant_reference_id || payload.merchantReferenceId || "",
        paymentLink,
      });

      window.location.assign(paymentLink);
    } catch (error) {
      console.error("[Clearance] TLPE payment initialization failed", {
        id,
        paymentRequest,
        error: {
          message: error?.message,
          response: error?.response?.data,
        },
      });
      setProcessingPayment(false);
      setPaymentDone(true);
      setRequestStatus("PENDING");
      setStep(3);
      saveCitizenRequest({
        currentStep: 3,
        status: "PENDING",
        paymentDone: true,
      });
    };
  };

  useEffect(() => {
    if (isAgent) return;

    if (step === 3 && paymentDone && !voucherAssigned && !issuingVoucher && !fetchVoucherFailed) {
      setIssuingVoucher(true);

      const fetchVoucher = async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) {
            throw new Error("User ID not found");
          }

          // Fetch the user's vouchers
          const vouchers = await transferVoucherService.getVouchersByUser(userId);
          const sortedVouchers = [...vouchers].sort((a, b) => b.id - a.id);
          const txnId = paymentTransactionId || selectedRequest?.tlpeTransactionId;

          // Find the exact voucher from this payment transaction, or fallback to the latest AVAILABLE one
          const activeVoucher = 
            (txnId ? sortedVouchers.find((v) => v.tlpeTransactionId === txnId) : null) ||
            sortedVouchers.find((v) => v.status === "AVAILABLE") ||
            sortedVouchers.find((v) => v.status === "REDEEMED") ||
            sortedVouchers[0];

          if (activeVoucher && activeVoucher.voucherCode) {
            const code = activeVoucher.voucherCode;
            setVoucherCode(code);
            setVoucherAssigned(true);
            setRequestStatus("VOUCHER_ISSUED");
            saveCitizenRequest({
              currentStep: 3,
              status: "VOUCHER_ISSUED",
              voucherCode: code,
              voucherReferenceNo: code,
              voucherAssigned: true,
              voucherStatus: "VOUCHER_ISSUED",
            });
          } else {
             // If no voucher is found, it might still be generating in the background.
             // But for now, we just log it or handle it as an error.
             throw new Error("No voucher found for the user.");
          }
        } catch (error) {
          console.error("[Clearance] Failed to fetch voucher:", error);
          setFetchVoucherFailed(true);
          showError(
            "Voucher Issue Failed",
            error.message || "Failed to fetch the voucher from the server."
          );
        } finally {
          setIssuingVoucher(false);
        }
      };

      fetchVoucher();
    }
  }, [
    isAgent,
    issuingVoucher,
    paymentDone,
    step,
    voucherAssigned,
    voucherCode,
    fetchVoucherFailed,
    paymentTransactionId,
    selectedRequest?.tlpeTransactionId,
  ]);

  useEffect(() => {
    if (isAgent || step !== 4 || hpgVerified) return;

    let intervalId;
    let isActive = true;

    const pollRequestStatus = async () => {
      try {
        const records = await fetchMyRequests();
        if (!isActive) return;
        const currentRecord = records.find((r) => String(r.id) === String(id));
        if (currentRecord) {
          const isVerified = Boolean(
            currentRecord.hpgVerified || currentRecord.status === "HPG_VERIFIED"
          );
          if (isVerified) {
            setHpgVerified(true);
            setRequestStatus("HPG_VERIFIED");
            setAvailableVoucherRequests(records);
          }
        }
      } catch (err) {
        console.error("Error polling request status:", err);
      }
    };

    pollRequestStatus();
    intervalId = setInterval(pollRequestStatus, 3000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [id, step, hpgVerified, isAgent, setAvailableVoucherRequests]);

  const handleMvcUpload = async (file, preview) => {
    setMvcPreview(preview);
    setMvcFileName(file?.name || "");
    setCitizenValidationState(VALIDATION_STATE.PENDING);
    setCitizenValidationMessage("Awaiting DCI validation.");
    if (!file) {
      setOcrState("mvc", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("mvc");
    const previousState = { ...mvcData };
    setOcrState("mvc", {
      status: OCR_STATUS.EXTRACTING,
      confidence: 0,
      error: "",
    });

    setMvcData({
      mvcNo: "Extracting...",
      issueDate: "Extracting...",
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      mvFileNo: "Extracting...",
      color: "Extracting...",
    });

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MVC,
      );
      if (!isCurrentOcrVersion("mvc", runId)) return;

      const parsed = result.fields || {};
      const next = {
        mvcNo: String(parsed.mvcNo || previousState.mvcNo || "").toUpperCase(),
        issueDate: String(parsed.mvcIssueDate || previousState.issueDate || "").toUpperCase(),
        engineNo: String(parsed.engineNo || parsed.engineNumber || previousState.engineNo || "").toUpperCase(),
        chassisNo: String(parsed.chassisNo || parsed.chassisNumber || previousState.chassisNo || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        mvFileNo: String(parsed.mvFileNo || parsed.mvFileNumber || previousState.mvFileNo || "").toUpperCase(),
        color: String(parsed.color || previousState.color || "").toUpperCase(),
      };
      setMvcData(next);
      setOcrState("mvc", {
        status: OCR_STATUS.SUCCESS,
        confidence: result.confidence || 0,
        error: "",
      });
      saveCitizenRequest({
        currentStep: 5,
        status: "MVC_MEC_VALIDATION_PENDING",
        mvcData: next,
        mvcMecValidationState: VALIDATION_STATE.PENDING,
        mvcMecValidationMessage: "Awaiting DCI validation.",
        mvcPreview: preview,
        mvcFileName: file.name,
      });
    } catch (error) {
      if (!isCurrentOcrVersion("mvc", runId)) return;

      setMvcData(previousState);
      setOcrState("mvc", {
        status: OCR_STATUS.ERROR,
        confidence: 0,
        error: error?.message || "Unable to extract MVC details.",
      });
    }
  };

  const handleMecUpload = async (file, preview) => {
    setMecPreview(preview);
    setMecFileName(file?.name || "");
    setCitizenValidationState(VALIDATION_STATE.PENDING);
    setCitizenValidationMessage("Awaiting DCI validation.");
    if (!file) {
      setOcrState("mec", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("mec");
    const previousState = { ...mecData };
    setOcrState("mec", {
      status: OCR_STATUS.EXTRACTING,
      confidence: 0,
      error: "",
    });

    setMecData({
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
    });

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MEC,
      );
      if (!isCurrentOcrVersion("mec", runId)) return;

      const parsed = result.fields || {};
      const next = {
        engineNoStencilled: String(parsed.engineNoStencilled || parsed.engineNo || parsed.engineNumber || previousState.engineNoStencilled || "").toUpperCase(),
        chassisNoStencilled: String(parsed.chassisNoStencilled || parsed.chassisNo || parsed.chassisNumber || previousState.chassisNoStencilled || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        color: String(parsed.color || previousState.color || "").toUpperCase(),
      };
      setMecData(next);
      setOcrState("mec", {
        status: OCR_STATUS.SUCCESS,
        confidence: result.confidence || 0,
        error: "",
      });
      saveCitizenRequest({
        currentStep: 5,
        status: "MVC_MEC_VALIDATION_PENDING",
        mecData: next,
        mvcMecValidationState: VALIDATION_STATE.PENDING,
        mvcMecValidationMessage: "Awaiting DCI validation.",
        mecPreview: preview,
        mecFileName: file.name,
      });
    } catch (error) {
      if (!isCurrentOcrVersion("mec", runId)) return;

      setMecData(previousState);
      setOcrState("mec", {
        status: OCR_STATUS.ERROR,
        confidence: 0,
        error: error?.message || "Unable to extract MEC details.",
      });
    }
  };

  const handleDownload = async () => {
    if (!certificateNo) return;
    const { doc, filename } = await generateClearanceCertificatePDF({
      id,
      certificateNo,
      clearanceReferenceNo: certificateNo,
      plateNumber:
        orCr.plateNumber ||
        crCr.plateNumber ||
        selectedRequest?.plateNumber ||
        "",
      voucherCode,
      voucherReferenceNo: voucherCode,
      dateCreated,
      status: requestStatus,
      clearanceStatus: "CERTIFICATE_ISSUED",
      mvcData,
    });
    doc.save(filename);
  };

  const verifyCitizenDocuments = async () => {
    const verificationPayload = {
      mvFileNumber: (
        crCr.mvFileNumber ||
        orCr.mvFileNumber ||
        selectedRequest?.mvFileNumber ||
        ""
      )
        .trim()
        .toUpperCase(),
      plateNumber: (
        crCr.plateNumber ||
        orCr.plateNumber ||
        selectedRequest?.plateNumber ||
        ""
      )
        .trim()
        .toUpperCase(),
      engineNumber: (
        crCr.engineNumber ||
        orCr.engineNumber ||
        selectedRequest?.engineNumber ||
        ""
      )
        .trim()
        .toUpperCase(),
      chassisNumber: (
        crCr.chassisNumber ||
        orCr.chassisNumber ||
        selectedRequest?.chassisNumber ||
        ""
      )
        .trim()
        .toUpperCase(),
    };

    setIsVerifyingDocuments(true);    try {
      const response = await verificationService.verify(verificationPayload);
      const payload = response?.data || {};

      if (payload.verificationStatus !== "VERIFIED") {
        throw new Error(
          payload.failureReason ||
            "Vehicle verification failed. Please review OR/CR fields.",
        );
      }

      const verifiedOwnerName = [
        payload.ownerFirstName,
        payload.ownerMiddleName,
        payload.ownerLastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const verifiedVehicle = {
        plateNumber: (
          payload.plateNumber ||
          verificationPayload.plateNumber ||
          ""
        )
          .trim()
          .toUpperCase(),
        mvFileNumber: (
          payload.mvFileNo ||
          verificationPayload.mvFileNumber ||
          ""
        )
          .trim()
          .toUpperCase(),
        engineNumber: (
          payload.engineNumber ||
          verificationPayload.engineNumber ||
          ""
        )
          .trim()
          .toUpperCase(),
        chassisNumber: (
          payload.chassisNumber ||
          verificationPayload.chassisNumber ||
          ""
        )
          .trim()
          .toUpperCase(),
        classification: (payload.classification || "").trim().toUpperCase(),
        make: (payload.make || "").trim().toUpperCase(),
        series: (payload.series || "").trim().toUpperCase(),
        yearModel: (payload.yearModel || "").trim().toUpperCase(),
        color: (payload.color || "").trim().toUpperCase(),
        verificationStatus: (payload.verificationStatus || "VERIFIED").trim().toUpperCase(),
        ownerName: (verifiedOwnerName || "").trim().toUpperCase(),
        ownerAddress: (payload.ownerAddress || "").trim().toUpperCase(),
      };

      const nextOrCr = mergeVehicleFields(orCr, verifiedVehicle);
      const nextCrCr = mergeVehicleFields(crCr, verifiedVehicle);

      setOrCr(nextOrCr);
      setCrCr(nextCrCr);
      setRequestStatus("DOCUMENTS_VERIFIED");
      setStep(2);

      saveCitizenRequest({
        currentStep: 2,
        status: "DOCUMENTS_VERIFIED",
        verificationId:
          payload.verificationId || selectedRequest?.verificationId || "",
        orCr: nextOrCr,
        crCr: nextCrCr,
      });
    } catch (error) {
      await showError(
        "Vehicle Verification Failed",
        error?.response?.data?.failureReason ||
          error?.message ||
          "Unable to verify vehicle with current OR/CR details.",
      );
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

  useEffect(() => {
    if (isAgent || !paymentTransactionId) return;
    if (handledPaymentTransactionRef.current === paymentTransactionId) return;

    handledPaymentTransactionRef.current = paymentTransactionId;
    let active = true;

    const verifyPaymentRedirect = async () => {
      setProcessingPayment(true);
      try {
        const result =
          await merchantCallbackService.fetchSummary(paymentTransactionId);
        const payload = result?.data || {};
        const statusCode = String(payload.statusCode || "").toUpperCase();
        const paymentFailed =
          result?.success === false ||
          (statusCode && statusCode.startsWith("ER"));

        if (paymentFailed) {
          throw new Error(
            payload.voucherStatusLabel ||
              payload.report?.result?.message ||
              result?.message ||
              "Payment was not completed.",
          );
        }

        if (!active) return;

        setPaymentDone(true);
        setRequestStatus("PENDING");
        setStep(3);
        saveCitizenRequest({
          currentStep: 3,
          status: "PENDING",
          paymentDone: true,
          tlpeTransactionId: paymentTransactionId,
          merchantReferenceId: payload.merchantReference || "",
          paymentReference: payload.paymentReference || "",
        });
        navigate(
          `/dci-access/new-clearance-request?id=${encodeURIComponent(id)}`,
          { replace: true },
        );
      } catch (error) {
        if (!active) return;

        setRequestStatus("PAYMENT_FAILED");
        saveCitizenRequest({
          currentStep: 2,
          status: "PAYMENT_FAILED",
          paymentDone: false,
          tlpeTransactionId: paymentTransactionId,
        });
        await showError(
          "Payment Verification Failed",
          error?.message || "Unable to confirm payment.",
        );
        navigate(
          `/dci-access/new-clearance-request?id=${encodeURIComponent(id)}`,
          { replace: true },
        );
      } finally {
        if (active) {
          setProcessingPayment(false);
        }
      }
    };

    verifyPaymentRedirect();

    return () => {
      active = false;
      if (handledPaymentTransactionRef.current === paymentTransactionId) {
        handledPaymentTransactionRef.current = "";
      }
    };
  }, [isAgent, navigate, paymentTransactionId, id, showError]);

  const handleProceedFromStep1 = async () => {
    if (!vehicleOption) return;
    setIsVerifyingDocuments(true);
    try {
      await saveCitizenRequest({
        currentStep: 2,
        vehicleOption,
        status: "DRAFT",
      });
      setStep(2);
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || "Failed to proceed to next step.";
      await showError("Error Saving Option", errMsg);
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

  const handleVerifyStep2 = async () => {
    const newErrors = {};
    let hasEmpty = false;

    OR_EXPECTED_FIELDS.forEach((field) => {
      if (!orCr[field] || orCr[field].trim() === "" || orCr[field] === "Extracting...") {
        newErrors[field] = true;
        hasEmpty = true;
      }
    });
    if (!orNumber || orNumber.trim() === "" || orNumber === "Extracting...") {
      newErrors.orNumber = true;
      hasEmpty = true;
    }

    CR_EXPECTED_FIELDS.forEach((field) => {
      if (!crCr[field] || crCr[field].trim() === "" || crCr[field] === "Extracting...") {
        newErrors[field] = true;
        hasEmpty = true;
      }
    });
    if (!crNumber || crNumber.trim() === "" || crNumber === "Extracting...") {
      newErrors.crNumber = true;
      hasEmpty = true;
    }

    if (hasEmpty) {
      setValidationErrors(newErrors);
      await showError("Validation Failed", "Please fill in all required fields.");
      return;
    }

    if (hasMismatch) {
      await showError("Validation Failed", "OR and CR details must match to proceed.");
      return;
    }

    setIsVerifyingDocuments(true);
    try {
      // 1. Save the input values in or_cr_requests with status "Unverified"
      await saveCitizenRequest({
        currentStep: 2,
        status: "Unverified",
        orCr,
        crCr,
        orNumber,
        crNumber,
      });

      // 2. Call the VVS /verify endpoint to verify details
      const verificationPayload = {
        mvFileNumber: (crCr.mvFileNumber || orCr.mvFileNumber || "").trim().toUpperCase(),
        plateNumber: (crCr.plateNumber || orCr.plateNumber || "").trim().toUpperCase(),
        engineNumber: (crCr.engineNumber || orCr.engineNumber || "").trim().toUpperCase(),
        chassisNumber: (crCr.chassisNumber || orCr.chassisNumber || "").trim().toUpperCase(),
      };

      const verifyRes = await verificationService.verify(verificationPayload);
      const vvsData = verifyRes?.data || {};

      if (vvsData.verificationStatus !== "VERIFIED") {
        throw new Error(vvsData.failureReason || "No matching verified vehicle record found in VVS system.");
      }

      // 3. Save with status "DOCUMENTS_VERIFIED" to compare/match details
      await saveCitizenRequest({
        currentStep: 3,
        status: "DOCUMENTS_VERIFIED",
        verificationId: vvsData.verificationId || "",
        orCr,
        crCr,
        orNumber,
        crNumber,
      });

      setStep(3);
      setRequestStatus("DOCUMENTS_VERIFIED");
    } catch (error) {
      const errMsg = error?.response?.data?.failureReason || error?.response?.data?.error || error?.message || "Input details do not match data in VVS system.";
      
      let nextStatus = "Unverified";
      if (errMsg.includes("mismatch") || errMsg.includes("do not match")) {
        nextStatus = "vehicle unmatch";
      }
      
      setRequestStatus(nextStatus);

      // Parse mismatched fields from error message to mark them red
      const newErrors = {};
      if (errMsg.includes("Engine Number")) newErrors.engineNumber = true;
      if (errMsg.includes("Chassis Number")) newErrors.chassisNumber = true;
      if (errMsg.includes("Plate Number")) newErrors.plateNumber = true;
      if (errMsg.includes("MV File Number")) newErrors.mvFileNumber = true;
      if (errMsg.includes("Color")) newErrors.color = true;
      if (errMsg.includes("Make")) newErrors.make = true;
      if (errMsg.includes("Series")) newErrors.series = true;
      if (errMsg.includes("Year Model")) newErrors.yearModel = true;
      if (errMsg.includes("Classification")) newErrors.classification = true;
      if (errMsg.includes("Owner Name")) newErrors.ownerName = true;
      setValidationErrors(newErrors);

      try {
        await saveCitizenRequest({
          currentStep: 2,
          status: nextStatus,
          orCr,
          crCr,
          orNumber,
          crNumber,
        });
      } catch (saveErr) {
        console.error("Failed to save unverified status:", saveErr);
      }

      await loadAllRequests();
      await showError("Vehicle Verification Failed", errMsg);
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

  const getTicketPrefilledData = () => {
    const currentStepNum = step;
    const concernType = "vehicle";
    const vehicleSubType = "dataMismatch";
    let plateNo = "";
    let make = "";
    let model = "";
    let mvFileNo = "";
    let engineNo = "";
    let chassisNo = "";

    if (isAgent) {
      if (currentStepNum === 1) {
        plateNo = orCr?.plateNumber || crCr?.plateNumber || "";
        make = orCr?.make || crCr?.make || "";
        model = orCr?.series || crCr?.series || "";
        mvFileNo = orCr?.mvFileNumber || crCr?.mvFileNumber || "";
        engineNo = orCr?.engineNumber || crCr?.engineNumber || "";
        chassisNo = orCr?.chassisNumber || crCr?.chassisNumber || "";
      } else if (currentStepNum === 3) {
        plateNo = agentMvcData?.plateNo || agentMecData?.plateNo || "";
        engineNo = agentMvcData?.engineNo || agentMecData?.engineNoStencilled || "";
        chassisNo = agentMvcData?.chassisNo || agentMecData?.chassisNoStencilled || "";
      }
    } else {
      if (currentStepNum === 1) {
        plateNo = orCr?.plateNumber || crCr?.plateNumber || "";
        make = orCr?.make || crCr?.make || "";
        model = orCr?.series || crCr?.series || "";
        mvFileNo = orCr?.mvFileNumber || crCr?.mvFileNumber || "";
        engineNo = orCr?.engineNumber || crCr?.engineNumber || "";
        chassisNo = orCr?.chassisNumber || crCr?.chassisNumber || "";
      } else if (currentStepNum === 5) {
        plateNo = mvcData?.plateNo || "";
        engineNo = mvcData?.engineNo || mecData?.engineNoStencilled || "";
        chassisNo = mvcData?.chassisNo || mecData?.chassisNoStencilled || "";
      }
    }

    return {
      concernType,
      vehicleSubType,
      subject: `Issue in Clearance Request Step ${currentStepNum}`,
      description: `Encountered an issue during Step ${currentStepNum} of the Clearance Request Flow (${isAgent ? "Agent" : "Citizen"} mode).`,
      vehicleInfo: {
        plateNo,
        make,
        model,
        mvFileNo,
        engineNo,
        chassisNo,
      }
    };
  };

  const handleCreateTicket = async (formData) => {
    const typeLabel =
      formData.vehicleSubType === "dataMismatch"
        ? "Data Mismatch"
        : formData.vehicleSubType === "vehicleNotFound"
          ? "Vehicle Not Found"
          : formData.concernType === "other"
            ? "Other"
            : formData.concernType
              ? formData.concernType.charAt(0).toUpperCase() +
                formData.concernType.slice(1)
              : "General";

    const pad = (n) => String(n).padStart(4, "0");
    const now = new Date();
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const randPart = pad(Math.floor(Math.random() * 9000) + 1000);
    const referenceNumber = `REF-${datePart}-${randPart}`;

    const payload = {
      referenceNumber,
      requestedBy: formData.requestedBy?.name ?? "",
      type: typeLabel,
      status: "PENDING",
      address: formData.description ?? "",
      name: formData.requestedBy?.name ?? "",
      processedBy: null,
      dateRequested: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
      escalated: "NO",
      roleBased: role?.toUpperCase() ?? null,
      plateNo: formData.vehicleInfo?.plateNo ?? null,
      mvFileNo: formData.vehicleInfo?.mvFileNo ?? null,
      make: formData.vehicleInfo?.make ?? null,
      series: formData.vehicleInfo?.model ?? null,
      engineNo: formData.vehicleInfo?.engineNo ?? null,
      chassisNo: formData.vehicleInfo?.chassisNo ?? null,
    };

    const created = await ticketService.create(payload);

    if (isAgent) {
      const tickets = JSON.parse(localStorage.getItem("mock_agent_tickets") || "[]");
      tickets.unshift(payload);
      localStorage.setItem("mock_agent_tickets", JSON.stringify(tickets));
    }

    await showSuccessAlert(
      "Ticket Submitted",
      `Your support ticket has been successfully submitted. Reference Number: ${referenceNumber}`
    );
    return created;
  };

  const canNext = () => {
    if (isAgent) {
      if (step === 1) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every((row) => Boolean(row.voucherId))
        );
      }
      if (step === 2) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every(
            (row) => row.hpgStatus === HPG_STATUS.APPROVED,
          )
        );
      }
      if (step === 3) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every(
            (row) => row.mvcMecValidationState === VALIDATION_STATE.PASSED,
          )
        );
      }
      return false;
    }

    if (step === 1) return Boolean(vehicleOption);
    if (step === 2) {
      const orOk = isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && orNumber && orNumber !== "Extracting...";
      const crOk = isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && crNumber && crNumber !== "Extracting...";
      return Boolean(orOk && crOk && !hasMismatch);
    }
    if (step === 3) return Boolean(paymentDone && voucherAssigned);
    if (step === 4) return hpgVerified;
    if (step === 5) return isDocumentComplete(mvcData) && isDocumentComplete(mecData);
    return false;
  };

  const nextStep = async () => {
    if (step >= maxStep || !canNext()) return;

    if (!isAgent && step === 1) {
      await handleProceedFromStep1();
      return;
    }

    if (!isAgent && step === 2) {
      await handleVerifyStep2();
      return;
    }

    if (!isAgent && step === 5) {
      await validateCitizenMvcMecStep();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const canPrev = () => {
    if (isAgent) return step > 1;

    if (certificateNo) return false;
    if (processingPayment) return false;
    if (paymentDone) return false;
    return step > 1;
  };

  const prevStep = () => {
    if (!canPrev()) return;
    setStep((prev) => prev - 1);
  };

  const finishBulk = () => {
    if (isAgent) {
      const mockRequests = JSON.parse(localStorage.getItem("mock_agent_requests") || "[]");
      const updatedRequests = mockRequests.map(r => {
        if (certificationQueue.some(q => q.id === r.id)) {
          return {
            ...r,
            status: "CERTIFICATE_ISSUED",
            clearanceStatus: "CERTIFICATE_ISSUED",
            currentStep: 4,
          };
        }
        return r;
      });
      localStorage.setItem("mock_agent_requests", JSON.stringify(updatedRequests));
    } else {
      onComplete?.({ rows: certificationQueue });
    }
    navigate("/dci-access/requests");
  };

  const finishCitizen = () => {
    onComplete?.({
      id,
      voucherCode,
      certificateNo,
      vehicle: orCr,
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orCr,
      crCr,
      orNumber,
      crNumber,
      dateCreated,
      currentStep: 6,
      status: "CERTIFICATE_ISSUED",
      voucherStatus: "VOUCHER_ISSUED",
      clearanceStatus: "CERTIFICATE_ISSUED",
      clearanceReferenceNo: certificateNo,
      voucherReferenceNo: voucherCode,
    });
    navigate("/dci-access/requests");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4">
      {idFromQuery && isLoadingRequests ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg w-full max-w-md mt-10">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-4 font-medium animate-pulse">Loading request details...</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">Clearance Request</span>
            <span className="text-xs text-gray-500 ml-auto">
              {role === "agent_fixer" ? "Agent / Fixer" : "Citizen"}
            </span>
          </div>

          <div className="px-6 py-4 bg-[#0059b5]">
            <div className="flex items-center justify-between gap-2">
              {flowSteps.map((label, index) => {
                const idx = index + 1;
                const isCompleted = step > idx;
                const isActive = step === idx;
                return (
                  <div
                    key={label}
                    className="flex-1 text-center relative min-w-0"
                  >
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold
                      ${isCompleted ? "bg-white text-[#0059b5]" : ""}
                      ${isActive ? "bg-white text-[#0059b5] ring-4 ring-white/30" : ""}
                      ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx}
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs mt-2 truncate ${
                        isActive ? "text-white font-medium" : "text-white/60"
                      }`}
                    >
                      {label}
                    </p>
                    {index < flowSteps.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                          isCompleted ? "bg-white" : "bg-white/30"
                        }`}
                        style={{
                          width: "calc(100% - 2rem)",
                          left: "calc(50% + 1rem)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {isAgent && step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <VehicleDocumentUploadCard
                  title="OR"
                  uploadLabel="Upload Official Receipt"
                  onFile={handleOrUpload}
                  preview={orPreview}
                  uploadHint={formatOcrHint(ocrUploadState.or)}
                  numberLabel="OR Number"
                  numberValue={orNumber}
                  onNumberChange={(e) => setOrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from OR"
                  extraInputs={[]}
                  vehicleLabel="Vehicle Details (from OR)"
                  vehicleValues={orCr}
                  vehicleFieldSet="or"
                  onVehicleChange={updateOrCr}
                />

                <VehicleDocumentUploadCard
                  title="CR"
                  uploadLabel="Upload Certificate of Registration"
                  onFile={handleCrUpload}
                  preview={crPreview}
                  uploadHint={formatOcrHint(ocrUploadState.cr)}
                  numberLabel="CR Number"
                  numberValue={crNumber}
                  onNumberChange={(e) => setCrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from CR"
                  vehicleLabel="Vehicle Details (from CR)"
                  vehicleValues={crCr}
                  vehicleFieldSet="cr"
                  onVehicleChange={updateCrCr}
                />
              </div>

              {hasMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Mismatched fields: <strong>{mismatches.join(", ")}</strong>. OR and CR details must match to add queue entry.
                  </p>
                </div>
              )}

              <Card className="mt-4 p-4 border border-blue-100 bg-blue-50/40">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Bulk Queue Staging
                    </p>
                    <p className="text-xs text-gray-600">
                      Upload OR/CR then add each transaction to queue.
                    </p>
                    {(orPreview || crPreview) && (!isDocumentComplete(orCr, OR_EXPECTED_FIELDS) || !orNumber || !isDocumentComplete(crCr, CR_EXPECTED_FIELDS) || !crNumber || hasMismatch) && (
                      <div className="mt-2 text-[11px] text-red-600 space-y-0.5 font-medium">
                        {orPreview && (!orNumber || orNumber === "Extracting...") && <p>• Missing OR Number</p>}
                        {orPreview && getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS)}</p>}
                        {crPreview && (!crNumber || crNumber === "Extracting...") && <p>• Missing CR Number</p>}
                        {crPreview && getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS)}</p>}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleAddToQueue}
                    disabled={
                      !isDocumentComplete(orCr, OR_EXPECTED_FIELDS) || !orNumber || !isDocumentComplete(crCr, CR_EXPECTED_FIELDS) || !crNumber || hasMismatch
                    }
                  >
                    Add To Queue
                  </Button>
                </div>

                {certificationQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No staged entries yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-100 text-left">
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Request ID
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Plate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-blue-50"
                          >
                            <td className="py-2 font-mono text-xs text-gray-700">
                              {row.id}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.plateNumber || "-"}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.orCr?.ownerName ||
                                row.crCr?.ownerName ||
                                "-"}
                            </td>
                            <td className="py-2 text-gray-600">
                              {row.status || "OR_CR_UPLOADED"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {isAgent && step === 2 && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    HPG Portal (Bulk)
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setHpgForAll(HPG_STATUS.INSPECTION)}
                  >
                    Mark All Under Inspection
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setHpgForAll(HPG_STATUS.APPROVED)}
                  >
                    Mark All Approved
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Plate
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        HPG Status
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationQueue.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-2 font-mono text-xs text-gray-700">
                          {row.id}
                        </td>
                        <td className="py-2 text-gray-700">
                          {row.plateNumber || "-"}
                        </td>
                        <td className="py-2 text-gray-700">
                          {row.hpgStatus || HPG_STATUS.PENDING}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setHpgForRow(
                                  row.id,
                                  HPG_STATUS.INSPECTION,
                                )
                              }
                            >
                              Inspection
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                setHpgForRow(row.id, HPG_STATUS.APPROVED)
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                setHpgForRow(row.id, HPG_STATUS.REJECTED)
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {isAgent && step === 3 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Upload size={18} className="text-[#0059b5]" />
                    <h3 className="text-base font-bold text-gray-900">
                      Upload MVCC/MEC (Bulk)
                    </h3>
                  </div>
                  <Button onClick={uploadMvcMecForAll} variant="secondary">
                    Auto Fill All
                  </Button>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Select Request
                  </label>
                  <select
                    value={agentMvcMecId}
                    onChange={(e) => setAgentMvcMecId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select request for MVCC/MEC upload</option>
                    {selectableMvcMecRows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.id} - {row.plateNumber || "NO_PLATE"}
                      </option>
                    ))}
                  </select>
                </div>

                {!agentMvcMecId && (
                  <p className="mb-4 text-xs text-amber-700">
                    No selectable request found. Add a queue entry in step 1
                    first.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MvcMecUploadCard
                    title="MVCC"
                    uploadLabel="Upload Motor Vehicle Clearance Certificate"
                    onFile={handleAgentMvcUpload}
                    preview={agentMvcPreview}
                    uploadHint={formatOcrHint(ocrUploadState.agentMvc)}
                    fields={[
                      {
                        key: "agent-mvc-mvcNo",
                        label: "MVCC Number",
                        value: agentMvcData.mvcNo || "",
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            mvcNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                      {
                        key: "agent-mvc-issueDate",
                        label: "Issue Date",
                        value: agentMvcData.issueDate || "",
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            issueDate: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                      {
                        key: "agent-mvc-engineNo",
                        label: "Engine Number",
                        value: agentMvcData.engineNo,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            engineNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                      {
                        key: "agent-mvc-chassisNo",
                        label: "Chassis Number",
                        value: agentMvcData.chassisNo,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            chassisNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                      {
                        key: "agent-mvc-plateNo",
                        label: "Plate Number",
                        value: agentMvcData.plateNo,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            plateNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                      {
                        key: "agent-mvc-mvFileNo",
                        label: "MV File Number",
                        value: agentMvcData.mvFileNo || agentMvcData.mvFileNumber || "",
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            mvFileNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                      {
                        key: "agent-mvc-color",
                        label: "Color",
                        value: agentMvcData.color,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            color: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVCC",
                      },
                    ]}
                  />

                  <MvcMecUploadCard
                    title="MEC"
                    uploadLabel="Upload Motor Vehicle Emission Certificate"
                    onFile={handleAgentMecUpload}
                    preview={agentMecPreview}
                    uploadHint={formatOcrHint(ocrUploadState.agentMec)}
                    fields={[
                      {
                        key: "agent-mec-engineNoStencilled",
                        label: "Engine Number",
                        value: agentMecData.engineNoStencilled,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            engineNoStencilled: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-chassisNoStencilled",
                        label: "Chassis Number",
                        value: agentMecData.chassisNoStencilled,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            chassisNoStencilled: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-plateNo",
                        label: "Plate Number",
                        value: agentMecData.plateNo,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            plateNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-color",
                        label: "Color",
                        value: agentMecData.color,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            color: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                    ]}
                  />
                </div>

                <div className="mt-4">
                  {(!agentMvcMecId || !agentMvcPreview || !agentMecPreview) && (
                    <div className="mb-3 flex justify-end">
                      <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right">
                        {!agentMvcMecId && <p>• Please select a request from the dropdown</p>}
                        {!agentMvcPreview && <p>• Please upload the MVCC document</p>}
                        {!agentMecPreview && <p>• Please upload the MEC document</p>}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={validateSelectedMvcMecRows}
                      disabled={!hasSelectedMvcMecRows}
                    >
                      Validate
                    </Button>
                    <Button
                      onClick={handleAddAgentMvcMecToQueue}
                      disabled={
                        !agentMvcMecId ||
                        !agentMvcPreview ||
                        !agentMecPreview
                      }
                    >
                      Add To MVC/MEC Queue
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    MVC/MEC Upload Queue
                  </h3>
                </div>
                {certificationQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active requests available in queue.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="pb-2 pr-3 w-10">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#0059b5] focus:ring-[#0059b5]"
                              checked={allMvcMecSelectableSelected}
                              onChange={toggleSelectAllMvcMecRows}
                              aria-label="Select all MVC and MEC rows"
                            />
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Request
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Plate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            MVC
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            MEC
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            DCI Validation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 align-middle pr-3">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-[#0059b5] focus:ring-[#0059b5]"
                                checked={selectedMvcMecIds.includes(
                                  row.id,
                                )}
                                onChange={() =>
                                  toggleSelectedMvcMecRow(row.id)
                                }
                                disabled={!row.mvcMecUploaded}
                                aria-label={`Select MVC and MEC row for ${row.id}`}
                              />
                            </td>
                            <td className="py-2 font-mono text-xs text-gray-700">
                              {row.id}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.plateNumber || "-"}
                            </td>
                            <td className="py-2 text-gray-700 font-mono text-xs">
                              {row.mvcData?.mvcNo || "-"}
                            </td>
                            <td className="py-2 text-gray-700 font-mono text-xs">
                              {row.mecData?.engineNoStencilled || "-"}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.mvcMecValidationState ||
                                VALIDATION_STATE.PENDING}
                              {row.mvcMecValidationMessage
                                ? ` - ${row.mvcMecValidationMessage}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {isAgent && step === 4 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Certificate Issuance (Bulk)
                </h3>
              </div>

              {isIssuingBulk ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">
                    DCI portal is issuing certificates...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Certificates are automatically issued by DCI once all
                    MVC/MEC uploads are validated.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="pb-2 w-28" />
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Request
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Plate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Certificate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 align-middle">
                              <CertificateActionButtons row={row} />
                            </td>
                            <td className="py-2 font-mono text-xs text-gray-700">
                              {row.id}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.plateNumber || "-"}
                            </td>
                            <td className="py-2 font-mono text-xs font-semibold text-gray-900">
                              {row.certificateNo || "-"}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.certificateNo
                                ? "CERTIFICATE_ISSUED"
                                : "READY"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {certificationQueue.every((row) => row.certificateNo) && (
                    <Button onClick={finishBulk}>
                      <CheckCircle size={16} /> Complete
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {!isAgent && step === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto mb-8">
                <h3 className="text-lg font-bold text-gray-900">
                  Select Vehicle Option
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Please choose whether you are applying for an existing vehicle or a new vehicle clearance.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div
                  onClick={() => setVehicleOption("EXISTING")}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 flex flex-col items-center text-center gap-4 ${
                    vehicleOption === "EXISTING"
                      ? "border-[#0059b5] bg-blue-50/50 shadow-md ring-1 ring-[#0059b5]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    vehicleOption === "EXISTING" ? "bg-[#0059b5] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Existing Vehicle</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Clearance for an existing vehicle with active records in the VVS system.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setVehicleOption("NEW")}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 flex flex-col items-center text-center gap-4 ${
                    vehicleOption === "NEW"
                      ? "border-[#0059b5] bg-blue-50/50 shadow-md ring-1 ring-[#0059b5]/20"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    vehicleOption === "NEW" ? "bg-[#0059b5] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">New Vehicle</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Clearance for a brand new, unregistered vehicle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isAgent && step === 2 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <VehicleDocumentUploadCard
                  title="OR"
                  uploadLabel="Upload Official Receipt"
                  onFile={handleOrUpload}
                  preview={orPreview}
                  uploadHint={formatOcrHint(ocrUploadState.or)}
                  numberLabel="OR Number"
                  numberValue={orNumber}
                  onNumberChange={(e) => {
                    setOrNumber(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, orNumber: false }));
                  }}
                  numberPlaceholder="Auto-extracted from OR"
                  extraInputs={[]}
                  vehicleLabel="Vehicle Details (from OR)"
                  vehicleValues={orCr}
                  vehicleFieldSet="or"
                  onVehicleChange={updateOrCr}
                  errors={validationErrors}
                />

                <VehicleDocumentUploadCard
                  title="CR"
                  uploadLabel="Upload Certificate of Registration"
                  onFile={handleCrUpload}
                  preview={crPreview}
                  uploadHint={formatOcrHint(ocrUploadState.cr)}
                  numberLabel="CR Number"
                  numberValue={crNumber}
                  onNumberChange={(e) => {
                    setCrNumber(e.target.value);
                    setValidationErrors((prev) => ({ ...prev, crNumber: false }));
                  }}
                  numberPlaceholder="Auto-extracted from CR"
                  vehicleLabel="Vehicle Details (from CR)"
                  vehicleValues={crCr}
                  vehicleFieldSet="cr"
                  onVehicleChange={updateCrCr}
                  errors={validationErrors}
                />
              </div>
              {hasMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Mismatched fields: <strong>{mismatches.join(", ")}</strong>. OR and CR details must match to proceed.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isAgent && step === 3 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <CreditCard size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Payment</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                <p className="text-sm text-gray-500 mb-1">
                  Certificate Request Fee
                </p>
                <p className="text-3xl font-bold text-gray-900">PHP 60.00</p>
                <p className="text-xs text-gray-500 mt-1">
                  Single payment covers the whole request.
                </p>
              </div>
              {processingPayment ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm font-medium text-gray-700 mt-4 animate-pulse">
                    Verifying Payment Status...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please wait while we confirm your transaction with the payment gateway.
                  </p>
                </div>
              ) : paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle
                    size={44}
                    className="text-green-600 mx-auto mb-3"
                  />
                  <h4 className="text-lg font-bold text-green-800">
                    Payment Successful
                  </h4>
                  {issuingVoucher ? (
                    <div className="mt-4 flex flex-col items-center justify-center gap-2">
                      <Spinner size="md" />
                      <p className="text-xs text-gray-500">
                        Generating voucher reference...
                      </p>
                    </div>
                  ) : voucherAssigned ? (
                    <div className="mt-3">
           
                      <p className="text-xs text-gray-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                        The voucher has been issued for your vehicle (Plate: <strong className="font-bold text-gray-900">{orCr.plateNumber || "N/A"}</strong>).
                        Please click <strong className="font-semibold text-gray-900">Next</strong> to proceed to the HPG Verification step.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-3">
                      Voucher will be issued shortly.
                    </p>
                  )}
                </div>
              ) : (
                <Button onClick={handleProceedToPayment} className="w-full">
                  <CreditCard size={16} /> Proceed to Payment
                </Button>
              )}
            </Card>
          )}

          {!isAgent && step === 4 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  HPG Verification Status
                </h3>
              </div>
              {hpgVerified ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3 animate-bounce" />
                  <p className="font-bold text-green-700 text-lg">
                    HPG Verified
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your vehicle has been successfully verified by HPG.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Voucher Code: <span className="font-mono font-semibold">{voucherCode}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                  <p className="font-bold text-amber-700 text-lg">
                    Verify your voucher code to HPG
                  </p>
                  <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                    Please present your voucher code to the HPG officer for physical inspection and verification.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-3 bg-white border border-amber-300 rounded-lg px-4 py-2 shadow-sm">
                    <div className="text-left">
                      <span className="text-xs text-gray-500 block">VOUCHER CODE</span>
                      <span className="text-base font-mono font-bold text-gray-900 tracking-wider">
                        {voucherCode}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(voucherCode);
                        showSuccessAlert("Copied", "Voucher code copied to clipboard!");
                      }}
                      className="ml-2 py-1 px-3 text-xs"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 animate-pulse">
                    Waiting for HPG officer verification...
                  </p>
                </div>
              )}
            </Card>
          )}

          {!isAgent && step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MvcMecUploadCard
                  title="MVCC"
                  uploadLabel="Upload Motor Vehicle Clearance Certificate"
                  onFile={handleMvcUpload}
                  preview={mvcPreview}
                  uploadHint={formatOcrHint(ocrUploadState.mvc)}
                  fields={[
                    {
                      key: "citizen-mvc-mvcNo",
                      label: "MVCC Number",
                      value: mvcData.mvcNo || "",
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvcNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-issueDate",
                      label: "Issue Date",
                      value: mvcData.issueDate || "",
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          issueDate: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-engineNo",
                      label: "Engine Number",
                      value: mvcData.engineNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          engineNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-chassisNo",
                      label: "Chassis Number",
                      value: mvcData.chassisNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          chassisNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-plateNo",
                      label: "Plate Number",
                      value: mvcData.plateNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          plateNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-mvFileNo",
                      label: "MV File Number",
                      value: mvcData.mvFileNo || mvcData.mvFileNumber || "",
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvFileNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-color",
                      label: "Color",
                      value: mvcData.color,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                  ]}
                />

                <MvcMecUploadCard
                  title="MEC"
                  uploadLabel="Upload Motor Vehicle Emission Certificate"
                  onFile={handleMecUpload}
                  preview={mecPreview}
                  uploadHint={formatOcrHint(ocrUploadState.mec)}
                  fields={[
                    {
                      key: "citizen-mec-engineNoStencilled",
                      label: "Engine Number",
                      value: mecData.engineNoStencilled,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          engineNoStencilled: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-chassisNoStencilled",
                      label: "Chassis Number",
                      value: mecData.chassisNoStencilled,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          chassisNoStencilled: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-plateNo",
                      label: "Plate Number",
                      value: mecData.plateNo,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          plateNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-color",
                      label: "Color",
                      value: mecData.color,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {!isAgent && step === 6 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Issue Certificate
                </h3>
              </div>
              {isIssuingCertificate ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">
                    DCI portal is issuing certificate...
                  </p>
                </div>
              ) : certificateNo ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle
                    size={40}
                    className="text-green-600 mx-auto mb-3"
                  />
                  <p className="font-semibold text-green-700 text-lg">
                    Certificate Issued
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">
                    {certificateNo}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Plate: {orCr.plateNumber}
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={handleDownload} variant="outline">
                      <Download size={16} /> Download
                    </Button>
                    <Button onClick={finishCitizen}>
                      <CheckCircle size={16} /> Complete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Certificate issuance starts automatically after successful
                    MVC/MEC validation.
                  </p>
                </div>
              )}
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <div className="flex gap-2">
              {step === 1 ? (
                <Button variant="ghost" onClick={onCancel}>
                  <X size={16} /> Cancel
                </Button>
              ) : (
                canPrev() && (
                  <Button variant="ghost" onClick={prevStep}>
                    <ChevronLeft size={16} /> Back
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                onClick={() => setIsTicketModalOpen(true)}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Report an Issue
              </Button>
            </div>
            {step < flowSteps.length ? (
              <div className="flex items-center gap-3">
                {!canNext() && step === 2 && !isAgent && (orPreview || crPreview) && (
                  <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                    {orPreview && (!orNumber || orNumber === "Extracting...") && <p>• Missing OR Number</p>}
                    {orPreview && getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS)}</p>}
                    {crPreview && (!crNumber || crNumber === "Extracting...") && <p>• Missing CR Number</p>}
                    {crPreview && getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS)}</p>}
                  </div>
                )}
                {!canNext() && step === 5 && !isAgent && (mvcPreview || mecPreview) && (
                  <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                    {mvcPreview && getMissingFieldsText(mvcData, "MVCC") && <p>• {getMissingFieldsText(mvcData, "MVCC")}</p>}
                    {mecPreview && getMissingFieldsText(mecData, "MEC") && <p>• {getMissingFieldsText(mecData, "MEC")}</p>}
                  </div>
                )}
                <Button onClick={nextStep} disabled={!canNext() || isVerifyingDocuments}>
                  {isVerifyingDocuments ? "Verifying..." : "Next"} <ChevronRight size={16} />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      )}
      <CreateTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={handleCreateTicket}
        prefilledData={getTicketPrefilledData()}
      />
    </div>
  );
}
