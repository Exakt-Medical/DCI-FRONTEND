import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
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
  AlertTriangle,
  X,
} from "lucide-react";
import { CITIZEN_STEPS, VALIDATION_STATE } from "../../constants/clearanceRequestConfig";
import {
  MvcMecUploadCard,
  VehicleDocumentUploadCard,
} from "./components/FlowFormCards";
import { formatOcrHint } from "../../hooks/useOcrForm";
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";
import { useAuth } from "../../context/AuthContext";
import { useRequest } from "../../context/RequestContext";
import { fetchMyRequests } from "../../services/certificateRequestService";
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
    const queryStep = Number(params.get("step"));
    if (queryStep > 0) return Math.min(queryStep, maxStep);
    const txnId = params.get("transaction_id") || params.get("transactionId");
    if (txnId) return 3;
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

  const [orPreview, setOrPreview] = useState(selectedRequest?.orPreview || null);
  const [orNumber, setOrNumber] = useState(selectedRequest?.orNumber || "");
  const [orCr, setOrCr] = useState(() => selectedRequest?.orCr || emptyVehicle);

  const [crPreview, setCrPreview] = useState(selectedRequest?.crPreview || null);
  const [crNumber, setCrNumber] = useState(selectedRequest?.crNumber || "");
  const [crCr, setCrCr] = useState(() => selectedRequest?.crCr || emptyVehicle);

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
      setStep(Math.min(selectedRequest.currentStep, maxStep));
      hasSyncedStep.current = true;
    }
    if (selectedRequest.status) setRequestStatus(selectedRequest.status);
    if (selectedRequest.vehicleOption) setVehicleOption(selectedRequest.vehicleOption);
    if (selectedRequest.orNumber) setOrNumber(selectedRequest.orNumber);
    if (selectedRequest.orCr) setOrCr(selectedRequest.orCr);
    if (selectedRequest.crNumber) setCrNumber(selectedRequest.crNumber);
    if (selectedRequest.crCr) setCrCr(selectedRequest.crCr);
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
    if (selectedRequest.vvsOwnerName) setVvsOwnerName(selectedRequest.vvsOwnerName);
    if (selectedRequest.vvsVehicleDetails) setVvsVehicleDetails(selectedRequest.vvsVehicleDetails);
    if (selectedRequest.mvcMecValidationState) setCitizenValidationState(selectedRequest.mvcMecValidationState);
    if (selectedRequest.mvcMecValidationMessage) setCitizenValidationMessage(selectedRequest.mvcMecValidationMessage);
    if (selectedRequest.mvcData) setMvcData(selectedRequest.mvcData);
    if (selectedRequest.mecData) setMecData(selectedRequest.mecData);
  }, [selectedRequest, maxStep, id]);

  // Compute OR/CR field mismatches for display
  const mismatches = (() => {
    const fields = [
      ["plateNumber", "Plate Number"],
      ["yearModel", "Year Model"],
      ["color", "Color"],
      ["mvFileNumber", "MV File Number"],
      ["ownerName", "Owner Name"],
      ["ownerAddress", "Owner Address"],
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
    setOrNumber, setCrNumber,
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
      orNumber: !isExtracting(orNumber) ? orNumber : selectedRequest?.orNumber || "",
      crNumber: !isExtracting(crNumber) ? crNumber : selectedRequest?.crNumber || "",
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

  // Auto-issue certificate once MVC/MEC is validated
  useEffect(() => {
    if (
      citizenValidationState !== VALIDATION_STATE.PASSED &&
      requestStatus !== "MVC_MEC_VALIDATED"
    ) return;
    if (certificateNo || isIssuingCertificate || !voucherAssigned) return;

    setIsIssuingCertificate(true);
    setTimeout(() => {
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      setStep(7);
      saveCitizenRequest({
        currentStep: 7,
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
  }, [certificateNo, citizenValidationState, isIssuingCertificate, voucherAssigned, voucherCode, requestStatus]);

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

  const handleVerifyStep2 = async () => {
    const newErrors = {};
    let hasEmpty = false;

    [...OR_EXPECTED_FIELDS, "orNumber"].forEach((field) => {
      const val = field === "orNumber" ? orNumber : orCr[field];
      if (!val || val.trim() === "" || val === "Extracting...") {
        newErrors[field] = true;
        hasEmpty = true;
      }
    });
    [...CR_EXPECTED_FIELDS, "crNumber"].forEach((field) => {
      const val = field === "crNumber" ? crNumber : crCr[field];
      if (!val || val.trim() === "" || val === "Extracting...") {
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
        orNumber,
        crNumber,
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

      showSuccessAlert("Verification Complete", "Transaction code issued successfully.");
    } catch (error) {
      const errMsg =
        error?.response?.data?.failureReason ||
        error?.response?.data?.error ||
        error?.message ||
        "Verification failed.";
      await showError("Verification Failed", errMsg);
    } finally {
      setIsVerifyingDocuments(false);
    }
  };

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
      const orOk = isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && orNumber && orNumber !== "Extracting...";
      const crOk = isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && crNumber && crNumber !== "Extracting...";
      return Boolean(orOk && crOk && !hasMismatch);
    }
    if (step === 3) return Boolean(paymentDone && voucherAssigned);
    if (step === 4) return Boolean(transactionVerified);
    if (step === 5) return Boolean(hpgVerified);
    if (step === 6) return isDocumentComplete(mvcData) && isDocumentComplete(mecData);
    return false;
  };

  const nextStep = async () => {
    if (!canNext()) return;
    if (step === 1) { setStep(2); return; }
    if (step === 2) { await handleVerifyStep2(); return; }
    if (step === 4) { setStep(5); return; }
    if (step === 6) { await validateMvcMecStep(); return; }
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
              <div className="space-y-6">
                <div className="text-center max-w-md mx-auto mb-8">
                  <h3 className="text-lg font-bold text-gray-900">Vehicle Clearance</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Please confirm you are applying for an existing vehicle clearance.
                  </p>
                </div>
                <div className="flex justify-center max-w-3xl mx-auto">
                  <div
                    onClick={() => setVehicleOption("EXISTING")}
                    className={`cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 flex flex-col items-center text-center gap-4 max-w-sm w-full ${
                      vehicleOption === "EXISTING"
                        ? "border-[#0059b5] bg-blue-50/50 shadow-md ring-1 ring-[#0059b5]/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${vehicleOption === "EXISTING" ? "bg-[#0059b5] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Existing Vehicle</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Clearance for an existing vehicle with active records in the VVS system.
                      </p>
                    </div>
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

            {step === 3 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <CreditCard size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Payment</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                  <p className="text-sm text-gray-500 mb-1">Certificate Request Fee</p>
                  <p className="text-3xl font-bold text-gray-900">PHP 60.00</p>
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
                      <p className="text-sm text-gray-600 mb-4">
                        Click below to verify your vehicle details against the VVS system.
                      </p>
                      <Button onClick={handleVerifyVehicle} disabled={isVerifyingDocuments}>
                        {isVerifyingDocuments ? "Verifying..." : "Verify Vehicle"}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-6">
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="font-bold text-green-700 text-lg mt-2">Vehicle Verified</p>
                      </div>
                      <div className="space-y-3 mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Owner Details</h4>
                        <div className="bg-white border border-green-100 rounded-lg p-4 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Owner Name</p>
                          <p className="font-semibold text-gray-900">
                            {vvsOwnerName.replace(/(?!^)[A-Za-z](?!$)/g, "*")}
                          </p>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider pt-2">Vehicle Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {vehicleDetails.map((detail, idx) => (
                            <div key={idx} className="bg-white border border-green-100 rounded-lg p-3 shadow-sm overflow-hidden">
                              <p className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider truncate">{detail.label}</p>
                              <p className="text-sm font-semibold text-gray-900 truncate" title={detail.value || "N/A"}>
                                {detail.value || "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {step === 5 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">HPG Verification Status</h3>
                </div>
                {hpgVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-3 animate-bounce" />
                    <p className="font-bold text-green-700 text-lg">HPG Verified</p>
                    <p className="text-sm text-gray-600 mt-1">Your vehicle has been successfully verified by HPG.</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Voucher Code: <span className="font-mono font-semibold">{voucherCode}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <p className="font-bold text-amber-700 text-lg">Verify your voucher code to HPG</p>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                      Please present your voucher code to the HPG officer for physical inspection and verification.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-3 bg-white border border-amber-300 rounded-lg px-4 py-2 shadow-sm">
                      <div className="text-left">
                        <span className="text-xs text-gray-500 block">VOUCHER CODE</span>
                        <span className="text-base font-mono font-bold text-gray-900 tracking-wider">{voucherCode}</span>
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
                    <p className="text-xs text-gray-400 mt-3 animate-pulse">Waiting for HPG officer verification...</p>
                  </div>
                )}
              </Card>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MvcMecUploadCard
                    title="MVCC"
                    uploadLabel="Upload Motor Vehicle Clearance Certificate"
                    onFile={handleMvcUpload}
                    preview={mvcPreview}
                    uploadHint={formatOcrHint(ocrUploadState.mvc)}
                    fields={[
                      { key: "mvc-mvcNo", label: "MVCC Number", value: mvcData.mvcNo || "", onChange: (e) => setMvcData((p) => ({ ...p, mvcNo: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                      { key: "mvc-issueDate", label: "Issue Date", value: mvcData.issueDate || "", onChange: (e) => setMvcData((p) => ({ ...p, issueDate: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                      { key: "mvc-engineNo", label: "Engine Number", value: mvcData.engineNo, onChange: (e) => setMvcData((p) => ({ ...p, engineNo: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                      { key: "mvc-chassisNo", label: "Chassis Number", value: mvcData.chassisNo, onChange: (e) => setMvcData((p) => ({ ...p, chassisNo: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                      { key: "mvc-plateNo", label: "Plate Number", value: mvcData.plateNo, onChange: (e) => setMvcData((p) => ({ ...p, plateNo: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                      { key: "mvc-mvFileNo", label: "MV File Number", value: mvcData.mvFileNo || mvcData.mvFileNumber || "", onChange: (e) => setMvcData((p) => ({ ...p, mvFileNo: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                      { key: "mvc-color", label: "Color", value: mvcData.color, onChange: (e) => setMvcData((p) => ({ ...p, color: e.target.value })), placeholder: "Auto-extracted from MVCC" },
                    ]}
                  />
                  <MvcMecUploadCard
                    title="MEC"
                    uploadLabel="Upload Motor Vehicle Emission Certificate"
                    onFile={handleMecUpload}
                    preview={mecPreview}
                    uploadHint={formatOcrHint(ocrUploadState.mec)}
                    fields={[
                      { key: "mec-engineNo", label: "Engine Number", value: mecData.engineNoStencilled, onChange: (e) => setMecData((p) => ({ ...p, engineNoStencilled: e.target.value })), placeholder: "Auto-extracted from MEC" },
                      { key: "mec-chassisNo", label: "Chassis Number", value: mecData.chassisNoStencilled, onChange: (e) => setMecData((p) => ({ ...p, chassisNoStencilled: e.target.value })), placeholder: "Auto-extracted from MEC" },
                      { key: "mec-plateNo", label: "Plate Number", value: mecData.plateNo, onChange: (e) => setMecData((p) => ({ ...p, plateNo: e.target.value })), placeholder: "Auto-extracted from MEC" },
                      { key: "mec-color", label: "Color", value: mecData.color, onChange: (e) => setMecData((p) => ({ ...p, color: e.target.value })), placeholder: "Auto-extracted from MEC" },
                    ]}
                  />
                </div>
              </div>
            )}

            {step === 7 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Issue Certificate</h3>
                </div>
                {isIssuingCertificate ? (
                  <div className="text-center py-8">
                    <Spinner size="lg" />
                    <p className="text-sm text-gray-500 mt-4">DCI portal is issuing certificate...</p>
                  </div>
                ) : certificateNo ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                    <p className="font-semibold text-green-700 text-lg">Certificate Issued</p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-2">{certificateNo}</p>
                    <p className="text-xs text-gray-500 mt-1">Plate: {orCr.plateNumber}</p>
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
                      Certificate issuance starts automatically after successful MVC/MEC validation.
                    </p>
                  </div>
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
                  step > 1 && (
                    <Button variant="ghost" onClick={prevStep}>
                      <ChevronLeft size={16} /> Back
                    </Button>
                  )
                )}
                <Button
                  variant="ghost"
                  onClick={() => step === 4 ? setIsDataMismatchModalOpen(true) : setIsTicketModalOpen(true)}
                  className="text-gray-500 hover:text-gray-700 font-medium"
                >
                  {step === 4 ? "Report Data Mismatch" : "Report an Issue"}
                </Button>
              </div>
              {step < flowSteps.length && (
                <div className="flex items-center gap-3">
                  {!canNext() && step === 2 && (orPreview || crPreview) && (
                    <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                      {orPreview && (!orNumber || orNumber === "Extracting...") && <p>• Missing OR Number</p>}
                      {orPreview && getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS)}</p>}
                      {crPreview && (!crNumber || crNumber === "Extracting...") && <p>• Missing CR Number</p>}
                      {crPreview && getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS)}</p>}
                    </div>
                  )}
                  {!canNext() && step === 6 && (mvcPreview || mecPreview) && (
                    <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                      {mvcPreview && getMissingFieldsText(mvcData, "MVCC") && <p>• {getMissingFieldsText(mvcData, "MVCC")}</p>}
                      {mecPreview && getMissingFieldsText(mecData, "MEC") && <p>• {getMissingFieldsText(mecData, "MEC")}</p>}
                    </div>
                  )}
                  <Button onClick={nextStep} disabled={!canNext() || isVerifyingDocuments}>
                    {isVerifyingDocuments ? "Verifying..." : "Next"} <ChevronRight size={16} />
                  </Button>
                </div>
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
    </div>
  );
};
