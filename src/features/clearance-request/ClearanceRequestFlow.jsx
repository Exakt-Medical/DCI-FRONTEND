import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import {
  AGENT_STEPS,
  CITIZEN_STEPS,
  HPG_STATUS,
  VALIDATION_STATE,
} from "../../constants/clearanceRequestConfig";
import {
  MvcMecUploadCard,
  VehicleDocumentUploadCard,
} from "./components/FlowFormCards";
import { CertificateActionButtons } from "./components/CertificateActionButtons";
import { formatOcrHint } from "../../hooks/useOcrForm";
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";
import { useAuth } from "../../context/AuthContext";
import { useRequest } from "../../context/RequestContext";
import { fetchMyRequests } from "../../services/certificateRequestService";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";
import { ticketService } from "../../services/ticketService";

// ── Extracted utilities & hooks ──────────────────────────────────────────────
import {
  emptyVehicle,
  emptyMvc,
  emptyMec,
  emptyOcrUploadState,
  OR_EXPECTED_FIELDS,
  CR_EXPECTED_FIELDS,
  isDocumentComplete,
  getMissingFieldsText,
  mergeVehicleFields,
} from "./utils/clearanceRequestUtils";
import { useOrCrOcr } from "./hooks/useOrCrOcr";
import { useCitizenPayment } from "./hooks/useCitizenPayment";
import { useAgentQueue } from "./hooks/useAgentQueue";

export const ClearanceRequestFlow = () => {
  const { error: showError, success: showSuccessAlert } = useAlert();
  const { role } = useAuth();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const {
    voucherInventory,
    setVoucherInventory,
    handleRequestSave: onSaveRequest,
    handleClearanceRequestComplete: onComplete,
  } = useRequest();

  const [availableVoucherRequests, setAvailableVoucherRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const loadAllRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const data = await fetchMyRequests();
      setAvailableVoucherRequests(data || []);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setIsLoadingRequests(false);
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
      (item) => String(item.id) === String(idFromQuery),
    ) ||
    null;
  const onCancel = () => navigate("/dci-access/requests");
  const isAgent = role === "agent_fixer";
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

  const [isVerifyingDocuments, setIsVerifyingDocuments] = useState(false);
  const [paymentDone, setPaymentDone] = useState(
    Boolean(isAgent || selectedRequest?.paymentDone),
  );
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

  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [certificateNo, setCertificateNo] = useState(
    selectedRequest?.certificateNo || "",
  );
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

  // ── useAgentQueue hook ────────────────────────────────────────────────────
  const agentQueue = useAgentQueue({
    isAgent,
    role,
    step,
    selectedRequest,
    availableVoucherRequests,
    voucherInventory,
    setVoucherInventory,
    onSaveRequest,
    showError,
    orCr,
    crCr,
    orNumber,
    crNumber,
    orPreview,
    crPreview,
    hasMismatch,
    setOrPreview,
    setCrPreview,
    setOrNumber,
    setCrNumber,
    setOrCr,
    setCrCr,
    setOcrUploadState: null,
    emptyOcrUploadState,
  });
  const {
    queueRows, setQueueRows,
    selectedMvcMecIds, setSelectedMvcMecIds,
    isIssuingBulk,
    certificationQueue, fallbackRows,
    pendingMvcMecRows, selectableMvcMecRows,
    selectedMvcMecRows, allMvcMecSelectableSelected, hasSelectedMvcMecRows,
    persistRow, clearOrCrForm,
    handleAddToQueue,
    setHpgForRow, setHpgForAll,
    uploadMvcMecForRow, uploadMvcMecForAll,
    validateMvcMecForRow, validateSelectedMvcMecRows,
    toggleSelectedMvcMecRow, toggleSelectAllMvcMecRows,
    handleAddAgentMvcMecToQueue: _handleAddAgentMvcMecToQueue,
    issueCertificatesForAll, updateVoucherInventory,
    getQueueTimestamp,
  } = agentQueue;

  // ── useOrCrOcr hook ────────────────────────────────────────────────────────
  const ocrHook = useOrCrOcr({
    orCr, crCr, mvcData, mecData, agentMvcData, agentMecData,
    setOrCr, setCrCr, setMvcData, setMecData, setAgentMvcData, setAgentMecData,
    setOrNumber, setCrNumber,
    setOrPreview, setCrPreview, setMvcPreview, setMecPreview,
    setAgentMvcPreview, setAgentMecPreview,
    setMvcFileName, setMecFileName, setAgentMvcFileName, setAgentMecFileName,
    setValidationErrors,
    setCitizenValidationState, setCitizenValidationMessage,
    saveCitizenRequest,
    VALIDATION_STATE,
  });
  const {
    ocrUploadState,
    setOcrState,
    handleOrUpload, handleCrUpload,
    handleMvcUpload, handleMecUpload,
    handleAgentMvcUpload, handleAgentMecUpload,
  } = ocrHook;


  async function saveCitizenRequest(overrides = {}) {
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

  const handleAddAgentMvcMecToQueue = () => {
    _handleAddAgentMvcMecToQueue(
      agentMvcMecId, agentMvcData, agentMecData,
      agentMvcPreview, agentMecPreview,
      agentMvcFileName, agentMecFileName,
      () => {
        setAgentMvcPreview(null); setAgentMvcFileName(""); setAgentMvcData(emptyMvc);
        setAgentMecPreview(null); setAgentMecFileName(""); setAgentMecData(emptyMec);
      }
    );
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

  // ── Auto-Issue Certificate for Citizen ────────────────────────────────────────
  useEffect(() => {
    if (
      isAgent ||
      (citizenValidationState !== VALIDATION_STATE.PASSED &&
        requestStatus !== "MVC_MEC_VALIDATED")
    )
      return;
    if (certificateNo || isIssuingCertificate) return;
    if (!voucherAssigned) return;

    setIsIssuingCertificate(true);
    setTimeout(() => {
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      setStep(6);
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
    voucherAssigned,
    voucherCode,
    saveCitizenRequest,
    setStep,
    requestStatus
  ]);

  // ── useCitizenPayment hook ──────────────────────────────────────────────────
  const {
    processingPayment,
    issuingVoucher,
    fetchVoucherFailed,
    handleProceedToPayment,
  } = useCitizenPayment({
    id, step, isAgent, orCr, crCr,
    paymentDone, voucherAssigned, voucherCode, hpgVerified,
    paymentTransactionId, selectedRequest,
    setPaymentDone, setVoucherCode, setVoucherAssigned,
    setHpgVerified, setRequestStatus, setStep,
    setAvailableVoucherRequests,
    saveCitizenRequest,
    showError, navigate,
  });

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
                  {(!agentMvcMecRequestId || (agentMvcPreview && !isDocumentComplete(agentMvcData)) || (agentMecPreview && !isDocumentComplete(agentMecData))) && (
                    <div className="mb-3 flex justify-end">
                      <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right">
                        {!agentMvcMecRequestId && <p>• Please select a request from the dropdown</p>}
                        {agentMvcPreview && getMissingFieldsText(agentMvcData, "MVCC")}
                        {agentMecPreview && getMissingFieldsText(agentMecData, "MEC")}
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
                        !isDocumentComplete(agentMvcData) ||
                        !isDocumentComplete(agentMecData)
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
