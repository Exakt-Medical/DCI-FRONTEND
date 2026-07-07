import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  FileText,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  AlertTriangle,
  X,
  Car,
  Shield,
  Search,
} from "lucide-react";
import { CITIZEN_STEPS, VALIDATION_STATE } from "../../constants/clearanceRequestConfig";
import {
  MvcMecUploadCard,
  VehicleDocumentUploadCard,
} from "./components/FlowFormCards";
import { formatOcrHint, OCR_STATUS } from "../../hooks/useOcrForm";
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { generateDciCodeSlipPDF } from "./utils/generateDciCodeSlipPDF";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";
import { useAuth } from "../../context/AuthContext";
import { useRequest } from "../../context/RequestContext";
import { fetchMyRequests, fetchRequestById } from "../../services/certificateRequestService";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";
import { DataMismatchModal } from "./components/DataMismatchModal";
import { ticketService } from "../../services/ticketService";
import {
  emptyVehicle,
  emptyMvc,
  emptyMec,
  OR_EXPECTED_FIELDS,
  CR_EXPECTED_FIELDS,
  isDocumentComplete,
  getMissingFieldsText,
  mergeVehicleFields,
} from "./utils/clearanceRequestUtils";

import { useOrCrOcr } from "./hooks/useOrCrOcr";
import { useCitizenPayment } from "./hooks/useCitizenPayment";

// Generates a unique reference number like "REF-20260701-1234"
function generateRefNumber() {
  const pad = (n) => String(n).padStart(4, "0");
  const now = new Date();
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = pad(Math.floor(Math.random() * 9000) + 1000);
  return `REF-${date}-${rand}`;
}

export const CitizenClearanceRequestFlow = () => {
  const { error: showError, success: showSuccessAlert } = useAlert();
  const { role } = useAuth();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isDataMismatchModalOpen, setIsDataMismatchModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const {
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
  const [pendingNavigationPath, setPendingNavigationPath] = useState(null);
  const [showNavigationWarningModal, setShowNavigationWarningModal] = useState(false);
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const idFromQuery = searchParams.get("id") || "";
  const paymentTransactionId =
    searchParams.get("transaction_id") || searchParams.get("transactionId") || "";

  const selectedRequest =
    location.state?.request ||
    availableVoucherRequests.find(
      (item) => String(item.id) === String(idFromQuery),
    ) ||
    null;

  const onCancel = () => navigate("/dci-access/requests");
  const flowSteps = CITIZEN_STEPS;
  const maxStep = flowSteps.length;
  const hasSyncedStep = useRef(false);

  const [id, setId] = useState(() => selectedRequest?.id || idFromQuery || "");
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const txnId = params.get("transaction_id") || params.get("transactionId");
    if (txnId) return 3;

    if (selectedRequest?.status) {
      const status = selectedRequest.status;
      if (status === "VOUCHER_ISSUED") return 4;
      if (status === "DOCUMENTS_VERIFIED" || status === "VERIFICATION_FAILED") return 4;
      if (status === "HPG_VERIFIED" || status === "MVC_MEC_VALIDATED") return 4;
      if (status === "CERTIFICATE_ISSUED") return 5;
    }

    const queryStep = Number(params.get("step"));
    if (queryStep > 0) return Math.min(queryStep, maxStep);

    const storedStep = selectedRequest?.currentStep || 1;
    return Math.min(storedStep, maxStep);
  });

  useEffect(() => {
    hasSyncedStep.current = false;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const params = new URLSearchParams(location.search);
    let changed = false;
    if (params.get("id") !== String(id)) { params.set("id", id); changed = true; }
    if (params.get("step") !== String(step)) { params.set("step", String(step)); changed = true; }
    if (changed) navigate({ search: params.toString() }, { replace: true });
  }, [id, step, location.search, navigate]);

  const [requestStatus, setRequestStatus] = useState(
    () => selectedRequest?.status || "DRAFT",
  );
  const [dateCreated] = useState(
    () => selectedRequest?.dateCreated || new Date().toISOString().split("T")[0],
  );
  const [vehicleOption, setVehicleOption] = useState(
    () => selectedRequest?.vehicleOption || "EXISTING",
  );
  const [transactionType, setTransactionType] = useState(
    () => selectedRequest?.transactionType || "Transfer of Ownership",
  );

  const [orPreview, setOrPreview] = useState(selectedRequest?.orPreview || null);
  const [orCr, setOrCr] = useState(() => mergeVehicleFields(emptyVehicle, selectedRequest?.orCr || {}));

  const [crPreview, setCrPreview] = useState(selectedRequest?.crPreview || null);
  const [crCr, setCrCr] = useState(() => mergeVehicleFields(emptyVehicle, selectedRequest?.crCr || {}));

  const [isVerifyingDocuments, setIsVerifyingDocuments] = useState(false);
  const [paymentDone, setPaymentDone] = useState(Boolean(selectedRequest?.paymentDone));
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
  const [hpgVerified, setHpgVerified] = useState(Boolean(selectedRequest?.hpgVerified));

  const [mvcPreview, setMvcPreview] = useState(selectedRequest?.mvcPreview || null);
  const [mvcFileName, setMvcFileName] = useState(selectedRequest?.mvcFileName || "");
  const [mvcData, setMvcData] = useState(() => selectedRequest?.mvcData || emptyMvc);

  const [mecPreview, setMecPreview] = useState(selectedRequest?.mecPreview || null);
  const [mecFileName, setMecFileName] = useState(selectedRequest?.mecFileName || "");
  const [mecData, setMecData] = useState(() => selectedRequest?.mecData || emptyMec);

  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [certificateNo, setCertificateNo] = useState(selectedRequest?.certificateNo || "");
  const [citizenValidationState, setCitizenValidationState] = useState(
    selectedRequest?.mvcMecValidationState || VALIDATION_STATE.IDLE,
  );
  const [citizenValidationMessage, setCitizenValidationMessage] = useState(
    selectedRequest?.mvcMecValidationMessage || "",
  );
  const [validationErrors, setValidationErrors] = useState({});

  const [transactionVerified, setTransactionVerified] = useState(
    Boolean(selectedRequest?.verificationId),
  );
  const [verificationFailed, setVerificationFailed] = useState(
    () => selectedRequest?.status === "VERIFICATION_FAILED"
  );
  const [verificationError, setVerificationError] = useState(
    () => selectedRequest?.status === "VERIFICATION_FAILED" ? "Verification failed." : ""
  );
  const [vvsOwnerName, setVvsOwnerName] = useState(selectedRequest?.vvsOwnerName || "");
  const [vvsVehicleDetails, setVvsVehicleDetails] = useState(
    selectedRequest?.vvsVehicleDetails || null,
  );
  const [verificationId, setVerificationId] = useState(
    selectedRequest?.verificationId || "",
  );

  // Sync state when selectedRequest loads asynchronously
  useEffect(() => {
    if (!selectedRequest) return;
    if (selectedRequest.id && !id) setId(selectedRequest.id);
    if (selectedRequest.currentStep && !hasSyncedStep.current) {
      let derivedStep = selectedRequest.currentStep;
      if (selectedRequest.status === "VOUCHER_ISSUED") derivedStep = 4;
      else if (selectedRequest.status === "DOCUMENTS_VERIFIED" || selectedRequest.status === "VERIFICATION_FAILED") derivedStep = 4;
      else if (selectedRequest.status === "HPG_VERIFIED" || selectedRequest.status === "MVC_MEC_VALIDATED") derivedStep = 4;
      else if (selectedRequest.status === "CERTIFICATE_ISSUED") derivedStep = 5;
      
      setStep(Math.min(derivedStep, maxStep));
      hasSyncedStep.current = true;
    }
    if (selectedRequest.status) setRequestStatus(selectedRequest.status);
    if (selectedRequest.vehicleOption) setVehicleOption(selectedRequest.vehicleOption);
    if (selectedRequest.transactionType) setTransactionType(selectedRequest.transactionType);
    if (selectedRequest.orCr) setOrCr(mergeVehicleFields(emptyVehicle, selectedRequest.orCr));
    if (selectedRequest.crCr) setCrCr(mergeVehicleFields(emptyVehicle, selectedRequest.crCr));
    if (selectedRequest.voucherCode || selectedRequest.voucherReferenceNo) {
      setVoucherCode(selectedRequest.voucherCode || selectedRequest.voucherReferenceNo);
      setVoucherAssigned(true);
    }
    if (selectedRequest.paymentDone) setPaymentDone(true);
    if (selectedRequest.hpgVerified || selectedRequest.status === "HPG_VERIFIED") setHpgVerified(true);
    if (selectedRequest.certificateNo) setCertificateNo(selectedRequest.certificateNo);
    if (selectedRequest.verificationId) {
      setTransactionVerified(true);
      setVerificationId(selectedRequest.verificationId);
    }
    if (selectedRequest.status === "VERIFICATION_FAILED") {
      setVerificationFailed(true);
      setVerificationError("No matching vehicle record found in VVS for the provided identifiers.");
    }
    if (selectedRequest.vvsOwnerName) setVvsOwnerName(selectedRequest.vvsOwnerName);
    if (selectedRequest.vvsVehicleDetails) setVvsVehicleDetails(selectedRequest.vvsVehicleDetails);
    if (selectedRequest.mvcMecValidationState) setCitizenValidationState(selectedRequest.mvcMecValidationState);
    if (selectedRequest.mvcMecValidationMessage) setCitizenValidationMessage(selectedRequest.mvcMecValidationMessage);
    if (selectedRequest.mvcData) setMvcData(selectedRequest.mvcData);
    if (selectedRequest.mecData) setMecData(selectedRequest.mecData);
  }, [selectedRequest, maxStep, id]);

  // Poll for HPG verification status when on step 5
  useEffect(() => {
    let interval;
    if (step === 5 && !hpgVerified && id) {
      interval = setInterval(async () => {
        try {
          const requests = await fetchMyRequests();
          const currentReq = requests.find((r) => String(r.id) === String(id));
          if (currentReq && (currentReq.hpgVerified || currentReq.status === "HPG_VERIFIED")) {
            setHpgVerified(true);
            setRequestStatus(currentReq.status);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [step, hpgVerified, id]);

  // Poll for DCI verification status when on step 6
  useEffect(() => {
    let interval;
    if (step === 6 && requestStatus !== "CERTIFICATE_ISSUED" && !certificateNo && id) {
      interval = setInterval(async () => {
        try {
          const requests = await fetchMyRequests();
          const currentReq = requests.find((r) => String(r.id) === String(id));
          if (currentReq) {
            if (currentReq.status === "CERTIFICATE_ISSUED") {
              setRequestStatus("CERTIFICATE_ISSUED");
              if (currentReq.certificateNo) setCertificateNo(currentReq.certificateNo);
            } else if (currentReq.status === "MVC_MEC_VALIDATED") {
              setRequestStatus("MVC_MEC_VALIDATED");
              handleDciVerification();
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [step, requestStatus, certificateNo, id]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (window.bypassBeforeUnload) return;
      if (step >= 2 && step !== 5 && step !== 6 && !certificateNo) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleLinkClick = (e) => {
      if (step >= 2 && step !== 5 && step !== 6 && !certificateNo) {
        const anchor = e.target.closest("a");
        if (anchor) {
          const targetHref = anchor.getAttribute("href");
          const currentPath = window.location.pathname;
          if (
            targetHref &&
            targetHref !== currentPath &&
            !targetHref.startsWith("#") &&
            !targetHref.startsWith("javascript:")
          ) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigationPath(targetHref);
            setShowNavigationWarningModal(true);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleLinkClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [step, certificateNo]);

  // Compute OR/CR field mismatches for display
  const mismatches = (() => {
    const fields = [
      ["plateNumber", "Plate Number"],
      ["mvFileNumber", "MV File Number"],
    ];
    return fields
      .filter(([f]) => orCr[f] && crCr[f] && orCr[f] !== crCr[f])
      .map(([, label]) => label);
  })();
  const hasMismatch = mismatches.length > 0;

  const updateOrCr = (field, value) => {
    setOrCr((prev) => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
    setValidationErrors((prev) => ({ ...prev, [field]: false }));
  };
  const updateCrCr = (field, value) => {
    setCrCr((prev) => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
    setValidationErrors((prev) => ({ ...prev, [field]: false }));
  };

  const {
    ocrUploadState,
    handleOrUpload,
    handleCrUpload,
    handleMvcUpload,
    handleMecUpload,
  } = useOrCrOcr({
    orCr, crCr, mvcData, mecData,
    setOrCr, setCrCr, setMvcData, setMecData,
    setOrPreview, setCrPreview, setMvcPreview, setMecPreview,
    setMvcFileName, setMecFileName,
    setValidationErrors,
    setCitizenValidationState, setCitizenValidationMessage,
    saveCitizenRequest,
    VALIDATION_STATE,
  });

  async function saveCitizenRequest(overrides = {}) {
    const isExtracting = (val) => !val || val === "Extracting...";
    const hasData = (obj) =>
      Object.values(obj).some((v) => typeof v === "string" && v.trim() && v !== "Extracting...");

    const record = {
      id,
      dateCreated,
      currentStep: step,
      status: requestStatus,
      role,
      vehicleOption,
      transactionType,
      plateNumber: orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
      voucherCode,
      voucherReferenceNo: voucherCode,
      voucherAssigned,
      voucherStatus: voucherAssigned
        ? "VOUCHER_ISSUED"
        : selectedRequest?.voucherStatus || (selectedRequest?.voucherCode ? "VOUCHER_ISSUED" : ""),
      paymentDone,
      hpgVerified,
      certificateNo,
      clearanceReferenceNo: certificateNo,
      clearanceStatus: certificateNo ? "CERTIFICATE_ISSUED" : selectedRequest?.clearanceStatus || "",
      verificationId: selectedRequest?.verificationId || "",
      ...(hasData(orCr) && { orCr }),
      ...(hasData(crCr) && { crCr }),
      ...overrides,
    };

    if (onSaveRequest) {
      const resObj = await onSaveRequest(record);
      const savedId = resObj?.id || resObj;
      if (savedId && !id) { setId(savedId); record.id = savedId; }
      if (resObj?.certificateNo) {
        setCertificateNo(resObj.certificateNo);
        record.certificateNo = resObj.certificateNo;
        record.clearanceReferenceNo = resObj.certificateNo;
        record.clearanceStatus = "CERTIFICATE_ISSUED";
      }
    }
    return record;
  }

  const validateMvcMecStep = async () => {
    if (!isDocumentComplete(mvcData) || !isDocumentComplete(mecData)) return;

    setIsVerifyingDocuments(true);
    setCitizenValidationState(VALIDATION_STATE.VALIDATING);
    setCitizenValidationMessage("DCI validation in progress...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await saveCitizenRequest({
        currentStep: 7,
        status: "MVC_MEC_VALIDATED",
        mvcData,
        mecData,
        mvcMecValidationState: VALIDATION_STATE.PASSED,
        mvcMecValidationMessage: "Validated by DCI portal.",
      });
      setCitizenValidationState(VALIDATION_STATE.PASSED);
      setCitizenValidationMessage("Validated by DCI portal.");
      setRequestStatus("MVC_MEC_VALIDATED");
      setStep(7);
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || "An error occurred during DCI validation.";
      setCitizenValidationState(VALIDATION_STATE.FAILED);
      setCitizenValidationMessage(errMsg);
      setRequestStatus("MVC_MEC_VALIDATION_PENDING");
      await saveCitizenRequest({
        currentStep: 6,
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

  const handleDciVerification = () => {
    if (certificateNo || isIssuingCertificate || !voucherAssigned) return;

    setIsIssuingCertificate(true);
    setTimeout(() => {
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      saveCitizenRequest({
        currentStep: 6,
        status: "CERTIFICATE_ISSUED",
        certificateNo: "", // backend generates the number
        clearanceReferenceNo: "",
        clearanceStatus: "CERTIFICATE_ISSUED",
        voucherAssigned: true,
        voucherStatus: "VOUCHER_ISSUED",
        voucherCode,
        voucherReferenceNo: voucherCode,
      });
    }, 1500);
  };

  const {
    processingPayment,
    issuingVoucher,
    handleProceedToPayment,
  } = useCitizenPayment({
    id, step, orCr, crCr,
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
      plateNumber: orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
      voucherCode,
      voucherReferenceNo: voucherCode,
      dateCreated,
      status: requestStatus,
      clearanceStatus: "CERTIFICATE_ISSUED",
      orCr,
      crCr,
      mvcData,
      mecData,
    });
    doc.save(filename);
  };

  const handlePreview = async () => {
    if (!certificateNo) return;
    try {
      const { doc } = await generateClearanceCertificatePDF({
        id,
        certificateNo,
        clearanceReferenceNo: certificateNo,
        plateNumber: orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
        voucherCode,
        voucherReferenceNo: voucherCode,
        dateCreated,
        status: requestStatus,
        clearanceStatus: "CERTIFICATE_ISSUED",
        orCr,
        crCr,
        mvcData,
        mecData,
      });
      const pdfUrl = doc.output("bloburl");
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("Failed to generate PDF preview:", err);
      showError("Error", "Failed to preview certificate.");
    }
  };

  const handlePreviewCodeSlip = async () => {
    try {
      if (!voucherCode) return;
      const { doc } = await generateDciCodeSlipPDF({ voucherCode });
      const pdfUrl = doc.output("bloburl");
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("Failed to generate PDF preview:", err);
      showError("Error", "Failed to preview code slip.");
    }
  };

  const handleDownloadCodeSlip = async () => {
    try {
      if (!voucherCode) return;
      const { doc, filename } = await generateDciCodeSlipPDF({ voucherCode });
      doc.save(filename);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      showError("Error", "Failed to download code slip.");
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
    CR_EXPECTED_FIELDS.forEach((field) => {
      if (!crCr[field] || crCr[field].trim() === "" || crCr[field] === "Extracting...") {
        newErrors[field] = true;
        hasEmpty = true;
      }
    });

    if (hasEmpty) {
      setValidationErrors(newErrors);
      await showError("Validation Failed", "Please fill in all required fields.");
      return;
    }

    setIsVerifyingDocuments(true);
    try {
      await saveCitizenRequest({
        currentStep: 3,
        status: "OR_CR_UPLOADED",
        orCr,
        crCr,
      });
      setRequestStatus("OR_CR_UPLOADED");
      setStep(3);
    } catch (error) {
      await showError("Save Failed", error?.message || "Failed to save OR/CR details.");
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

  const handleVerifyVehicle = async () => {
    setIsVerifyingDocuments(true);
    try {
      const payload = {
        mvFileNumber: (crCr.mvFileNumber || orCr.mvFileNumber || "").trim().toUpperCase(),
        plateNumber: (crCr.plateNumber || orCr.plateNumber || "").trim().toUpperCase(),
        engineNumber: (crCr.engineNumber || orCr.engineNumber || "").trim().toUpperCase(),
        chassisNumber: (crCr.chassisNumber || orCr.chassisNumber || "").trim().toUpperCase(),
      };

      const verifyRes = await verificationService.verify(payload);
      const vvsData = verifyRes?.data || {};

      if (vvsData.verificationStatus !== "VERIFIED") {
        throw new Error(vvsData.failureReason || "No matching verified vehicle record found in VVS system.");
      }

      const ownerName =
        [vvsData.ownerFirstName, vvsData.ownerMiddleName, vvsData.ownerLastName]
          .filter(Boolean)
          .join(" ") ||
        vvsData.ownerName ||
        "Unknown Owner";

      setTransactionVerified(true);
      setVerificationId(vvsData.verificationId || "");
      setVvsOwnerName(ownerName);
      setVvsVehicleDetails(vvsData);

      await saveCitizenRequest({
        currentStep: 4,
        status: "DOCUMENTS_VERIFIED",
        verificationId: vvsData.verificationId || "",
        vvsOwnerName: ownerName,
        vvsVehicleDetails: vvsData,
      });
      setRequestStatus("DOCUMENTS_VERIFIED");

      showSuccessAlert("Verification Complete", "Transaction code issued successfully.");
    } catch (error) {
      setVerificationFailed(true);
      const errMsg =
        error?.response?.data?.failureReason ||
        error?.response?.data?.error ||
        error?.message ||
        "Verification failed.";
      setVerificationError(errMsg);

      try {
        await saveCitizenRequest({
          currentStep: 4,
          status: "VERIFICATION_FAILED",
        });
        setRequestStatus("VERIFICATION_FAILED");
      } catch (saveError) {
        console.error("Failed to save verification failed status", saveError);
      }
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

  const hasTriggeredVerification = useRef(false);
  useEffect(() => {
    const hasData = (orCr?.mvFileNumber || crCr?.mvFileNumber) || (orCr?.plateNumber || crCr?.plateNumber);
    if (id && !selectedRequest && !hasData) return;
    if (requestStatus === "VERIFICATION_FAILED" || selectedRequest?.status === "VERIFICATION_FAILED") return;

    const isAlreadyVerified = 
      ["DOCUMENTS_VERIFIED", "HPG_VERIFIED", "MVC_MEC_VALIDATED", "CERTIFICATE_ISSUED"].includes(requestStatus) ||
      (selectedRequest?.status && ["DOCUMENTS_VERIFIED", "HPG_VERIFIED", "MVC_MEC_VALIDATED", "CERTIFICATE_ISSUED"].includes(selectedRequest.status));
      
    if (isAlreadyVerified) return;

    if (step === 4 && !transactionVerified && !isVerifyingDocuments && !hasTriggeredVerification.current && !verificationFailed) {
      hasTriggeredVerification.current = true;
      handleVerifyVehicle();
    }
  }, [step, transactionVerified, isVerifyingDocuments, verificationFailed, id, selectedRequest, requestStatus, orCr, crCr]);

  // Polling for external verification status (HPG, DCI)
  useEffect(() => {
    if (step !== 4 || !transactionVerified || requestStatus === "CERTIFICATE_ISSUED" || !id) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchRequestById(id);
        if (data && data.status) {
          setRequestStatus(data.status);
          if (data.hpgVerified || data.status === "HPG_VERIFIED" || data.status === "MVC_MEC_VALIDATED" || data.status === "CERTIFICATE_ISSUED") {
            setHpgVerified(true);
          }
          if (data.certificateNo) {
            setCertificateNo(data.certificateNo);
          }
        }
      } catch (error) {
        console.error("Failed to poll request status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, transactionVerified, requestStatus, id]);

  const getTicketPrefilledData = () => {
    const vehicleInfo = {
      plateNo: "",
      make: "",
      model: "",
      mvFileNo: "",
      engineNo: "",
      chassisNo: "",
    };
    if (step === 1) {
      vehicleInfo.plateNo = orCr?.plateNumber || crCr?.plateNumber || "";
      vehicleInfo.make = orCr?.make || crCr?.make || "";
      vehicleInfo.model = orCr?.series || crCr?.series || "";
      vehicleInfo.mvFileNo = orCr?.mvFileNumber || crCr?.mvFileNumber || "";
      vehicleInfo.engineNo = orCr?.engineNumber || crCr?.engineNumber || "";
      vehicleInfo.chassisNo = orCr?.chassisNumber || crCr?.chassisNumber || "";
    } else if (step === 5) {
      vehicleInfo.plateNo = mvcData?.plateNo || "";
      vehicleInfo.engineNo = mvcData?.engineNo || mecData?.engineNoStencilled || "";
      vehicleInfo.chassisNo = mvcData?.chassisNo || mecData?.chassisNoStencilled || "";
    }
    return {
      concernType: "vehicle",
      vehicleSubType: "dataMismatch",
      subject: `Issue in Clearance Request Step ${step}`,
      description: `Encountered an issue during Step ${step} of the Clearance Request Flow (Citizen mode).`,
      vehicleInfo,
    };
  };

  const handleCreateTicket = async (formData) => {
    const { vehicleSubType, concernType } = formData;
    const typeLabel =
      vehicleSubType === "dataMismatch" ? "Data Mismatch"
        : vehicleSubType === "vehicleNotFound" ? "Vehicle Not Found"
        : concernType === "other" ? "Other"
        : concernType
          ? concernType.charAt(0).toUpperCase() + concernType.slice(1)
          : "General";

    const referenceNumber = generateRefNumber();
    const created = await ticketService.create({
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
    });
    if (created) {
      showSuccessAlert("Ticket Submitted", `Your support ticket has been submitted. Reference: ${referenceNumber}`);
      setIsTicketModalOpen(false);
    }
    return created;
  };

  const handleDataMismatchSubmit = async ({ crAttachment }) => {
    const referenceNumber = generateRefNumber();
    try {
      await ticketService.create({
        referenceNumber,
        requestedBy: role || "Citizen",
        type: "Data Mismatch",
        status: "PENDING",
        address: crAttachment,
        name: role || "Citizen",
        processedBy: null,
        dateRequested: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        escalated: "NO",
        roleBased: role?.toUpperCase() ?? null,
        plateNo: orCr.plateNumber ?? null,
        mvFileNo: crCr.mvFileNumber ?? null,
        make: orCr.make ?? null,
        series: orCr.series ?? null,
        engineNo: orCr.engineNumber ?? null,
        chassisNo: crCr.chassisNumber ?? null,
      });
      showSuccessAlert("Ticket Submitted", `Data Mismatch ticket ${referenceNumber} has been created.`);
      setIsDataMismatchModalOpen(false);
    } catch {
      showError("Submission Failed", "There was an error creating your ticket.");
    }
  };

  const canNext = () => {
    if (step === 1) return Boolean(vehicleOption);
    if (step === 2) {
      return Boolean(isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && !hasMismatch);
    }
    if (step === 3) return Boolean(paymentDone && voucherAssigned);
    if (step === 4) return Boolean(requestStatus === "CERTIFICATE_ISSUED" || requestStatus === "MVC_MEC_VALIDATED");
    return false;
  };

  const nextStep = async () => {
    if (!canNext()) return;
    if (step === 1) { setStep(2); return; }
    if (step === 2) { await handleVerifyStep2(); return; }
    if (step === 4) {
      if (requestStatus === "MVC_MEC_VALIDATED") {
        setIsIssuingCertificate(true);
        try {
          await saveCitizenRequest({
            currentStep: 5,
            status: "CERTIFICATE_ISSUED"
          });
          setRequestStatus("CERTIFICATE_ISSUED");
        } finally {
          setIsIssuingCertificate(false);
        }
      }
      setStep(5);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep((prev) => prev - 1);
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
      dateCreated,
      currentStep: 5,
      status: "CERTIFICATE_ISSUED",
      voucherStatus: "VOUCHER_ISSUED",
      clearanceStatus: "CERTIFICATE_ISSUED",
      clearanceReferenceNo: certificateNo,
      voucherReferenceNo: voucherCode,
    });
    navigate("/dci-access/requests");
  };

  const vehicleDetails = [
    { label: "Engine Number", value: vvsVehicleDetails?.engineNumber || crCr.engineNumber },
    { label: "Chassis Number", value: vvsVehicleDetails?.chassisNumber || crCr.chassisNumber },
    { label: "MV File Number", value: vvsVehicleDetails?.mvFileNo || crCr.mvFileNumber },
    { label: "Plate Number", value: vvsVehicleDetails?.plateNumber || crCr.plateNumber },
    { label: "Color", value: vvsVehicleDetails?.color || crCr.color },
    { label: "Make", value: vvsVehicleDetails?.make || crCr.make },
    { label: "Series", value: vvsVehicleDetails?.series || crCr.series },
    { label: "Year Model", value: vvsVehicleDetails?.yearModel || crCr.yearModel },
    { label: "Classification", value: vvsVehicleDetails?.classification || crCr.classification },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4">
      {idFromQuery && isLoadingRequests ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg w-full max-w-md mt-10">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-4 font-medium animate-pulse">Loading request details...</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-gray-200">
              <img src={DCI_LOGO} alt="DCI" className="h-10" />
              <span className="font-bold text-gray-900">Clearance Request</span>
              <span className="text-xs text-gray-500 ml-auto">Citizen</span>
            </div>

            {/* Step progress bar */}
            <div className="px-6 py-4 bg-[#0059b5]">
              <div className="flex items-center justify-between gap-2">
                {flowSteps.map((label, index) => {
                  const idx = index + 1;
                  const isCompleted = step > idx;
                  const isActive = step === idx;
                  return (
                    <div key={label} className="flex-1 text-center relative min-w-0">
                      <div
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold
                          ${isCompleted ? "bg-white text-[#0059b5]" : ""}
                          ${isActive ? "bg-white text-[#0059b5] ring-4 ring-white/30" : ""}
                          ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}`}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx}
                      </div>
                      <p className={`text-[10px] sm:text-xs mt-2 truncate ${isActive ? "text-white font-medium" : "text-white/60"}`}>
                        {label}
                      </p>
                      {index < flowSteps.length - 1 && (
                        <div
                          className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${isCompleted ? "bg-white" : "bg-white/30"}`}
                          style={{ width: "calc(100% - 2rem)", left: "calc(50% + 1rem)" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-[#001b3b]">Vehicle Option</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Please select if you are requesting a clearance certificate for a new or an existing vehicle.
                  </p>
                </div>
                
                <div className="flex justify-center max-w-3xl mx-auto">
                  <div
                    onClick={() => setVehicleOption("EXISTING")}
                    className={`cursor-pointer rounded-xl border-2 p-8 transition-all duration-200 flex flex-col items-center text-center gap-4 max-w-md w-full ${
                      vehicleOption === "EXISTING"
                        ? "border-[#0059b5] bg-[#f8fbff] shadow-sm ring-1 ring-[#0059b5]/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${vehicleOption === "EXISTING" ? "bg-[#0059b5] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Car className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Existing Vehicle</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        For vehicles that are already registered.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="max-w-3xl mx-auto">
                  <h3 className="text-lg font-bold text-[#001b3b] text-center mb-6">Select Transaction Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Transfer of Ownership",
                      "Change Color / Body Design",
                      "Change Engine/Motor",
                      "Change Chassis/VIN/Frame",
                      "Permit to Assemble",
                      "Record Check"
                    ].map((type) => (
                      <label
                        key={type}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          transactionType === type
                            ? "border-[#0059b5] bg-[#f8fbff] text-[#0059b5]"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="transactionType"
                          value={type}
                          checked={transactionType === type}
                          onChange={(e) => setTransactionType(e.target.value)}
                          className="w-4 h-4 text-[#0059b5] focus:ring-[#0059b5] border-gray-300"
                        />
                        <span className="text-sm font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <VehicleDocumentUploadCard
                    title="OR"
                    uploadLabel="Upload Official Receipt"
                    onFile={handleOrUpload}
                    preview={orPreview}
                    uploadHint={formatOcrHint(ocrUploadState.or)}
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
                    vehicleLabel="Vehicle Details (from CR)"
                    vehicleValues={crCr}
                    vehicleFieldSet="cr"
                    onVehicleChange={updateCrCr}
                    errors={validationErrors}
                    disabled={ocrUploadState.or.status === OCR_STATUS.IDLE || ocrUploadState.or.status === OCR_STATUS.EXTRACTING}
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

            {step === 3 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <CreditCard size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Payment</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                  <p className="text-sm text-gray-500 mb-1">Certificate Request Fee</p>
                  <p className="text-3xl font-bold text-gray-900">PHP 100.00</p>
                  <p className="text-xs text-gray-500 mt-1">Single payment covers the whole request.</p>
                </div>
                {processingPayment ? (
                  <div className="text-center py-8">
                    <Spinner size="lg" />
                    <p className="text-sm font-medium text-gray-700 mt-4 animate-pulse">Verifying Payment Status...</p>
                    <p className="text-xs text-gray-500 mt-1">Please wait while we confirm your transaction with the payment gateway.</p>
                  </div>
                ) : paymentDone ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle size={44} className="text-green-600 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-green-800">Payment Successful</h4>
                    {issuingVoucher ? (
                      <div className="mt-4 flex flex-col items-center justify-center gap-2">
                        <Spinner size="md" />
                        <p className="text-xs text-gray-500">Generating voucher reference...</p>
                      </div>
                    ) : voucherAssigned ? (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                          The voucher has been issued for your vehicle (Plate: <strong className="font-bold text-gray-900">{orCr.plateNumber || "N/A"}</strong>).
                          Please click <strong className="font-semibold text-gray-900">Next</strong> to proceed to the HPG Verification step.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-3">Voucher will be issued shortly.</p>
                    )}
                  </div>
                ) : (
                  <Button onClick={handleProceedToPayment} className="w-full">
                    <CreditCard size={16} /> Proceed to Payment
                  </Button>
                )}
              </Card>
            )}

            {step === 4 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Verify Vehicle</h3>
                </div>
                <div className="space-y-4">
                  {!transactionVerified ? (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      {isVerifyingDocuments ? (
                        <div className="flex flex-col items-center justify-center">
                          <Spinner size="md" />
                          <p className="text-sm text-gray-600 mt-4">Verifying vehicle details against the VVS system...</p>
                        </div>
                      ) : verificationFailed ? (
                        <div className="bg-red-50 text-red-700 text-sm p-4 rounded-lg border border-red-200 w-full">
                          <p className="font-semibold mb-1">Verification Failed</p>
                          <p>{verificationError}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Spinner size="md" />
                          <p className="text-sm text-gray-600 mt-4">Preparing verification...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center bg-green-50">
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">LTO Vehicle Found</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Make</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.make || crCr.make || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Series</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.series || crCr.series || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Year Model</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.yearModel || crCr.yearModel || "N/A"}</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.color || crCr.color || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Owner</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsOwnerName.replace(/(?!^)[A-Za-z](?!$)/g, "*")}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Classification</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.classification || crCr.classification || "N/A"}</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Vehicle Type</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.denomination || crCr.vehicleType || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Engine Number</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.engineNumber || crCr.engineNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chassis No.</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.chassisNumber || crCr.chassisNumber || "N/A"}</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Plate Number</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{vvsVehicleDetails?.plateNumber || crCr.plateNumber || "N/A"}</p>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => setIsDataMismatchModalOpen(true)}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-solid border-2"
                        >
                          Report Data Mismatch
                        </Button>
                      </div>
                    </div>
                  )}

                  {transactionVerified && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-4">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                        <Shield className="text-[#0059b5]" size={18} />
                        <h3 className="text-base font-bold text-gray-900">HPG Verification Status</h3>
                      </div>
                      {hpgVerified ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                          <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                          <p className="font-bold text-green-700 text-lg">HPG Verified</p>
                          <p className="text-sm text-gray-600 mt-1">Your vehicle has been successfully verified by HPG.</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Transaction Code: <span className="font-mono font-semibold">{voucherCode}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                          <p className="font-bold text-amber-700 text-lg">Please present your transaction to HPG.</p>
                          <div className="mt-4 inline-flex items-center gap-3 bg-white border border-amber-300 rounded-lg px-4 py-2 shadow-sm">
                            <div className="text-left">
                              <span className="text-xs text-gray-500 block text-center">TRANSACTION CODE</span>
                              <span className="text-base font-mono font-bold text-gray-900 tracking-wider">{voucherCode}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-center gap-3">
                            <Button onClick={handlePreviewCodeSlip} variant="outline" size="sm" className="flex items-center gap-1.5">
                              <Eye size={14} /> Preview Slip
                            </Button>
                            <Button onClick={handleDownloadCodeSlip} variant="outline" size="sm" className="flex items-center gap-1.5">
                              <Download size={14} /> Download Slip
                            </Button>
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-3 animate-pulse">Waiting for HPG officer verification...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {transactionVerified && hpgVerified && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-4">
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                        <Search className="text-[#0059b5]" size={18} />
                        <h3 className="text-base font-bold text-gray-900">DCI Clearance Status</h3>
                      </div>
                      {requestStatus === "CERTIFICATE_ISSUED" || requestStatus === "MVC_MEC_VALIDATED" ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                          <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                          <p className="font-bold text-green-700 text-lg">DCI Cleared</p>
                          <p className="text-sm text-gray-600 mt-1">Your request has passed DCI validation.</p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                          <Spinner size="md" className="mx-auto mb-3 text-amber-500" />
                          <p className="font-bold text-amber-700 text-lg">Pending DCI Clearance</p>
                          <p className="text-xs text-gray-500 mt-1">Waiting for DCI officers to clear your transaction.</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </Card>
            )}

            {step === 5 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Issue Certificate</h3>
                </div>
                {isIssuingCertificate || requestStatus !== "CERTIFICATE_ISSUED" && !certificateNo ? (
                  <div className="text-center py-8">
                    <Spinner size="lg" />
                    <p className="text-sm text-gray-500 mt-4">Waiting for DCI Validation and Certificate Issuance...</p>
                  </div>
                ) : certificateNo ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                    <p className="font-semibold text-green-700 text-lg">Certificate Issued</p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-2">{certificateNo}</p>
                    <p className="text-xs text-gray-500 mt-1">Plate: {orCr.plateNumber}</p>
                    <div className="mt-4 flex justify-center gap-3">
                      <Button onClick={handlePreview} variant="outline" className="flex items-center gap-1.5">
                        <Eye size={16} /> Preview
                      </Button>
                      <Button onClick={handleDownload} variant="outline" className="flex items-center gap-1.5">
                        <Download size={16} /> Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  null
                )}
              </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <div className="flex gap-2">
                {step === 1 ? (
                  <Button variant="ghost" onClick={onCancel}>
                    <X size={16} /> Cancel
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={prevStep}>
                    <ChevronLeft size={16} /> Back
                  </Button>
                )}
                {step === 4 && verificationFailed && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsTicketModalOpen(true)}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Report an Issue
                  </Button>
                )}
              </div>
              {step < flowSteps.length ? (
                <div className="flex items-center gap-3">
                  {!canNext() && step === 2 && (orPreview || crPreview) && (
                    <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                      {orPreview && getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS)}</p>}
                      {crPreview && getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS)}</p>}
                    </div>
                  )}
                  <Button onClick={nextStep} disabled={!canNext() || isVerifyingDocuments || isIssuingCertificate}>
                    {isVerifyingDocuments ? "Verifying..." : isIssuingCertificate ? "Issuing..." : "Next"} <ChevronRight size={16} />
                  </Button>
                </div>
              ) : (
                certificateNo && (
                  <Button onClick={finishCitizen} className="flex items-center gap-1.5">
                    <CheckCircle size={16} /> Complete
                  </Button>
                )
              )}
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
      {isDataMismatchModalOpen && (
        <DataMismatchModal
          vehicleData={vvsVehicleDetails ? {
            mv_file_number: vvsVehicleDetails.mvFileNo || vvsVehicleDetails.mvFileNumber || "",
            plate_number: vvsVehicleDetails.plateNumber || "",
            engine_number: vvsVehicleDetails.engineNumber || "",
            chassis_number: vvsVehicleDetails.chassisNumber || "",
            make: vvsVehicleDetails.make || "",
            series: vvsVehicleDetails.series || "",
            color: vvsVehicleDetails.color || "",
            denomination: vvsVehicleDetails.denomination || "",
            year_model: vvsVehicleDetails.yearModel || "",
            classification: vvsVehicleDetails.classification || "",
          } : {}}
          ownerData={vvsVehicleDetails ? {
            firstName: vvsVehicleDetails.ownerFirstName || "",
            lastName: vvsVehicleDetails.ownerLastName || "",
            middleName: vvsVehicleDetails.ownerMiddleName || "",
            address: vvsVehicleDetails.ownerAddress || "",
            contactNo: "",
            email: "",
            tin: "",
          } : {}}
          onSubmit={handleDataMismatchSubmit}
          onClose={() => setIsDataMismatchModalOpen(false)}
          isSubmitting={false}
        />
      )}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          size="sm"
          hideHeader
        >
          <div className="p-8 text-center space-y-5">
            <h3 className="text-2xl font-bold text-gray-900">Are you sure?</h3>
            <p className="text-gray-500 text-lg leading-relaxed max-w-[340px] mx-auto">
              Please confirm that all uploaded data is accurate and final for this transaction.
            </p>
            <div className="flex justify-center gap-4 pt-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-8 py-2.5 rounded-2xl border-2 border-[#0059b5] text-[#0059b5] font-semibold hover:bg-blue-50/50 transition-colors min-w-[120px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNext}
                className="px-8 py-2.5 rounded-2xl bg-[#0059b5] text-white font-semibold hover:bg-[#004bb0] transition-colors shadow-lg shadow-blue-500/10 min-w-[120px]"
              >
                Proceed
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showNavigationWarningModal && (
        <Modal
          isOpen={showNavigationWarningModal}
          onClose={() => {
            setShowNavigationWarningModal(false);
            setPendingNavigationPath(null);
          }}
          size="sm"
          hideHeader
        >
          <div className="p-8 text-center space-y-5">
            <h3 className="text-2xl font-bold text-gray-900">Unsaved Changes</h3>
            <p className="text-gray-500 text-lg leading-relaxed max-w-[340px] mx-auto">
              You have an ongoing transaction. Are you sure you want to navigate away? Unsaved progress will be lost.
            </p>
            <div className="flex justify-center gap-4 pt-3">
              <button
                onClick={() => {
                  setShowNavigationWarningModal(false);
                  setPendingNavigationPath(null);
                }}
                className="px-8 py-2.5 rounded-2xl border-2 border-[#0059b5] text-[#0059b5] font-semibold hover:bg-blue-50/50 transition-colors min-w-[120px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNavigationWarningModal(false);
                  const path = pendingNavigationPath;
                  setPendingNavigationPath(null);
                  navigate(path);
                }}
                className="px-8 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-semibold hover:bg-red-100/80 transition-colors min-w-[160px]"
              >
                Discard & Proceed
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
