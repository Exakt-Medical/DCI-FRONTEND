import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRequest } from "../context/RequestContext";
import { fetchMyRequests } from "../services/certificateRequestService";
import { useAlert } from "./useAlert";
import paymentsService from "../services/paymentsService";
import merchantCallbackService from "../services/merchantCallbackService";
import { transferVoucherService } from "../services/transferVoucherService";
import { voucherInventoryService } from "../services/voucherInventoryService";
import { verificationService } from "../services/verificationService";
import {
  CLEARANCE_OCR_DOCUMENT_TYPE,
  extractClearanceDocumentData,
  OCR_STATUS,
} from "./useOcrForm";
import {
  emptyVehicle,
  emptyMvc,
  emptyMec,
  makeId,
  makeCertificateNo,
  emptyOcrUploadState,
  mergeVehicleFields,
  OR_EXPECTED_FIELDS,
  CR_EXPECTED_FIELDS,
  isDocumentComplete,
  getMissingFieldsText,
  evaluateMvcMecValidation,
} from "../features/clearance-request/utils/clearanceHelpers";
import {
  AGENT_STEPS,
  CITIZEN_STEPS,
  HPG_STATUS,
  VALIDATION_STATE,
} from "../constants/clearanceRequestConfig";
import { VOUCHER_INVENTORY_STATUS } from "../constants/voucherInventoryStatus";

export const useClearanceRequestFlow = () => {
  const { error: showError } = useAlert();
  const { role } = useAuth();
  const {
    voucherInventory,
    setVoucherInventory,
    handleRequestSave: onSaveRequest,
    handleClearanceRequestComplete: onComplete,
  } = useRequest();

  const [availableVoucherRequests, setAvailableVoucherRequests] = useState([]);

  const loadAllRequests = async () => {
    try {
      const data = await fetchMyRequests();
      setAvailableVoucherRequests(data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, []);

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

  useEffect(() => {
    if (selectedRequest) {
      if (selectedRequest.id && !id) setId(selectedRequest.id);
      if (selectedRequest.currentStep) setStep(Math.min(selectedRequest.currentStep, maxStep));
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

    if (selectedRequest?.id) {
      return [
        {
          ...selectedRequest,
          hpgStatus: selectedRequest.hpgStatus || HPG_STATUS.PENDING,
          mvcMecUploaded: Boolean(
            selectedRequest.mvcData?.mvcNo && selectedRequest.mecData?.engineNoStencilled,
          ),
        },
      ];
    }
    return [];
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

  const updateOrCr = (field, value) =>
    setOrCr((prev) => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
  const updateCrCr = (field, value) =>
    setCrCr((prev) => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));

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
      verificationId: selectedRequest?.verificationId || "",
      ...overrides,
    };

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

    const orOk = isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && orNumber && orNumber !== "Extracting...";
    const crOk = isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && crNumber && crNumber !== "Extracting...";
    if (!(orOk && crOk && !hasMismatch)) return;

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
          engineNo: uploadPayload.mvcData?.engineNo || row.engineNumber || row.orCr?.engineNumber || row.crCr?.engineNumber || "",
          chassisNo: uploadPayload.mvcData?.chassisNo || row.chassisNumber || row.orCr?.chassisNumber || row.crCr?.chassisNumber || "",
          plateNo: uploadPayload.mvcData?.plateNo || row.plateNumber || "",
          color: uploadPayload.mvcData?.color || row.color || row.orCr?.color || row.crCr?.color || "",
          makeType: uploadPayload.mvcData?.makeType || row.orCr?.makeType || row.crCr?.makeType || "",
        };
        const nextMecData = {
          engineNoStencilled: uploadPayload.mecData?.engineNoStencilled || row.engineNumber || row.orCr?.engineNumber || row.crCr?.engineNumber || "",
          chassisNoStencilled: uploadPayload.mecData?.chassisNoStencilled || row.chassisNumber || row.orCr?.chassisNumber || row.crCr?.chassisNumber || "",
          plateNo: uploadPayload.mecData?.plateNo || row.plateNumber || "",
          color: uploadPayload.mecData?.color || row.color || row.orCr?.color || row.crCr?.color || "",
          makeType: uploadPayload.mecData?.makeType || row.orCr?.makeType || row.crCr?.makeType || "",
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
          const targetVehicle = row.orCr || row.crCr || row;
          const validation = evaluateMvcMecValidation(row.mvcData, row.mecData, {
            ...targetVehicle,
            verificationStatus: targetVehicle.verificationStatus || row.verificationStatus,
          });
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
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
      makeType: "Extracting...",
    }));

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MVC,
      );
      if (!isCurrentOcrVersion("agentMvc", runId)) return;

      const parsed = result.fields || {};
      setAgentMvcData({
        engineNo: String(parsed.engineNo || parsed.engineNumber || previousState.engineNo || "").toUpperCase(),
        chassisNo: String(parsed.chassisNo || parsed.chassisNumber || previousState.chassisNo || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        color: String(parsed.color || previousState.color || "").toUpperCase(),
        makeType: String(parsed.makeType || parsed.vehicleType || parsed.makeBrand || previousState.makeType || "").toUpperCase(),
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
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
      makeType: "Extracting...",
    }));

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
        makeType: String(parsed.makeType || parsed.vehicleType || parsed.makeBrand || previousState.makeType || "").toUpperCase(),
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
    if (!agentMvcMecRequestId) return;
    if (!isDocumentComplete(agentMvcData) || !isDocumentComplete(agentMecData)) return;

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
        mvcMecValidationState: VALIDATION_STATE.VALIDATING,
        mvcMecValidationMessage: "DCI validation in progress...",
      });

      // Simulate DCI validation latency
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const validation = evaluateMvcMecValidation(mvcData, mecData, {
        ...orCr,
        verificationStatus: orCr.verificationStatus || selectedRequest?.verificationStatus,
      });

      if (!validation.valid) {
        setCitizenValidationState(VALIDATION_STATE.FAILED);
        setCitizenValidationMessage(validation.reason);
        setRequestStatus("MVC_MEC_VALIDATION_PENDING");

        await saveCitizenRequest({
          currentStep: 5,
          status: "MVC_MEC_VALIDATION_PENDING",
          mvcMecValidationState: VALIDATION_STATE.FAILED,
          mvcMecValidationMessage: validation.reason,
          clearanceStatus: "PENDING_VALIDATION",
        });

        await showError("DCI Validation Failed", validation.reason);
        return;
      }

      setCitizenValidationState(VALIDATION_STATE.PASSED);
      setCitizenValidationMessage(validation.reason);
      setRequestStatus("MVC_MEC_VALIDATED");
      setStep(6);

      await saveCitizenRequest({
        currentStep: 6,
        status: "MVC_MEC_VALIDATED",
        mvcMecValidationState: VALIDATION_STATE.PASSED,
        mvcMecValidationMessage: validation.reason,
      });
    } catch (error) {
      await showError(
        "DCI Validation Error",
        error?.message || "An error occurred during DCI validation.",
      );
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
          const updated = {
            ...row,
            certificateNo: "", // Let backend generate a unique certificate number
            clearanceReferenceNo: "",
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

    setMvcData((prev) => ({
      ...prev,
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
      makeType: "Extracting...",
    }));

    try {
      const result = await extractClearanceDocumentData(
        file,
        CLEARANCE_OCR_DOCUMENT_TYPE.MVC,
      );
      if (!isCurrentOcrVersion("mvc", runId)) return;

      const parsed = result.fields || {};
      const next = {
        engineNo: String(parsed.engineNo || parsed.engineNumber || previousState.engineNo || "").toUpperCase(),
        chassisNo: String(parsed.chassisNo || parsed.chassisNumber || previousState.chassisNo || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        color: String(parsed.color || previousState.color || "").toUpperCase(),
        makeType: String(parsed.makeType || previousState.makeType || "").toUpperCase(),
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
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
      makeType: "Extracting...",
    }));

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
        makeType: String(parsed.makeType || previousState.makeType || "").toUpperCase(),
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

  // Fix for Add to Queue double-click
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);

  // We need to overwrite handleAddToQueue
  const originalHandleAddToQueue = handleAddToQueue;
  const safeHandleAddToQueue = async () => {
    if (isAddingToQueue) return;
    setIsAddingToQueue(true);
    try {
      await originalHandleAddToQueue();
    } finally {
      setIsAddingToQueue(false);
    }
  };

  return {
    showError,
    role,
    availableVoucherRequests,
    setAvailableVoucherRequests,
    loadAllRequests,
    location,
    navigate,
    searchParams,
    idFromQuery,
    paymentTransactionId,
    selectedRequest,
    onCancel,
    isAgent,
    flowSteps,
    maxStep,
    handledPaymentTransactionRef,
    id,
    setId,
    step,
    setStep,
    requestStatus,
    setRequestStatus,
    dateCreated,
    orPreview,
    setOrPreview,
    orNumber,
    setOrNumber,
    orCr,
    setOrCr,
    crPreview,
    setCrPreview,
    crNumber,
    setCrNumber,
    crCr,
    setCrCr,
    processingPayment,
    setProcessingPayment,
    isVerifyingDocuments,
    setIsVerifyingDocuments,
    paymentDone,
    setPaymentDone,
    issuingVoucher,
    setIssuingVoucher,
    fetchVoucherFailed,
    setFetchVoucherFailed,
    voucherCode,
    setVoucherCode,
    voucherAssigned,
    setVoucherAssigned,
    hpgVerified,
    setHpgVerified,
    mvcPreview,
    setMvcPreview,
    mvcFileName,
    setMvcFileName,
    mvcData,
    setMvcData,
    mecPreview,
    setMecPreview,
    mecFileName,
    setMecFileName,
    mecData,
    setMecData,
    agentMvcPreview,
    setAgentMvcPreview,
    agentMvcFileName,
    setAgentMvcFileName,
    agentMvcData,
    setAgentMvcData,
    agentMecPreview,
    setAgentMecPreview,
    agentMecFileName,
    setAgentMecFileName,
    agentMecData,
    setAgentMecData,
    agentMvcMecId,
    setAgentMvcMecId,
    isIssuingBulk,
    setIsIssuingBulk,
    isIssuingCertificate,
    setIsIssuingCertificate,
    certificateNo,
    setCertificateNo,
    selectedMvcMecIds,
    setSelectedMvcMecIds,
    citizenValidationState,
    setCitizenValidationState,
    citizenValidationMessage,
    setCitizenValidationMessage,
    ocrUploadState,
    setOcrUploadState,
    ocrUploadVersionRef,
    queueRows,
    setQueueRows,
    getMismatches,
    mismatches,
    hasMismatch,
    updateOrCr,
    updateCrCr,
    isResume,
    fallbackRows,
    certificationQueue,
    pendingMvcMecRows,
    selectableMvcMecRows,
    getQueueTimestamp,
    clearOrCrForm,
    nextOcrVersion,
    isCurrentOcrVersion,
    setOcrState,
    persistRow,
    saveCitizenRequest,
    handleOrUpload,
    handleCrUpload,
    handleAddToQueue,
    updateVoucherInventory,
    setHpgForRow,
    setHpgForAll,
    uploadMvcMecForRow,
    uploadMvcMecForAll,
    validateMvcMecForRow,
    validateSelectedMvcMecRows,
    toggleSelectedMvcMecRow,
    toggleSelectAllMvcMecRows,
    selectedMvcMecRows,
    allMvcMecSelectableSelected,
    hasSelectedMvcMecRows,
    clearAgentMvcMecForm,
    handleAgentMvcUpload,
    handleAgentMecUpload,
    handleAddAgentMvcMecToQueue,
    validateCitizenMvcMecStep,
    issueCertificatesForAll,
    handleProceedToPayment,
    handleMvcUpload,
    handleMecUpload,
    handleDownload,
    verifyCitizenDocuments,
    isAddingToQueue,
    handleAddToQueue: safeHandleAddToQueue
  };
};
