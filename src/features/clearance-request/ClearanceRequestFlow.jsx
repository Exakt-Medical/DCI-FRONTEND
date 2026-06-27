import { useEffect, useMemo, useState } from "react";
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
  Car,
  CarFront,
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
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";
import { DataMismatchModal } from "../verification/components/Datamismatchmodal";
import { ticketService } from "../../services/ticketService";
import { Paperclip } from "lucide-react";

const emptyVehicle = {
  plateNumber: "",
  mvFileNumber: "",
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

const makeRequestId = () => `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;
const makeCertificateNo = (index = 0) =>
  `DCI-CERT-${String(Date.now() + index).slice(-8)}`;

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

export const ClearanceRequestFlow = ({
  role,
  selectedRequest,
  availableVoucherRequests = [],
  voucherInventory = [],
  onVoucherInventoryChange,
  onSaveRequest,
  onComplete,
  onCancel,
}) => {
  const isAgent = role === "agent_fixer";
  const flowSteps = isAgent ? AGENT_STEPS : CITIZEN_STEPS;

  const [requestId] = useState(() => selectedRequest?.requestId || makeRequestId());
  const [step, setStep] = useState(() => selectedRequest?.currentStep || 1);
  const [requestStatus, setRequestStatus] = useState(
    () => selectedRequest?.status || "DRAFT",
  );
  const [dateCreated] = useState(
    () => selectedRequest?.dateCreated || new Date().toISOString().split("T")[0],
  );
  const [vehicleOption, setVehicleOption] = useState(selectedRequest?.vehicleOption || "");
  const [transactionType, setTransactionType] = useState(selectedRequest?.transactionType || "");

  const [orPreview, setOrPreview] = useState(selectedRequest?.orPreview || null);
  const [orNumber, setOrNumber] = useState(selectedRequest?.orNumber || "");
  const [orDate, setOrDate] = useState(selectedRequest?.orDate || "");
  const [orAmount, setOrAmount] = useState(selectedRequest?.orAmount || "");
  const [orCr, setOrCr] = useState(() => selectedRequest?.orCr || emptyVehicle);

  const [crPreview, setCrPreview] = useState(selectedRequest?.crPreview || null);
  const [crNumber, setCrNumber] = useState(selectedRequest?.crNumber || "");
  const [crCr, setCrCr] = useState(() => selectedRequest?.crCr || emptyVehicle);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(
    Boolean(isAgent || selectedRequest?.paymentDone),
  );
  const [verifyOrCrDone, setVerifyOrCrDone] = useState(selectedRequest?.verifyOrCrDone || false);
  const [inputChassisNumber, setInputChassisNumber] = useState(selectedRequest?.inputChassisNumber || "");
  const [inputEngineNumber, setInputEngineNumber] = useState(selectedRequest?.inputEngineNumber || "");
  const [inputPlateNumber, setInputPlateNumber] = useState(selectedRequest?.inputPlateNumber || "");
  const [inputMvFileNumber, setInputMvFileNumber] = useState(selectedRequest?.inputMvFileNumber || "");
  const [verifyingOrCr, setVerifyingOrCr] = useState(false);
  const [verifyOrCrError, setVerifyOrCrError] = useState(selectedRequest?.verifyOrCrError || "");
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showTicketAttachmentModal, setShowTicketAttachmentModal] = useState(false);
  const [ticketAttachmentFile, setTicketAttachmentFile] = useState({
    crAttachment: null,
    plateCertificationAttachment: null,
    actualPlateAttachment: null,
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const [issuingVoucher, setIssuingVoucher] = useState(false);
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

  const [agentMvcPreview, setAgentMvcPreview] = useState(null);
  const [agentMvcFileName, setAgentMvcFileName] = useState("");
  const [agentMvcData, setAgentMvcData] = useState(emptyMvc);
  const [agentMecPreview, setAgentMecPreview] = useState(null);
  const [agentMecFileName, setAgentMecFileName] = useState("");
  const [agentMecData, setAgentMecData] = useState(emptyMec);
  const [agentMvcMecRequestId, setAgentMvcMecRequestId] = useState("");

  const [isIssuingBulk, setIsIssuingBulk] = useState(false);
  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [certificateNo, setCertificateNo] = useState(selectedRequest?.certificateNo || "");
  const [selectedMvcMecRequestIds, setSelectedMvcMecRequestIds] = useState([]);
  const [citizenValidationState, setCitizenValidationState] = useState(
    selectedRequest?.mvcMecValidationState || VALIDATION_STATE.IDLE,
  );
  const [citizenValidationMessage, setCitizenValidationMessage] = useState(
    selectedRequest?.mvcMecValidationMessage || "",
  );

  const [queueRows, setQueueRows] = useState(() => {
    if (!isAgent) return [];

    if (selectedRequest?.requestId) {
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

  const vehicleMismatch =
    (orCr.mvFileNumber && crCr.mvFileNumber && orCr.mvFileNumber !== crCr.mvFileNumber) ||
    (orCr.plateNumber && crCr.plateNumber && orCr.plateNumber !== crCr.plateNumber);

  const updateOrCr = (field, value) =>
    setOrCr((prev) => ({ ...prev, [field]: value }));
  const updateCrCr = (field, value) =>
    setCrCr((prev) => ({ ...prev, [field]: value }));

  const isResume = Boolean(selectedRequest?.requestId);

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

  const assignableVouchersForRequest = (requestId) => {
    return voucherInventory.filter(
      (item) =>
        item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE ||
        (item.inventoryStatus === VOUCHER_INVENTORY_STATUS.ASSIGNED &&
          item.assignedToRequestId === requestId),
    );
  };

  const clearOrCrForm = () => {
    setOrPreview(null);
    setOrNumber("");
    setOrDate("");
    setOrAmount("");
    setOrCr(emptyVehicle);
    setCrPreview(null);
    setCrNumber("");
    setCrCr(emptyVehicle);
  };

  const persistRow = (row) => {
    if (!row?.requestId) return;
    onSaveRequest?.({
      ...row,
      requestId: row.requestId,
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
  };

  const saveCitizenRequest = (overrides = {}) => {
    const record = {
      requestId,
      dateCreated,
      currentStep: step,
      status: requestStatus,
      role,
      vehicleOption,
      transactionType,
      plateNumber:
        orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
      voucherCode,
      voucherReferenceNo: voucherCode,
      voucherAssigned,
      voucherStatus: voucherAssigned
        ? "VOUCHER_ISSUED"
        : (selectedRequest?.voucherStatus || (selectedRequest?.voucherCode ? "VOUCHER_ISSUED" : "")),

      paymentDone,
      verifyOrCrDone,
      verifyOrCrError,
      inputChassisNumber,
      inputEngineNumber,
      inputPlateNumber,
      inputMvFileNumber,
      hpgVerified,
      certificateNo,
      clearanceReferenceNo: certificateNo,
      clearanceStatus: certificateNo
        ? "CERTIFICATE_ISSUED"
        : selectedRequest?.clearanceStatus || "",
      orNumber,
      orDate,
      orAmount,
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

    onSaveRequest?.(record);
    return record;
  };

  const handleOrUpload = (file, preview) => {
    setOrPreview(preview);
    if (!file) return;

    setOrNumber("Extracting...");
    setOrDate("Extracting...");
    setOrAmount("Extracting...");
    updateOrCr("plateNumber", "Extracting...");

    setTimeout(() => {
      setOrNumber(`OR-${String(Date.now()).slice(-8)}`);
      setOrDate(new Date().toISOString().split("T")[0]);
      setOrAmount("PHP 100.00");
      updateOrCr(
        "plateNumber",
        orCr.plateNumber && orCr.plateNumber !== "Extracting..."
          ? orCr.plateNumber
          : "ABC1234",
      );
      updateOrCr("mvFileNumber", "13242500000003A");
      updateOrCr("engineNumber", "");
      updateOrCr("chassisNumber", "");
      updateOrCr("make", "TOYOTA");
      updateOrCr("series", "VIOS");
      updateOrCr("yearModel", "2020");
      updateOrCr("color", "WHITE");
      updateOrCr("ownerName", "JUAN DELA CRUZ");
      updateOrCr("ownerAddress", "123 Rizal St., Manila");
    }, 1200);
  };

  const handleCrUpload = (file, preview) => {
    setCrPreview(preview);
    if (!file) return;

    setCrNumber("Extracting...");
    updateCrCr("plateNumber", "Extracting...");

    setTimeout(() => {
      setCrNumber(`CR-${String(Date.now()).slice(-8)}`);
      updateCrCr(
        "plateNumber",
        crCr.plateNumber && crCr.plateNumber !== "Extracting..."
          ? crCr.plateNumber
          : "ABC1234",
      );
      updateCrCr("mvFileNumber", "13242500000003A");
      updateCrCr("engineNumber", `ENG-${String(Math.random()).slice(2, 8)}`);
      updateCrCr("chassisNumber", `CHA-${String(Math.random()).slice(2, 8)}`);
      updateCrCr("make", "TOYOTA");
      updateCrCr("series", "VIOS");
      updateCrCr("yearModel", "2020");
      updateCrCr("color", "WHITE");
      updateCrCr("ownerName", "JUAN DELA CRUZ");
      updateCrCr("ownerAddress", "123 Rizal St., Manila");
    }, 1200);
  };

  const handleAddToQueue = () => {
    if (!isAgent) return;

    const orOk =
      orNumber &&
      orCr.mvFileNumber &&
      orCr.engineNumber &&
      orCr.chassisNumber &&
      orCr.mvFileNumber !== "Extracting...";
    const crOk =
      crNumber &&
      crCr.mvFileNumber &&
      crCr.engineNumber &&
      crCr.chassisNumber &&
      crCr.mvFileNumber !== "Extracting...";
    const match = !vehicleMismatch;
    if (!(orOk && crOk && match)) return;

    const row = {
      requestId: makeRequestId(),
      role,
      dateCreated: new Date().toISOString().split("T")[0],
      currentStep: 1,
      status: "OR_CR_UPLOADED",
      voucherStatus: "PENDING_ASSIGNMENT",
      clearanceStatus: "",
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orNumber,
      orDate,
      orAmount,
      crNumber,
      orCr,
      crCr,
      orPreview,
      crPreview,
      hpgStatus: HPG_STATUS.PENDING,
      mvcMecUploaded: false,
    };

    setQueueRows((prev) => [row, ...prev]);
    persistRow(row);
    clearOrCrForm();
  };

  const updateVoucherInventory = (updater) => {
    if (!onVoucherInventoryChange) return;
    onVoucherInventoryChange((prev) =>
      updater(Array.isArray(prev) ? prev : voucherInventory),
    );
  };

  const assignVoucherForRow = (requestIdForRow, voucherId) => {
    const voucher = voucherInventory.find((item) => item.voucherId === voucherId);

    updateVoucherInventory((prev) =>
      voucherInventoryService.assignVoucherToRequest(prev, {
        voucherId,
        requestId: requestIdForRow,
        plateNumber:
          certificationQueue.find((item) => item.requestId === requestIdForRow)
            ?.plateNumber || "",
        assignedBy: role,
      }),
    );

    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.requestId !== requestIdForRow) return row;
        const updated = {
          ...row,
          voucherId,
          voucherReferenceNo: voucher?.voucherCode || row.voucherReferenceNo || "",
          voucherStatus: "VOUCHER_ISSUED",
          status: "VOUCHER_ASSIGNED",
          currentStep: 2,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const setHpgForRow = (requestIdForRow, nextStatus) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.requestId !== requestIdForRow) return row;
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
          currentStep: 3,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const setHpgForAll = (nextStatus) => {
    certificationQueue.forEach((row) => setHpgForRow(row.requestId, nextStatus));
  };

  const uploadMvcMecForRow = (requestIdForRow, uploadPayload = {}) => {
    const now = new Date().toISOString().split("T")[0];
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.requestId !== requestIdForRow) return row;
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
          currentStep: 4,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const uploadMvcMecForAll = () => {
    certificationQueue.forEach((row) => uploadMvcMecForRow(row.requestId));
  };

  const validateMvcMecForRow = (requestIdForRow) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.requestId !== requestIdForRow) return row;
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
          if (row.requestId !== requestIdForRow) return row;
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
            currentStep: 4,
          };
          persistRow(validated);
          return validated;
        });
      });
    }, 1300);
  };

  const validateSelectedMvcMecRows = () => {
    selectedMvcMecRequestIds.forEach((requestIdForRow) => {
      validateMvcMecForRow(requestIdForRow);
    });
    setSelectedMvcMecRequestIds([]);
  };

  const toggleSelectedMvcMecRow = (requestIdForRow) => {
    setSelectedMvcMecRequestIds((prev) =>
      prev.includes(requestIdForRow)
        ? prev.filter((id) => id !== requestIdForRow)
        : [...prev, requestIdForRow],
    );
  };

  const toggleSelectAllMvcMecRows = () => {
    const selectableIds = certificationQueue
      .filter((row) => row.mvcMecUploaded)
      .map((row) => row.requestId);

    setSelectedMvcMecRequestIds((prev) =>
      prev.length === selectableIds.length && selectableIds.length > 0
        ? []
        : selectableIds,
    );
  };

  const selectedMvcMecRows = certificationQueue.filter((row) =>
    selectedMvcMecRequestIds.includes(row.requestId),
  );
  const allMvcMecSelectableSelected =
    certificationQueue.some((row) => row.mvcMecUploaded) &&
    certificationQueue
      .filter((row) => row.mvcMecUploaded)
      .every((row) => selectedMvcMecRequestIds.includes(row.requestId));
  const hasSelectedMvcMecRows = selectedMvcMecRows.length > 0;

  useEffect(() => {
    const validIds = new Set(certificationQueue.map((row) => row.requestId));
    setSelectedMvcMecRequestIds((prev) =>
      prev.filter((requestIdForRow) => validIds.has(requestIdForRow)),
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

  const handleAgentMvcUpload = (file, preview) => {
    setAgentMvcPreview(preview);
    setAgentMvcFileName(file?.name || "");
    if (!file) return;

    setAgentMvcData((prev) => ({
      ...prev,
      mvcNo: "Extracting...",
      mvcIssueDate: "Extracting...",
      mvcValidUntil: "Extracting...",
      mvcStatus: "Extracting...",
    }));

    setTimeout(() => {
      setAgentMvcData({
        mvcNo: `MVC-${String(Date.now()).slice(-8)}`,
        mvcIssueDate: new Date().toISOString().split("T")[0],
        mvcValidUntil: "2026-12-31",
        mvcStatus: "CLEAR",
      });
    }, 1200);
  };

  const handleAgentMecUpload = (file, preview) => {
    setAgentMecPreview(preview);
    setAgentMecFileName(file?.name || "");
    if (!file) return;

    setAgentMecData((prev) => ({
      ...prev,
      mecNo: "Extracting...",
      mecIssueDate: "Extracting...",
      mecValidUntil: "Extracting...",
      mecCo2: "Extracting...",
      mecHc: "Extracting...",
      mecResult: "Extracting...",
    }));

    setTimeout(() => {
      setAgentMecData({
        mecNo: `MEC-${String(Date.now()).slice(-8)}`,
        mecIssueDate: new Date().toISOString().split("T")[0],
        mecValidUntil: "2026-12-31",
        mecCo2: "0.85 g/km",
        mecHc: "0.12 g/km",
        mecResult: "PASS",
      });
    }, 1200);
  };

  const handleAddAgentMvcMecToQueue = () => {
    if (!agentMvcMecRequestId) return;
    if (!agentMvcData.mvcNo || !agentMecData.mecNo) return;
    if (agentMvcData.mvcNo === "Extracting..." || agentMecData.mecNo === "Extracting...") {
      return;
    }

    uploadMvcMecForRow(agentMvcMecRequestId, {
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
      currentStep: 7,
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
          currentStep: 7,
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
      setStep(8);
      saveCitizenRequest({
        currentStep: 8,
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
            currentStep: 5,
          };
          persistRow(updated);
          return updated;
        });

        updateVoucherInventory((inventoryRows) => {
          return next.reduce((acc, row) => {
            if (!row.voucherId) return acc;
            return voucherInventoryService.markVoucherUsed(acc, {
              voucherId: row.voucherId,
              requestId: row.requestId,
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
    if (
      agentMvcMecRequestId &&
      selectableMvcMecRows.some((row) => row.requestId === agentMvcMecRequestId)
    ) {
      return;
    }
    setAgentMvcMecRequestId(selectableMvcMecRows[0]?.requestId || "");
  }, [agentMvcMecRequestId, isAgent, selectableMvcMecRows]);

  useEffect(() => {
    if (isAgent || step !== 8 || citizenValidationState !== VALIDATION_STATE.PASSED) return;
    if (certificateNo || isIssuingCertificate) return;
    if (!voucherAssigned) return;

    setIsIssuingCertificate(true);
    setTimeout(() => {
      const certNo = makeCertificateNo(0);
      setCertificateNo(certNo);
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      saveCitizenRequest({
        currentStep: 8,
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
    if (!isAgent || step !== 5 || isIssuingBulk) return;
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

  const handleProceedToPayment = () => {
    if (isAgent) return;
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentDone(true);
      setRequestStatus("PENDING");
      setStep(4);
      saveCitizenRequest({ currentStep: 4, status: "PENDING", paymentDone: true });
    }, 1600);
  };

  useEffect(() => {
    if (isAgent || step !== 4) return;
    if (!verifyOrCrDone && !verifyingOrCr && !verifyOrCrError) {
      setVerifyingOrCr(true);
      setVerifyOrCrError("");
      setTimeout(() => {
        setVerifyingOrCr(false);
        
        const checkVal = orCr.plateNumber || crCr.plateNumber || orCr.chassisNumber || "";
          
        if (checkVal.toUpperCase().includes("ERROR")) {
          setVerifyOrCrDone(false);
          const errorMsg = "No matching records found in the LTO Database. Please check your OR/CR documents.";
          setVerifyOrCrError(errorMsg);
          saveCitizenRequest({ verifyOrCrDone: false, verifyOrCrError: errorMsg });
        } else {
          setVerifyOrCrDone(true);
          saveCitizenRequest({ verifyOrCrDone: true, verifyOrCrError: "" });
        }
      }, 1500);
    }
  }, [isAgent, step, verifyOrCrDone, verifyingOrCr, verifyOrCrError, orCr, crCr]);

  const handleSubmitTicket = async (selectedMismatches = null) => {
    setIsSubmittingTicket(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `REF-${datePart}-${randPart}`;

      const isVehicleNotFound = !!verifyOrCrError;

      let mismatchesArray = [];
      if (selectedMismatches) {
        if (Array.isArray(selectedMismatches)) {
          mismatchesArray = selectedMismatches;
        } else if (selectedMismatches.crAttachment) {
          try {
            mismatchesArray = JSON.parse(selectedMismatches.crAttachment);
          } catch (e) {
            console.error(e);
          }
        }
      }

      let description = "";
      if (!isVehicleNotFound && mismatchesArray.length > 0) {
        description =
          "Mismatched fields: " +
          mismatchesArray
            .map(
              (m) =>
                `${m.field} (entered: ${m.expected || m.entered}, LTO record: ${m.actual})`,
            )
            .join("; ");
      } else {
        description = "Vehicle not found in LTO database.";
      }

      const ticketPayload = {
        referenceNumber,
        type: isVehicleNotFound ? "Vehicle Not Found" : "Data Mismatch",
        status: "PENDING",
        requestedBy:
          localStorage.getItem("username") ||
          JSON.parse(localStorage.getItem("user") || "{}")?.username ||
          "Citizen User",
        escalated: "YES",
        roleBased: "LTO",
        dateRequested: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        mvFileNo: orCr.mvFileNumber || crCr.mvFileNumber || null,
        plateNo: orCr.plateNumber || crCr.plateNumber || null,
        engineNo: orCr.engineNumber || crCr.engineNumber || null,
        chassisNo: orCr.chassisNumber || crCr.chassisNumber || null,
        make: orCr.make || null,
        series: orCr.series || null,
        vehicleColor: orCr.color || null,
        vehicleTypeDenomination: orCr.denomination || null,
        yearModel: orCr.yearModel || null,
        classification: orCr.classification || null,
        name: orCr.ownerName || null,
        address: description || orCr.ownerAddress || null,
        crAttachment: selectedMismatches?.crAttachment || null,
      };

      // Save mismatch fields to localStorage so TicketDetailModal can display them
      if (!isVehicleNotFound && mismatchesArray.length > 0) {
        const stored = JSON.parse(
          localStorage.getItem("ctpl_mismatch_fields") || "{}",
        );
        stored[referenceNumber] = mismatchesArray;
        localStorage.setItem("ctpl_mismatch_fields", JSON.stringify(stored));
      }

      await ticketService.create(ticketPayload);
      console.log("Mock submitted clearance flow ticket:", ticketPayload);

      setTicketAttachmentFile({
        crAttachment: null,
        plateCertificationAttachment: null,
        actualPlateAttachment: null,
      });
      alert(`Success! Support ticket ${referenceNumber} has been submitted.`);
    } catch (err) {
      console.error("Error creating ticket:", err);
    } finally {
      setIsSubmittingTicket(false);
      setShowMismatchModal(false);
      setShowTicketAttachmentModal(false);
    }
  };

  const handleRetryVerify = () => {
    setVerifyOrCrError("");
  };

  useEffect(() => {
    if (isAgent) return;

    if (step === 5 && verifyOrCrDone && paymentDone && !voucherAssigned && !issuingVoucher) {
      setIssuingVoucher(true);
      setTimeout(() => {
        const code = voucherCode || `VCH-${String(Date.now()).slice(-8)}`;
        setVoucherCode(code);
        setVoucherAssigned(true);
        setIssuingVoucher(false);
        setRequestStatus("VOUCHER_ISSUED");
        saveCitizenRequest({
          currentStep: 6,
          status: "VOUCHER_ISSUED",
          voucherCode: code,
          voucherReferenceNo: code,
          voucherAssigned: true,
          voucherStatus: "VOUCHER_ISSUED",
        });
        setStep(6);
      }, 900);
    }
  }, [
    isAgent,
    issuingVoucher,
    paymentDone,
    verifyOrCrDone,
    step,
    voucherAssigned,
    voucherCode,
  ]);

  const handleCitizenHpgVerify = () => {
    setHpgVerified(true);
    setRequestStatus("HPG_VERIFIED");
    setStep(7);
    saveCitizenRequest({ currentStep: 7, status: "HPG_VERIFIED", hpgVerified: true });
  };

  const handleMvcUpload = (file, preview) => {
    setMvcPreview(preview);
    setMvcFileName(file?.name || "");
    setCitizenValidationState(VALIDATION_STATE.PENDING);
    setCitizenValidationMessage("Awaiting DCI validation.");
    if (!file) return;

    setMvcData((prev) => ({
      ...prev,
      mvcNo: "Extracting...",
      mvcIssueDate: "Extracting...",
      mvcValidUntil: "Extracting...",
      mvcStatus: "Extracting...",
    }));

    setTimeout(() => {
      const next = {
        mvcNo: `MVC-${String(Date.now()).slice(-8)}`,
        mvcIssueDate: new Date().toISOString().split("T")[0],
        mvcValidUntil: "2026-12-31",
        mvcStatus: "CLEAR",
      };
      setMvcData(next);
      saveCitizenRequest({
        currentStep: 7,
        status: "MVC_MEC_VALIDATION_PENDING",
        mvcData: next,
        mvcMecValidationState: VALIDATION_STATE.PENDING,
        mvcMecValidationMessage: "Awaiting DCI validation.",
        mvcPreview: preview,
        mvcFileName: file.name,
      });
    }, 1200);
  };

  const handleMecUpload = (file, preview) => {
    setMecPreview(preview);
    setMecFileName(file?.name || "");
    setCitizenValidationState(VALIDATION_STATE.PENDING);
    setCitizenValidationMessage("Awaiting DCI validation.");
    if (!file) return;

    setMecData((prev) => ({
      ...prev,
      mecNo: "Extracting...",
      mecIssueDate: "Extracting...",
      mecValidUntil: "Extracting...",
      mecCo2: "Extracting...",
      mecHc: "Extracting...",
      mecResult: "Extracting...",
    }));

    setTimeout(() => {
      const next = {
        mecNo: `MEC-${String(Date.now()).slice(-8)}`,
        mecIssueDate: new Date().toISOString().split("T")[0],
        mecValidUntil: "2026-12-31",
        mecCo2: "0.85 g/km",
        mecHc: "0.12 g/km",
        mecResult: "PASS",
      };
      setMecData(next);
      saveCitizenRequest({
        currentStep: 7,
        status: "MVC_MEC_VALIDATION_PENDING",
        mecData: next,
        mvcMecValidationState: VALIDATION_STATE.PENDING,
        mvcMecValidationMessage: "Awaiting DCI validation.",
        mecPreview: preview,
        mecFileName: file.name,
      });
    }, 1200);
  };

  const handleDownload = () => {
    if (!certificateNo) return;
    const { doc, filename } = generateClearanceCertificatePDF({
      requestId,
      certificateNo,
      clearanceReferenceNo: certificateNo,
      plateNumber: orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
      voucherCode,
      voucherReferenceNo: voucherCode,
      dateCreated,
      status: requestStatus,
      clearanceStatus: "CERTIFICATE_ISSUED",
    });
    doc.save(filename);
  };

  const canNext = () => {
    if (isAgent) {
      if (step === 1) return certificationQueue.length > 0;
      if (step === 2) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every((row) => Boolean(row.voucherId))
        );
      }
      if (step === 3) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every((row) => row.hpgStatus === HPG_STATUS.APPROVED)
        );
      }
      if (step === 4) {
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
      if (vehicleOption) return Boolean(transactionType);
      return Boolean(vehicleOption);
    }
    if (step === 2) {
      if (vehicleOption === "new") {
        return Boolean(orCr.engineNumber && orCr.chassisNumber);
      }
      const orOk =
        orCr.plateNumber &&
        orCr.ownerName &&
        orCr.plateNumber !== "Extracting...";
      const crOk =
        crCr.plateNumber &&
        crCr.ownerName &&
        crCr.plateNumber !== "Extracting...";
      return Boolean(orOk && crOk && !vehicleMismatch);
    }
    if (step === 3) return paymentDone;
    if (step === 4) return verifyOrCrDone;
    if (step === 5) return voucherAssigned;
    if (step === 6) return hpgVerified;
    if (step === 7) return citizenValidationState === VALIDATION_STATE.PASSED && voucherAssigned;
    return false;
  };

  const nextStep = () => {
    const maxStep = isAgent ? 5 : 8;
    if (step < maxStep && canNext()) setStep((prev) => prev + 1);
  };

  const canPrev = () => {
    if (isAgent) return step > 1;

    if (certificateNo) return false;
    if (processingPayment) return false;
    if (paymentDone) {
      const target = step - 1;
      if (target < 4) return false;
    }
    return step > 1;
  };

  const prevStep = () => {
    if (!canPrev()) return;
    setStep((prev) => prev - 1);
  };

  const finishBulk = () => {
    onComplete?.({ rows: certificationQueue });
  };

  const finishCitizen = () => {
    onComplete?.({
      requestId,
      vehicleOption,
      voucherCode,
      certificateNo,
      vehicle: orCr,
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orCr,
      crCr,
      orNumber,
      orDate,
      orAmount,
      crNumber,
      dateCreated,
      currentStep: 8,
      status: "CERTIFICATE_ISSUED",
      voucherStatus: "VOUCHER_ISSUED",
      clearanceStatus: "CERTIFICATE_ISSUED",
      clearanceReferenceNo: certificateNo,
      voucherReferenceNo: voucherCode,
    });
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
                  <div key={label} className="flex-1 text-center relative min-w-0">
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
                        style={{ width: "calc(100% - 2rem)", left: "calc(50% + 1rem)" }}
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
                  numberLabel="or no."
                  numberValue={orNumber}
                  onNumberChange={(e) => setOrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from OR"
                  vehicleLabel="Vehicle Details (from OR)"
                  vehicleValues={orCr}
                  onVehicleChange={updateOrCr}
                />

                <VehicleDocumentUploadCard
                  title="CR"
                  uploadLabel="Upload Certificate of Registration"
                  onFile={handleCrUpload}
                  preview={crPreview}
                  numberLabel="Cr no."
                  numberValue={crNumber}
                  onNumberChange={(e) => setCrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from CR"
                  vehicleLabel="Vehicle Details (from CR)"
                  vehicleValues={crCr}
                  onVehicleChange={updateCrCr}
                />
              </div>

              {vehicleMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Vehicle details mismatch: Please ensure MV File Number, Engine Number, and Chassis Number match between OR and CR.
                  </p>
                </div>
              )}

              <Card className="mt-4 p-4 border border-blue-100 bg-blue-50/40">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bulk Queue Staging</p>
                    <p className="text-xs text-gray-600">Upload OR/CR then add each transaction to queue.</p>
                  </div>
                  <Button
                    onClick={handleAddToQueue}
                    disabled={
                      !orNumber ||
                      !crNumber ||
                      !orCr.mvFileNumber ||
                      !crCr.mvFileNumber ||
                      vehicleMismatch
                    }
                  >
                    Add To Queue
                  </Button>
                </div>

                {certificationQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">No staged entries yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-100 text-left">
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr key={row.requestId} className="border-b border-blue-50">
                            <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                            <td className="py-2 text-gray-700">{row.orCr?.ownerName || row.crCr?.ownerName || "-"}</td>
                            <td className="py-2 text-gray-600">{row.status || "OR_CR_UPLOADED"}</td>
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
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Assign Voucher (Bulk)</h3>
              </div>

              {certificationQueue.length === 0 ? (
                <p className="text-sm text-gray-500">No active requests available in queue.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Voucher</th>
                        <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificationQueue.map((row) => {
                        const options = assignableVouchersForRequest(row.requestId);
                        return (
                          <tr key={row.requestId} className="border-b border-gray-100">
                            <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                            <td className="py-2 text-gray-700 font-mono text-xs">{row.voucherReferenceNo || "-"}</td>
                            <td className="py-2">
                              <select
                                value={row.voucherId || ""}
                                onChange={(e) => assignVoucherForRow(row.requestId, e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                              >
                                <option value="">Select voucher</option>
                                {options.map((item) => (
                                  <option key={item.voucherId} value={item.voucherId}>
                                    {item.voucherCode} - {item.inventoryStatus}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {isAgent && step === 3 && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">HPG Portal (Bulk)</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setHpgForAll(HPG_STATUS.INSPECTION)}
                  >
                    Mark All Under Inspection
                  </Button>
                  <Button size="sm" onClick={() => setHpgForAll(HPG_STATUS.APPROVED)}>
                    Mark All Approved
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">HPG Status</th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationQueue.map((row) => (
                      <tr key={row.requestId} className="border-b border-gray-100">
                        <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                        <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                        <td className="py-2 text-gray-700">{row.hpgStatus || HPG_STATUS.PENDING}</td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setHpgForRow(row.requestId, HPG_STATUS.INSPECTION)}
                            >
                              Inspection
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setHpgForRow(row.requestId, HPG_STATUS.APPROVED)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setHpgForRow(row.requestId, HPG_STATUS.REJECTED)}
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

          {isAgent && step === 4 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Upload size={18} className="text-[#0059b5]" />
                    <h3 className="text-base font-bold text-gray-900">Upload MVCC/MEC (Bulk)</h3>
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
                    value={agentMvcMecRequestId}
                    onChange={(e) => setAgentMvcMecRequestId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select request for MVCC/MEC upload</option>
                    {selectableMvcMecRows.map((row) => (
                      <option key={row.requestId} value={row.requestId}>
                        {row.requestId} - {row.plateNumber || "NO_PLATE"}
                      </option>
                    ))}
                  </select>
                </div>

                {!agentMvcMecRequestId && (
                  <p className="mb-4 text-xs text-amber-700">
                    No selectable request found. Add a queue entry in step 1 first.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MvcMecUploadCard
                    title="MVCC"
                    uploadLabel="Upload Motor Vehicle Clearance"
                    onFile={handleAgentMvcUpload}
                    preview={agentMvcPreview}
                    fields={[
                      {
                        key: "agent-mvc-number",
                        label: "MVC Number",
                        value: agentMvcData.mvcNo,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({ ...prev, mvcNo: e.target.value })),
                        placeholder: "Auto-extracted from MVC",
                      },
                      {
                        key: "agent-mvc-issue-date",
                        label: "Issue Date",
                        value: agentMvcData.mvcIssueDate,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({ ...prev, mvcIssueDate: e.target.value })),
                        placeholder: "Auto-extracted from MVC",
                      },
                      {
                        key: "agent-mvc-valid-until",
                        label: "Valid Until",
                        value: agentMvcData.mvcValidUntil,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({ ...prev, mvcValidUntil: e.target.value })),
                        placeholder: "Auto-extracted from MVC",
                      },
                      {
                        key: "agent-mvc-status",
                        label: "Status",
                        value: agentMvcData.mvcStatus,
                        onChange: (e) =>
                          setAgentMvcData((prev) => ({ ...prev, mvcStatus: e.target.value })),
                        placeholder: "Auto-extracted from MVC",
                      },
                    ]}
                  />

                  <MvcMecUploadCard
                    title="MEC"
                    uploadLabel="Upload Motor Vehicle Emission"
                    onFile={handleAgentMecUpload}
                    preview={agentMecPreview}
                    fields={[
                      {
                        key: "agent-mec-number",
                        label: "MEC Number",
                        value: agentMecData.mecNo,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({ ...prev, mecNo: e.target.value })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-issue-date",
                        label: "Issue Date",
                        value: agentMecData.mecIssueDate,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({ ...prev, mecIssueDate: e.target.value })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-valid-until",
                        label: "Valid Until",
                        value: agentMecData.mecValidUntil,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({ ...prev, mecValidUntil: e.target.value })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-co2",
                        label: "CO2",
                        value: agentMecData.mecCo2,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({ ...prev, mecCo2: e.target.value })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-hc",
                        label: "HC",
                        value: agentMecData.mecHc,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({ ...prev, mecHc: e.target.value })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-result",
                        label: "Result",
                        value: agentMecData.mecResult,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({ ...prev, mecResult: e.target.value })),
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
                        !agentMvcMecRequestId ||
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
                  <h3 className="text-base font-bold text-gray-900">MVC/MEC Upload Queue</h3>
                </div>
                {certificationQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">No active requests available in queue.</p>
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
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">MVC</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">MEC</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">DCI Validation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr key={row.requestId} className="border-b border-gray-100">
                            <td className="py-2 align-middle pr-3">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-[#0059b5] focus:ring-[#0059b5]"
                                checked={selectedMvcMecRequestIds.includes(row.requestId)}
                                onChange={() => toggleSelectedMvcMecRow(row.requestId)}
                                disabled={!row.mvcMecUploaded}
                                aria-label={`Select MVC and MEC row for ${row.requestId}`}
                              />
                            </td>
                            <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                            <td className="py-2 text-gray-700 font-mono text-xs">{row.mvcData?.mvcNo || "-"}</td>
                            <td className="py-2 text-gray-700 font-mono text-xs">{row.mecData?.mecNo || "-"}</td>
                            <td className="py-2 text-gray-700">
                              {row.mvcMecValidationState || VALIDATION_STATE.PENDING}
                              {row.mvcMecValidationMessage ? ` - ${row.mvcMecValidationMessage}` : ""}
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

          {isAgent && step === 5 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Certificate Issuance (Bulk)</h3>
              </div>

              {isIssuingBulk ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">DCI portal is issuing certificates...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Certificates are automatically issued by DCI once all MVC/MEC uploads are validated.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="pb-2 w-28" />
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificate</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr key={row.requestId} className="border-b border-gray-100">
                            <td className="py-2 align-middle">
                              <CertificateActionButtons row={row} />
                            </td>
                            <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                            <td className="py-2 font-mono text-xs font-semibold text-gray-900">{row.certificateNo || "-"}</td>
                            <td className="py-2 text-gray-700">{row.certificateNo ? "CERTIFICATE_ISSUED" : "READY"}</td>
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
            <Card className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Vehicle Option</h3>
                <p className="text-gray-600">Please select if you are requesting a clearance certificate for a new or an existing vehicle.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div
                  onClick={() => {
                    if (vehicleOption !== "new") {
                      setVehicleOption("new");
                      setTransactionType("");
                    }
                  }}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    vehicleOption === "new"
                      ? "border-[#0059b5] bg-blue-50 ring-4 ring-blue-500/20"
                      : "border-gray-200 hover:border-[#0059b5] hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`p-4 rounded-full ${vehicleOption === "new" ? "bg-[#0059b5] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <CarFront size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">New Vehicle</h4>
                      <p className="text-sm text-gray-500">For newly purchased or unregistered vehicles.</p>
                    </div>
                  </div>
                </div>
                
                <div
                  onClick={() => {
                    if (vehicleOption !== "existing") {
                      setVehicleOption("existing");
                      setTransactionType("");
                    }
                  }}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    vehicleOption === "existing"
                      ? "border-[#0059b5] bg-blue-50 ring-4 ring-blue-500/20"
                      : "border-gray-200 hover:border-[#0059b5] hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`p-4 rounded-full ${vehicleOption === "existing" ? "bg-[#0059b5] text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Car size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Existing Vehicle</h4>
                      <p className="text-sm text-gray-500">For vehicles that are already registered.</p>
                    </div>
                  </div>
                </div>
              </div>

              {vehicleOption === "existing" && (
                <div className="mt-8 max-w-2xl mx-auto text-left">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Select Transaction Type</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Transfer of Ownership",
                      "Change Color / Body Design",
                      "Change Engine/Motor",
                      "Change Chassis/VIN/Frame",
                      "Permit to Assemble",
                      "Record Check"
                    ].map(type => (
                      <div 
                        key={type}
                        onClick={() => setTransactionType(type)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          transactionType === type 
                            ? "border-[#0059b5] bg-blue-50 text-[#0059b5]" 
                            : "border-gray-200 hover:border-[#0059b5] hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            transactionType === type ? "border-[#0059b5]" : "border-gray-300"
                          }`}>
                            {transactionType === type && <div className="w-2 h-2 rounded-full bg-[#0059b5]" />}
                          </div>
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vehicleOption === "new" && (
                <div className="mt-8 max-w-2xl mx-auto text-left">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Select Transaction Type</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      "Registration of Brand New Vehicle (locally purchased)",
                      "Registration of Brand New Imported Vehicle",
                      "Registration of CKD (Completely Knocked Down) Imported Vehicle"
                    ].map(type => (
                      <div 
                        key={type}
                        onClick={() => setTransactionType(type)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          transactionType === type 
                            ? "border-[#0059b5] bg-blue-50 text-[#0059b5]" 
                            : "border-gray-200 hover:border-[#0059b5] hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            transactionType === type ? "border-[#0059b5]" : "border-gray-300"
                          }`}>
                            {transactionType === type && <div className="w-2 h-2 rounded-full bg-[#0059b5]" />}
                          </div>
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {!isAgent && step === 2 && (
            <div>
              {vehicleOption === "existing" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <VehicleDocumentUploadCard
                      title="OR"
                      uploadLabel="Upload Official Receipt"
                      onFile={handleOrUpload}
                      preview={orPreview}
                      numberLabel="OR Number"
                      numberValue={orNumber}
                      onNumberChange={(e) => setOrNumber(e.target.value)}
                      numberPlaceholder="Auto-extracted from OR"
                      vehicleLabel="Vehicle Details (from OR)"
                      vehicleValues={orCr}
                      onVehicleChange={updateOrCr}
                      hideEngineAndChassis={true}
                    />

                    <VehicleDocumentUploadCard
                      title="CR"
                      uploadLabel="Upload Certificate of Registration"
                      onFile={handleCrUpload}
                      preview={crPreview}
                      numberLabel="CR Number"
                      numberValue={crNumber}
                      onNumberChange={(e) => setCrNumber(e.target.value)}
                      numberPlaceholder="Auto-extracted from CR"
                      vehicleLabel="Vehicle Details (from CR)"
                      vehicleValues={crCr}
                      onVehicleChange={updateCrCr}
                    />
                  </div>
                  {vehicleMismatch && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">
                        Vehicle details mismatch: Please ensure MV File Number and Plate Number match between OR and CR.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-6 max-w-lg mx-auto">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">New Vehicle Details</h3>
                    <p className="text-sm text-gray-600">Please enter the engine and chassis numbers for your new vehicle.</p>
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Engine Number"
                      value={orCr.engineNumber || ""}
                      onChange={(e) => updateOrCr("engineNumber", e.target.value)}
                      placeholder="Enter Engine Number"
                      required
                    />
                    <Input
                      label="Chassis Number"
                      value={orCr.chassisNumber || ""}
                      onChange={(e) => updateOrCr("chassisNumber", e.target.value)}
                      placeholder="Enter Chassis Number"
                      required
                    />
                  </div>
                </Card>
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
                <p className="text-sm text-gray-500 mb-1">Certificate Request Fee</p>
                <p className="text-3xl font-bold text-gray-900">PHP 100.00</p>
                <p className="text-xs text-gray-500 mt-1">Single payment covers the whole request.</p>
              </div>
              {processingPayment ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">Processing payment...</p>
                </div>
              ) : paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Payment Completed</p>
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
                <h3 className="text-base font-bold text-gray-900">Verify OR/CR</h3>
              </div>
              
              {verifyingOrCr ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">Connecting to LTO Database...</p>
                </div>
              ) : verifyOrCrDone ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mt-2">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <CheckCircle size={20} className="text-green-500" />
                    <h4 className="font-bold text-gray-900">LTO Verification Successful</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Make</p>
                      <p className="font-medium text-gray-900">{orCr.make || "TOYOTA"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Series</p>
                      <p className="font-medium text-gray-900">{orCr.series || "VIOS"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Year Model</p>
                      <p className="font-medium text-gray-900">{orCr.yearModel || "2020"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Color</p>
                      <p className="font-medium text-gray-900">{orCr.color || "WHITE"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Owner</p>
                      <p className="font-medium text-gray-900">{orCr.ownerName || "JUAN DELA CRUZ"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Classification</p>
                      <p className="font-medium text-gray-900">{orCr.classification || "PRIVATE"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Vehicle Type</p>
                      <p className="font-medium text-gray-900">{orCr.vehicleType || "CAR"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Engine Number</p>
                      <p className="font-medium text-gray-900">{orCr.engineNumber || "ENG-098765"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Chassis No.</p>
                      <p className="font-medium text-gray-900">{orCr.chassisNumber || "CHA-123456"}</p>
                    </div>
                    {vehicleOption === "existing" && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Plate Number</p>
                        <p className="font-medium text-gray-900">{orCr.plateNumber || "ABC1234"}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <Button onClick={() => setShowMismatchModal(true)} variant="secondary">
                      Report Data Mismatch
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {verifyOrCrError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-center">
                      <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
                      <p className="font-semibold text-red-700">Verification Failed</p>
                      <p className="text-sm text-red-600 mt-1">{verifyOrCrError}</p>
                    </div>
                  )}
                  {verifyOrCrError && (
                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleRetryVerify}
                        className="w-full"
                      >
                        Retry Verification
                      </Button>
                      <Button
                        onClick={() => setShowTicketAttachmentModal(true)}
                        variant="secondary"
                        className="w-full"
                      >
                        Submit Support Ticket
                      </Button>
                    </div>
                  )}
                </>
              )}

            </Card>
          )}

          {!isAgent && step === 5 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Ticket size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Issue Voucher</h3>
              </div>
              {issuingVoucher ? (
                <div className="flex flex-col items-center justify-center py-5">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">Generating voucher...</p>
                </div>
              ) : voucherAssigned ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 text-lg">Voucher Issued</p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">{voucherCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Plate: {orCr.plateNumber}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Voucher issues automatically after payment.</p>
                </div>
              )}
            </Card>
          )}

          {!isAgent && step === 6 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">HPG Pending</h3>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  Please present your transaction to HPG/LTO. You can verify status below.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Transaction Code: <span className="font-mono font-semibold">{voucherCode}</span>
                </p>
              </div>
              <div className="mt-4">
                <Button onClick={handleCitizenHpgVerify}>
                  <CheckCircle size={16} /> Has been verified by HPG
                </Button>
              </div>
            </Card>
          )}

          {!isAgent && step === 7 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MvcMecUploadCard
                  title="MVCC"
                  uploadLabel="Upload Motor Vehicle Clearance"
                  onFile={handleMvcUpload}
                  preview={mvcPreview}
                  fields={[
                    {
                      key: "citizen-mvc-number",
                      label: "MVCC Number",
                      value: mvcData.mvcNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({ ...prev, mvcNo: e.target.value })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-issue-date",
                      label: "Issue Date",
                      value: mvcData.mvcIssueDate,
                      onChange: (e) =>
                        setMvcData((prev) => ({ ...prev, mvcIssueDate: e.target.value })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-valid-until",
                      label: "Valid Until",
                      value: mvcData.mvcValidUntil,
                      onChange: (e) =>
                        setMvcData((prev) => ({ ...prev, mvcValidUntil: e.target.value })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-status",
                      label: "Status",
                      value: mvcData.mvcStatus,
                      onChange: (e) =>
                        setMvcData((prev) => ({ ...prev, mvcStatus: e.target.value })),
                      placeholder: "Auto-extracted from MVC",
                    },
                  ]}
                />

                <MvcMecUploadCard
                  title="MEC"
                  uploadLabel="Upload Motor Vehicle Emission"
                  onFile={handleMecUpload}
                  preview={mecPreview}
                  fields={[
                    {
                      key: "citizen-mec-number",
                      label: "MEC Number",
                      value: mecData.mecNo,
                      onChange: (e) =>
                        setMecData((prev) => ({ ...prev, mecNo: e.target.value })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-issue-date",
                      label: "Issue Date",
                      value: mecData.mecIssueDate,
                      onChange: (e) =>
                        setMecData((prev) => ({ ...prev, mecIssueDate: e.target.value })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-valid-until",
                      label: "Valid Until",
                      value: mecData.mecValidUntil,
                      onChange: (e) =>
                        setMecData((prev) => ({ ...prev, mecValidUntil: e.target.value })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-co2",
                      label: "CO2",
                      value: mecData.mecCo2,
                      onChange: (e) =>
                        setMecData((prev) => ({ ...prev, mecCo2: e.target.value })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-hc",
                      label: "HC",
                      value: mecData.mecHc,
                      onChange: (e) =>
                        setMecData((prev) => ({ ...prev, mecHc: e.target.value })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-result",
                      label: "Result",
                      value: mecData.mecResult,
                      onChange: (e) =>
                        setMecData((prev) => ({ ...prev, mecResult: e.target.value })),
                      placeholder: "Auto-extracted from MEC",
                    },
                  ]}
                />
              </div>

              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">DCI Validation</p>
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
                  Status: <span className="font-semibold">{citizenValidationState}</span>
                  {citizenValidationMessage ? ` - ${citizenValidationMessage}` : ""}
                </div>
                {citizenValidationState === VALIDATION_STATE.FAILED && (
                  <p className="mt-2 text-xs text-amber-700">
                    Validation failed. Request remains pending and cannot proceed to certificate issuance.
                  </p>
                )}
              </Card>
            </div>
          )}

          {!isAgent && step === 8 && (
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

          <div className="flex justify-between mt-6">
            <div>
              {step > 1 ? (
                <Button variant="secondary" onClick={prevStep} disabled={!canPrev()}>
                  <ChevronLeft size={16} /> Previous
                </Button>
              ) : (
                <Button variant="ghost" onClick={onCancel}>
                  <X size={16} /> Cancel
                </Button>
              )}
            </div>
            {step < flowSteps.length ? (
              <Button onClick={nextStep} disabled={!canNext()}>
                Next <ChevronRight size={16} />
              </Button>
            ) : !isAgent && certificateNo ? (
              <Button onClick={finishCitizen}>
                <CheckCircle size={16} /> Complete
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <CreateTicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        onSubmit={async (ticketData) => {
          console.log("Mock submitted ticket:", ticketData);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return { id: `TKT-${Date.now()}` };
        }}
      />

      {/* Data Mismatch Modal */}
      {showMismatchModal && (
        <DataMismatchModal
          vehicleData={{
            plate_number: orCr.plateNumber || "",
            mv_file_number: orCr.mvFileNumber || "",
            engine_number: orCr.engineNumber || "",
            chassis_number: orCr.chassisNumber || "",
            make: orCr.make || "",
            series: orCr.series || "",
            color: orCr.color || "",
            denomination: orCr.vehicleType || orCr.denomination || "",
            year_model: orCr.yearModel || "",
            classification: orCr.classification || "",
          }}
          ownerData={{
            firstName: orCr.ownerName?.split(" ")?.[0] || "",
            lastName: orCr.ownerName?.split(" ")?.slice(1)?.join(" ") || "",
            middleName: "",
            address: orCr.ownerAddress || "",
            contactNo: "",
            email: "",
            tin: "",
          }}
          onSubmit={(selectedMismatches) =>
            handleSubmitTicket(selectedMismatches)
          }
          onClose={() => setShowMismatchModal(false)}
          isSubmitting={isSubmittingTicket}
        />
      )}

      {/* Attachments Only Ticket Modal */}
      {showTicketAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Paperclip size={20} className="text-primary-600" />
                Vehicle Attachments
              </h3>

              <button
                onClick={() => setShowTicketAttachmentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="space-y-6">
                {/* CR Attachment */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    CR Attachment (Optional)
                  </label>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-5 py-3 rounded-lg">
                      Choose File
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) =>
                          setTicketAttachmentFile((prev) => ({
                            ...prev,
                            crAttachment: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    <span className="text-sm text-gray-500">
                      {ticketAttachmentFile?.crAttachment
                        ? ticketAttachmentFile.crAttachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>

                {/* Plate Certification */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Plate Certification Attachment (Optional)
                  </label>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-5 py-3 rounded-lg">
                      Choose File
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) =>
                          setTicketAttachmentFile((prev) => ({
                            ...prev,
                            plateCertificationAttachment:
                              e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    <span className="text-sm text-gray-500">
                      {ticketAttachmentFile?.plateCertificationAttachment
                        ? ticketAttachmentFile.plateCertificationAttachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>

                {/* Actual Plate */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Actual Plate Attachment (Optional)
                  </label>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-5 py-3 rounded-lg">
                      Choose File
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) =>
                          setTicketAttachmentFile((prev) => ({
                            ...prev,
                            actualPlateAttachment: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    <span className="text-sm text-gray-500">
                      {ticketAttachmentFile?.actualPlateAttachment
                        ? ticketAttachmentFile.actualPlateAttachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Supported formats: JPG, PNG, PDF, DOC (Max 5MB)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setTicketAttachmentFile({
                    crAttachment: null,
                    plateCertificationAttachment: null,
                    actualPlateAttachment: null,
                  });
                  setShowTicketAttachmentModal(false);
                }}
                disabled={isSubmittingTicket}
              >
                Cancel
              </Button>

              <Button
                className="flex items-center gap-2"
                onClick={() => handleSubmitTicket()}
                disabled={isSubmittingTicket}
              >
                <Spinner size="xs" className={isSubmittingTicket ? "block" : "hidden"} />
                Create Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
