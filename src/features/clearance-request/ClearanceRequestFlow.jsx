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
  mvcIssueDate: "",
  mvcValidUntil: "",
  mvcStatus: "",
};

const emptyMec = {
  mecNo: "",
  mecIssueDate: "",
  mecValidUntil: "",
  mecCo2: "",
  mecHc: "",
  mecResult: "",
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
      merged[key] = value.trim();
    }
  });
  return merged;
};

const evaluateMvcMecValidation = (mvcPayload, mecPayload) => {
  if (!mvcPayload?.mvcNo || !mecPayload?.mecNo) {
    return { valid: false, reason: "Missing MVC/MEC reference number." };
  }
  if (mvcPayload.mvcStatus && mvcPayload.mvcStatus.toUpperCase() !== "CLEAR") {
    return { valid: false, reason: "MVC status is not CLEAR." };
  }
  if (mecPayload.mecResult && mecPayload.mecResult.toUpperCase() !== "PASS") {
    return { valid: false, reason: "MEC result is not PASS." };
  }
  if (!mvcPayload.mvcIssueDate || !mecPayload.mecIssueDate) {
    return { valid: false, reason: "Issue date is required for MVC and MEC." };
  }
  return { valid: true, reason: "Validated by DCI portal." };
};

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRequest } from "../../context/RequestContext";

export const ClearanceRequestFlow = () => {
  const { error: showError } = useAlert();
  const { role } = useAuth();
  const {
    requestRecords: availableVoucherRequests,
    voucherInventory,
    setVoucherInventory,
    handleRequestSave: onSaveRequest,
    handleClearanceRequestComplete: onComplete,
  } = useRequest();

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
      (item) => item.id === idFromQuery,
    ) ||
    null;
  const onCancel = () => navigate("/dci-access/requests");
  const isAgent = role === "agent_fixer";
  const flowSteps = isAgent ? AGENT_STEPS : CITIZEN_STEPS;
  const maxStep = flowSteps.length;
  const handledPaymentTransactionRef = useRef("");

  const [id, setId] = useState(
    () => selectedRequest?.id || idFromQuery || "",
  );

  useEffect(() => {
    if (id) {
      const params = new URLSearchParams(location.search);
      if (params.get("id") !== String(id)) {
        params.set("id", id);
        navigate({ search: params.toString() }, { replace: true });
      }
    }
  }, [id, location.search, navigate]);
  const [step, setStep] = useState(() => {
    const storedStep = selectedRequest?.currentStep || 1;
    return Math.min(storedStep, maxStep);
  });
  const [requestStatus, setRequestStatus] = useState(
    () => selectedRequest?.status || "DRAFT",
  );
  const [dateCreated] = useState(
    () =>
      selectedRequest?.dateCreated || new Date().toISOString().split("T")[0],
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

    if (selectedRequest?.id) {
      return [
        {
          ...selectedRequest,
          hpgStatus: selectedRequest.hpgStatus || HPG_STATUS.PENDING,
          mvcMecUploaded: Boolean(
            selectedRequest.mvcData?.mvcNo && selectedRequest.mecData?.mecNo,
          ),
        },
      ];
    }
    return [];
  });

  const plateMismatch =
    orCr.plateNumber &&
    crCr.plateNumber &&
    orCr.plateNumber !== crCr.plateNumber;

  const updateOrCr = (field, value) =>
    setOrCr((prev) => ({ ...prev, [field]: value }));
  const updateCrCr = (field, value) =>
    setCrCr((prev) => ({ ...prev, [field]: value }));

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
        mvcMecUploaded: Boolean(item.mvcData?.mvcNo && item.mecData?.mecNo),
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
    if (onSaveRequest) {
      return await onSaveRequest({
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
      orNumber,
      crNumber,
      orCr,
      crCr,
      orPreview,
      crPreview,
      mvcPreview,
      mecPreview,
      mvcFileName,
      mecFileName,
      mvcData,
      mecData,
      ...overrides,
    };

    if (onSaveRequest) {
      const savedId = await onSaveRequest(record);
      if (savedId && !id) {
        setId(savedId);
        record.id = savedId;
      }
    }
    return record;
  };

  const handleOrUpload = async (file, preview) => {
    setOrPreview(preview);
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
    updateOrCr("plateNumber", "Extracting...");

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
    updateCrCr("plateNumber", "Extracting...");

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

    const orOk =
      orCr.plateNumber &&
      orCr.ownerName &&
      orCr.plateNumber !== "Extracting...";
    const crOk =
      crCr.plateNumber &&
      crCr.ownerName &&
      crCr.plateNumber !== "Extracting...";
    const match = orCr.plateNumber === crCr.plateNumber;
    if (!(orOk && crOk && match)) return;

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
        const nextMvcData = uploadPayload.mvcData?.mvcNo
          ? uploadPayload.mvcData
          : {
              mvcNo: `MVC-${String(Date.now()).slice(-8)}`,
              mvcIssueDate: now,
              mvcValidUntil: "2026-12-31",
              mvcStatus: "CLEAR",
            };
        const nextMecData = uploadPayload.mecData?.mecNo
          ? uploadPayload.mecData
          : {
              mecNo: `MEC-${String(Date.now()).slice(-8)}`,
              mecIssueDate: now,
              mecValidUntil: "2026-12-31",
              mecCo2: "0.85 g/km",
              mecHc: "0.12 g/km",
              mecResult: "PASS",
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
          const validation = evaluateMvcMecValidation(row.mvcData, row.mecData);
          const validated = {
            ...row,
            mvcMecValidationState: validation.valid
              ? VALIDATION_STATE.PASSED
              : VALIDATION_STATE.FAILED,
            mvcMecValidationMessage: validation.reason,
            status: validation.valid
              ? "MVC_MEC_VALIDATED"
              : "MVC_MEC_VALIDATION_PENDING",
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

    setAgentMvcData((prev) => ({
      ...prev,
      mvcNo: "Extracting...",
      mvcIssueDate: "Extracting...",
      mvcValidUntil: "Extracting...",
      mvcStatus: "Extracting...",
    }));

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MVC,
      );
      if (!isCurrentOcrVersion("agentMvc", runId)) return;

      const parsed = result.fields || {};
      setAgentMvcData({
        mvcNo: parsed.mvcNo || previousState.mvcNo || "",
        mvcIssueDate: parsed.mvcIssueDate || previousState.mvcIssueDate || "",
        mvcValidUntil:
          parsed.mvcValidUntil || previousState.mvcValidUntil || "",
        mvcStatus: parsed.mvcStatus || previousState.mvcStatus || "",
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

    setAgentMecData((prev) => ({
      ...prev,
      mecNo: "Extracting...",
      mecIssueDate: "Extracting...",
      mecValidUntil: "Extracting...",
      mecCo2: "Extracting...",
      mecHc: "Extracting...",
      mecResult: "Extracting...",
    }));

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MEC,
      );
      if (!isCurrentOcrVersion("agentMec", runId)) return;

      const parsed = result.fields || {};
      setAgentMecData({
        mecNo: parsed.mecNo || previousState.mecNo || "",
        mecIssueDate: parsed.mecIssueDate || previousState.mecIssueDate || "",
        mecValidUntil:
          parsed.mecValidUntil || previousState.mecValidUntil || "",
        mecCo2: parsed.mecCo2 || previousState.mecCo2 || "",
        mecHc: parsed.mecHc || previousState.mecHc || "",
        mecResult: parsed.mecResult || previousState.mecResult || "",
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
    if (!agentMvcData.mvcNo || !agentMecData.mecNo) return;
    if (
      agentMvcData.mvcNo === "Extracting..." ||
      agentMecData.mecNo === "Extracting..."
    ) {
      return;
    }

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

  const validateCitizenMvcMec = () => {
    if (!mvcData.mvcNo || !mecData.mecNo) return;

    setCitizenValidationState(VALIDATION_STATE.VALIDATING);
    setCitizenValidationMessage("DCI validation in progress...");
    setRequestStatus("MVC_MEC_VALIDATING");
    saveCitizenRequest({
      currentStep: 5,
      status: "MVC_MEC_VALIDATING",
      mvcMecValidationState: VALIDATION_STATE.VALIDATING,
      mvcMecValidationMessage: "DCI validation in progress...",
    });

    setTimeout(() => {
      const validation = evaluateMvcMecValidation(mvcData, mecData);
      if (!validation.valid) {
        setCitizenValidationState(VALIDATION_STATE.FAILED);
        setCitizenValidationMessage(validation.reason);
        setRequestStatus("MVC_MEC_VALIDATION_PENDING");
        saveCitizenRequest({
          currentStep: 5,
          status: "MVC_MEC_VALIDATION_PENDING",
          mvcMecValidationState: VALIDATION_STATE.FAILED,
          mvcMecValidationMessage: validation.reason,
          clearanceStatus: "PENDING_VALIDATION",
        });
        return;
      }

      setCitizenValidationState(VALIDATION_STATE.PASSED);
      setCitizenValidationMessage(validation.reason);
      setRequestStatus("MVC_MEC_VALIDATED");
      setStep(6);
      saveCitizenRequest({
        currentStep: 6,
        status: "MVC_MEC_VALIDATED",
        mvcMecValidationState: VALIDATION_STATE.PASSED,
        mvcMecValidationMessage: validation.reason,
      });
    }, 1500);
  };

  const issueCertificatesForAll = () => {
    if (isIssuingBulk) return;
    setIsIssuingBulk(true);

    setTimeout(() => {
      setQueueRows((prev) => {
        const source = prev.length > 0 ? prev : fallbackRows;
        const next = source.map((row, idx) => {
          if (row.certificateNo) return row;
          const certNo = makeCertificateNo(idx);
          const updated = {
            ...row,
            certificateNo: certNo,
            clearanceReferenceNo: certNo,
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
      const certNo = makeCertificateNo(0);
      setCertificateNo(certNo);
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      saveCitizenRequest({
        currentStep: 6,
        status: "CERTIFICATE_ISSUED",
        certificateNo: certNo,
        clearanceReferenceNo: certNo,
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
      await showError(
        "Payment Initialization Failed",
        error?.response?.data?.error ||
          error?.message ||
          "Unable to start TLPE payment.",
      );
    }
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

  const handleCitizenHpgVerify = () => {
    setHpgVerified(true);
    setRequestStatus("HPG_VERIFIED");
    setStep(5);
    saveCitizenRequest({
      currentStep: 5,
      status: "HPG_VERIFIED",
      hpgVerified: true,
    });
  };

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

    setMvcData((prev) => ({
      ...prev,
      mvcNo: "Extracting...",
      mvcIssueDate: "Extracting...",
      mvcValidUntil: "Extracting...",
      mvcStatus: "Extracting...",
    }));

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MVC,
      );
      if (!isCurrentOcrVersion("mvc", runId)) return;

      const parsed = result.fields || {};
      const next = {
        mvcNo: parsed.mvcNo || previousState.mvcNo || "",
        mvcIssueDate: parsed.mvcIssueDate || previousState.mvcIssueDate || "",
        mvcValidUntil:
          parsed.mvcValidUntil || previousState.mvcValidUntil || "",
        mvcStatus: parsed.mvcStatus || previousState.mvcStatus || "",
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

    setMecData((prev) => ({
      ...prev,
      mecNo: "Extracting...",
      mecIssueDate: "Extracting...",
      mecValidUntil: "Extracting...",
      mecCo2: "Extracting...",
      mecHc: "Extracting...",
      mecResult: "Extracting...",
    }));

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MEC,
      );
      if (!isCurrentOcrVersion("mec", runId)) return;

      const parsed = result.fields || {};
      const next = {
        mecNo: parsed.mecNo || previousState.mecNo || "",
        mecIssueDate: parsed.mecIssueDate || previousState.mecIssueDate || "",
        mecValidUntil:
          parsed.mecValidUntil || previousState.mecValidUntil || "",
        mecCo2: parsed.mecCo2 || previousState.mecCo2 || "",
        mecHc: parsed.mecHc || previousState.mecHc || "",
        mecResult: parsed.mecResult || previousState.mecResult || "",
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

  const handleDownload = () => {
    if (!certificateNo) return;
    const { doc, filename } = generateClearanceCertificatePDF({
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

    setIsVerifyingDocuments(true);
    try {
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

    if (step === 1) {
      if (isVerifyingDocuments) return false;
      const orOk =
        orCr.plateNumber &&
        orCr.ownerName &&
        orCr.plateNumber !== "Extracting...";
      const crOk =
        crCr.plateNumber &&
        crCr.ownerName &&
        crCr.plateNumber !== "Extracting...";
      return Boolean(orOk && crOk && !plateMismatch);
    }
    if (step === 2) return paymentDone;
    if (step === 3) return voucherAssigned;
    if (step === 4) return hpgVerified;
    if (step === 5)
      return (
        citizenValidationState === VALIDATION_STATE.PASSED && voucherAssigned
      );
    return false;
  };

  const nextStep = async () => {
    if (step >= maxStep || !canNext()) return;

    if (!isAgent && step === 1) {
      await verifyCitizenDocuments();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const canPrev = () => {
    if (isAgent) return step > 1;

    if (certificateNo) return false;
    if (processingPayment) return false;
    if (paymentDone) {
      const target = step - 1;
      if (target < 3) return false;
    }
    return step > 1;
  };

  const prevStep = () => {
    if (!canPrev()) return;
    setStep((prev) => prev - 1);
  };

  const finishBulk = () => {
    onComplete?.({ rows: certificationQueue });
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

              {plateMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Plate number mismatch: OR says{" "}
                    <strong>{orCr.plateNumber}</strong>, CR says{" "}
                    <strong>{crCr.plateNumber}</strong>. Both must match to add
                    queue entry.
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
                  </div>
                  <Button
                    onClick={handleAddToQueue}
                    disabled={
                      !orCr.plateNumber || !crCr.plateNumber || plateMismatch
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
                    uploadLabel="Upload Motor Vehicle Clearance"
                    onFile={handleAgentMvcUpload}
                    preview={agentMvcPreview}
                    uploadHint={formatOcrHint(ocrUploadState.agentMvc)}
                    fields={[
                      {
                        key: "agent-mvc-number",
                        label: "MVC Number",
                        value: agentMvcData.mvcNo,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            mvcNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVC",
                      },
                      {
                        key: "agent-mvc-issue-date",
                        label: "Issue Date",
                        value: agentMvcData.mvcIssueDate,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            mvcIssueDate: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVC",
                      },
                      {
                        key: "agent-mvc-valid-until",
                        label: "Valid Until",
                        value: agentMvcData.mvcValidUntil,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            mvcValidUntil: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVC",
                      },
                      {
                        key: "agent-mvc-status",
                        label: "Status",
                        value: agentMvcData.mvcStatus,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({
                            ...prev,
                            mvcStatus: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MVC",
                      },
                    ]}
                  />

                  <MvcMecUploadCard
                    title="MEC"
                    uploadLabel="Upload Motor Vehicle Emission"
                    onFile={handleAgentMecUpload}
                    preview={agentMecPreview}
                    uploadHint={formatOcrHint(ocrUploadState.agentMec)}
                    fields={[
                      {
                        key: "agent-mec-number",
                        label: "MEC Number",
                        value: agentMecData.mecNo,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            mecNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-issue-date",
                        label: "Issue Date",
                        value: agentMecData.mecIssueDate,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            mecIssueDate: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-valid-until",
                        label: "Valid Until",
                        value: agentMecData.mecValidUntil,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            mecValidUntil: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-co2",
                        label: "CO2",
                        value: agentMecData.mecCo2,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            mecCo2: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-hc",
                        label: "HC",
                        value: agentMecData.mecHc,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            mecHc: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-result",
                        label: "Result",
                        value: agentMecData.mecResult,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            mecResult: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                    ]}
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="flex gap-2">
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
                        !agentMvcData.mvcNo ||
                        !agentMecData.mecNo ||
                        agentMvcData.mvcNo === "Extracting..." ||
                        agentMecData.mecNo === "Extracting..."
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
                              {row.mecData?.mecNo || "-"}
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
              {plateMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Plate number mismatch: OR says{" "}
                    <strong>{orCr.plateNumber}</strong>, CR says{" "}
                    <strong>{crCr.plateNumber}</strong>. Both must match to
                    proceed.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isAgent && step === 2 && (
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
                <div className="text-center py-4">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">
                    Processing payment...
                  </p>
                </div>
              ) : paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle
                    size={24}
                    className="text-green-600 mx-auto mb-2"
                  />
                  <p className="font-semibold text-green-700">
                    Payment Completed
                  </p>
                </div>
              ) : (
                <Button onClick={handleProceedToPayment} className="w-full">
                  <CreditCard size={16} /> Proceed to Payment
                </Button>
              )}
            </Card>
          )}

          {!isAgent && step === 3 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Ticket size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Issue Voucher
                </h3>
              </div>
              {issuingVoucher ? (
                <div className="text-center py-5">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">
                    Generating voucher...
                  </p>
                </div>
              ) : voucherAssigned ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle
                      size={40}
                      className="text-green-600 mx-auto mb-3"
                    />
                    <p className="font-semibold text-green-700 text-lg">
                      Voucher Issued
                    </p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-2">
                      {voucherCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Plate: {orCr.plateNumber}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">
                    Voucher issues automatically after payment.
                  </p>
                </div>
              )}
            </Card>
          )}

          {!isAgent && step === 4 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  HPG Pending
                </h3>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  Please present your voucher to HPG/LTO. In this frontend demo,
                  click the button below to simulate verification.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Voucher Code:{" "}
                  <span className="font-mono font-semibold">{voucherCode}</span>
                </p>
              </div>
              <div className="mt-4">
                <Button onClick={handleCitizenHpgVerify}>
                  <CheckCircle size={16} /> Has been verified by HPG
                </Button>
              </div>
            </Card>
          )}

          {!isAgent && step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MvcMecUploadCard
                  title="MVCC"
                  uploadLabel="Upload Motor Vehicle Clearance"
                  onFile={handleMvcUpload}
                  preview={mvcPreview}
                  uploadHint={formatOcrHint(ocrUploadState.mvc)}
                  fields={[
                    {
                      key: "citizen-mvc-number",
                      label: "MVCC Number",
                      value: mvcData.mvcNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvcNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-issue-date",
                      label: "Issue Date",
                      value: mvcData.mvcIssueDate,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvcIssueDate: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-valid-until",
                      label: "Valid Until",
                      value: mvcData.mvcValidUntil,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvcValidUntil: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-status",
                      label: "Status",
                      value: mvcData.mvcStatus,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvcStatus: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVC",
                    },
                  ]}
                />

                <MvcMecUploadCard
                  title="MEC"
                  uploadLabel="Upload Motor Vehicle Emission"
                  onFile={handleMecUpload}
                  preview={mecPreview}
                  uploadHint={formatOcrHint(ocrUploadState.mec)}
                  fields={[
                    {
                      key: "citizen-mec-number",
                      label: "MEC Number",
                      value: mecData.mecNo,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          mecNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-issue-date",
                      label: "Issue Date",
                      value: mecData.mecIssueDate,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          mecIssueDate: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-valid-until",
                      label: "Valid Until",
                      value: mecData.mecValidUntil,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          mecValidUntil: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-co2",
                      label: "CO2",
                      value: mecData.mecCo2,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          mecCo2: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-hc",
                      label: "HC",
                      value: mecData.mecHc,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          mecHc: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-result",
                      label: "Result",
                      value: mecData.mecResult,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          mecResult: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                  ]}
                />
              </div>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      DCI Validation
                    </p>
                    <p className="text-xs text-gray-600">
                      DCI portal validates MVCC/MEC before certificate issuance.
                    </p>
                  </div>
                  <Button
                    onClick={validateCitizenMvcMec}
                    disabled={
                      !mvcData.mvcNo ||
                      !mecData.mecNo ||
                      citizenValidationState === VALIDATION_STATE.VALIDATING
                    }
                  >
                    {citizenValidationState === VALIDATION_STATE.VALIDATING
                      ? "Validating..."
                      : "Validate with DCI"}
                  </Button>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  Status:{" "}
                  <span className="font-semibold">
                    {citizenValidationState}
                  </span>
                  {citizenValidationMessage
                    ? ` - ${citizenValidationMessage}`
                    : ""}
                </div>
                {citizenValidationState === VALIDATION_STATE.FAILED && (
                  <p className="mt-2 text-xs text-amber-700">
                    Validation failed. Request remains pending and cannot
                    proceed to certificate issuance.
                  </p>
                )}
              </Card>
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
            <div>
              {step > 1 ? (
                <Button
                  variant="secondary"
                  onClick={prevStep}
                  disabled={!canPrev()}
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
              ) : (
                <Button variant="ghost" onClick={onCancel}>
                  <X size={16} /> Cancel
                </Button>
              )}
            </div>
            {step < flowSteps.length ? (
              <Button
                onClick={nextStep}
                disabled={!canNext() || isVerifyingDocuments}
              >
                {isVerifyingDocuments ? "Verifying..." : "Next"}{" "}
                <ChevronRight size={16} />
              </Button>
            ) : !isAgent && certificateNo ? (
              <Button onClick={finishCitizen}>
                <CheckCircle size={16} /> Complete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
