import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CertificateActionButtons } from "./components/CertificateActionButtons";
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
  Eye,
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
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { generateDciCodeSlipPDF } from "./utils/generateDciCodeSlipPDF";
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

const maskOwnerName = (name) => {
  if (!name) return "-";
  const str = String(name).trim();
  if (str.length <= 2) return str;
  return str.slice(0, 2) + "*".repeat(str.length - 2);
};

const makeRequestId = () => `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;
const makeCertificateNo = (index = 0) =>
  `DCI-CERT-${String(Date.now() + index).slice(-8)}`;

const evaluateMvcMecValidation = (mvcPayload, mecPayload) => {
  if (!mvcPayload?.mvcNo || !mvcPayload?.mvcIssueDate || !mecPayload?.plateNo) {
    return { valid: false, reason: "Missing MVCC Number, MVCC Issue Date, or MEC Plate Number." };
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
  onOngoingChange,
}) => {
  const isAgent = role === "agent_fixer";
  const flowSteps = isAgent ? AGENT_STEPS : CITIZEN_STEPS;


  const availableCreditsCount = voucherInventory.filter(
    (item) => item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE
  ).length;

  const [requestId] = useState(() => selectedRequest?.requestId || makeRequestId());
  const [step, setStep] = useState(() => {
    if (selectedRequest) {
      if (isAgent) {
        if (selectedRequest.certificateNo) return 5;
        if (selectedRequest.mvcMecValidationState === VALIDATION_STATE.PASSED) return 5;
        if (selectedRequest.hpgStatus === HPG_STATUS.APPROVED) return 5;
        if (selectedRequest.voucherAssigned) return 4;
        if (selectedRequest.orCr || selectedRequest.crCr) return 2;
      }
      return selectedRequest.currentStep || 1;
    }
    return 1;
  });
  const [requestStatus, setRequestStatus] = useState(
    () => selectedRequest?.status || "DRAFT",
  );
  const [dateCreated] = useState(
    () => selectedRequest?.dateCreated || new Date().toISOString().split("T")[0],
  );
  const [vehicleOption, setVehicleOption] = useState(selectedRequest?.vehicleOption || "existing");
  const [transactionType, setTransactionType] = useState(selectedRequest?.transactionType || "");
  const [showConfirmUploadModal, setShowConfirmUploadModal] = useState(false);

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
  const [verifyingAgentRowId, setVerifyingAgentRowId] = useState("");
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [showAllVerifiedCards, setShowAllVerifiedCards] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showTicketAttachmentModal, setShowTicketAttachmentModal] = useState(false);
  const [ticketAttachments, setTicketAttachments] = useState([]);
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
            selectedRequest.mvcData?.mvcNo && selectedRequest.mecData?.plateNo,
          ),
        },
      ];
    }
    return [];
  });

  useEffect(() => {
    let ongoing = false;
    if (isAgent) {
      if (step === 2 || step === 3) {
        ongoing = true;
      }
    } else {
      if (step >= 2 && step <= 5) {
        ongoing = true;
      }
    }
    onOngoingChange?.(ongoing);
    return () => onOngoingChange?.(false);
  }, [step, isAgent, onOngoingChange]);

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
        mvcMecUploaded: Boolean(item.mvcData?.mvcNo && item.mecData?.plateNo),
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

  const handleAgentAutoAssignCodes = () => {
    const validQueue = certificationQueue.filter((row) => row.verifyOrCrDone);

    const unassignedRows = validQueue.filter((r) => !r.voucherAssigned);
    if (unassignedRows.length === 0) {
      setQueueRows((prev) => prev.filter((row) => !row.verifyOrCrError));
      setStep((prev) => prev + 1);
      return;
    }

    const availableCredits = voucherInventory.filter(
      (item) => item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE,
    );

    if (availableCredits.length < unassignedRows.length) {
      alert("Insufficient Transaction Credits. Please purchase more credits to proceed.");
      return;
    }

    let currentCredits = [...availableCredits];
    const updatedRows = validQueue.map((row) => {
      if (row.voucherAssigned) return row;
      const creditToUse = currentCredits.shift();
      return {
        ...row,
        voucherId: creditToUse.voucherId,
        voucherCode: creditToUse.voucherCode,
        voucherReferenceNo: creditToUse.voucherCode,
        voucherAssigned: true,
        voucherStatus: "VOUCHER_ISSUED",
      };
    });

    setQueueRows((prev) => {
      const withoutFailed = prev.filter((row) => !row.verifyOrCrError);
      return withoutFailed.map((row) => {
        const updated = updatedRows.find((u) => u.requestId === row.requestId);
        return updated ? updated : row;
      });
    });

    updateVoucherInventory((inventoryRows) => {
      let newInventory = [...inventoryRows];
      updatedRows.forEach((row) => {
        if (row.voucherId) {
          newInventory = voucherInventoryService.assignVoucherToRequest(newInventory, {
            voucherId: row.voucherId,
            requestId: row.requestId,
          });
        }
      });
      return newInventory;
    });

    setStep((prev) => prev + 1);
  };

  const handleVerifyAll = () => {
    setIsVerifyingAll(true);
    setShowAllVerifiedCards(false);

    setTimeout(() => {
      setQueueRows((prev) => {
        let currentCredits = voucherInventory.filter(
          (item) => item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE,
        );

        const mappedRows = prev.map((row) => {
          if (row.verifyOrCrDone || row.verifyOrCrError) return row;

          const checkVal = `${row.plateNumber || ""} ${row.orCr?.plateNumber || ""} ${row.crCr?.plateNumber || ""} ${row.orCr?.chassisNumber || ""} ${row.orCr?.engineNumber || ""} ${row.crCr?.chassisNumber || ""} ${row.crCr?.engineNumber || ""}`;
          
          let updatedRow = { ...row };

          if (checkVal.includes("0000")) {
            updatedRow.verifyOrCrDone = false;
            updatedRow.verifyOrCrError = "No matching records found in the LTO Database. Please check your OR/CR documents.";
          } else {
            updatedRow.verifyOrCrDone = true;
            updatedRow.verifyOrCrError = "";
          }

          if (updatedRow.verifyOrCrDone && !updatedRow.voucherAssigned) {
            const creditToUse = currentCredits.shift();
            if (creditToUse) {
              updatedRow.voucherId = creditToUse.voucherId;
              updatedRow.voucherCode = creditToUse.voucherCode;
              updatedRow.voucherReferenceNo = creditToUse.voucherCode;
              updatedRow.voucherAssigned = true;
              updatedRow.voucherStatus = "VOUCHER_ISSUED";
            }
          }

          return updatedRow;
        });

        updateVoucherInventory((inventoryRows) => {
          let newInventory = [...inventoryRows];
          mappedRows.forEach((row) => {
            if (row.voucherId && row.verifyOrCrDone) {
              newInventory = voucherInventoryService.assignVoucherToRequest(newInventory, {
                voucherId: row.voucherId,
                requestId: row.requestId,
              });
            }
          });
          return newInventory;
        });

        // Persist rows to reflect assigned vouchers globally
        mappedRows.forEach((r) => persistRow(r));

        return mappedRows;
      });
      setIsVerifyingAll(false);
      setShowAllVerifiedCards(true);
    }, 2000);
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

  const cacheVehicleDetails = (record) => {
    if (!record) return;
    try {
      const saved = JSON.parse(localStorage.getItem("dci_vehicle_details") || "{}");
      const vehiclePayload = {
        make: record.orCr?.make || record.crCr?.make || record.make || "",
        series: record.orCr?.series || record.crCr?.series || record.series || "",
        mvFileNumber: record.orCr?.mvFileNumber || record.orCr?.mvFileNo || record.crCr?.mvFileNumber || record.crCr?.mvFileNo || record.mvFileNumber || "",
        engineNumber: record.orCr?.engineNumber || record.orCr?.engineNo || record.crCr?.engineNumber || record.crCr?.engineNo || record.engineNumber || "",
        chassisNumber: record.orCr?.chassisNumber || record.orCr?.chassisNo || record.crCr?.chassisNumber || record.crCr?.chassisNo || record.chassisNumber || "",
        plateNumber: record.orCr?.plateNumber || record.orCr?.plateNo || record.crCr?.plateNumber || record.crCr?.plateNo || record.plateNumber || record.plateNo || "",
        color: record.orCr?.color || record.crCr?.color || record.color || "",
        vehicleType: record.orCr?.vehicleType || record.crCr?.vehicleType || record.vehicleType || "",
        yearModel: record.orCr?.yearModel || record.crCr?.yearModel || record.yearModel || "",
        classification: record.orCr?.classification || record.crCr?.classification || record.classification || "",
        mvcNo: record.mvcData?.mvcNo || record.mvcNo || "",
        mvcIssueDate: record.mvcData?.mvcIssueDate || record.mvcData?.issueDate || record.mvcIssueDate || record.issueDate || "",
      };

      const keys = [
        record.plateNumber,
        record.plateNo,
        record.orCr?.plateNumber,
        record.crCr?.plateNumber,
        record.requestId,
        record.id,
        record.certificateNo,
        record.clearanceReferenceNo
      ].filter(Boolean);

      keys.forEach((key) => {
        saved[key] = { ...saved[key], ...vehiclePayload };
      });
      localStorage.setItem("dci_vehicle_details", JSON.stringify(saved));
    } catch (e) {
      console.error("Failed to cache vehicle details:", e);
    }
  };

  const persistRow = (row) => {
    if (!row?.requestId) return;
    const payload = {
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
    };
    cacheVehicleDetails(payload);
    onSaveRequest?.(payload);
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

    cacheVehicleDetails(record);
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

    if (certificationQueue.length >= availableCreditsCount) {
      alert("You don't have enough credits to add another request.");
      return;
    }

    if (vehicleOption !== "new") {
      const orOk =
        orNumber &&
        orCr.mvFileNumber &&
        orCr.mvFileNumber !== "Extracting...";
      const crOk =
        crNumber &&
        crCr.mvFileNumber &&
        crCr.engineNumber &&
        crCr.chassisNumber &&
        crCr.mvFileNumber !== "Extracting...";
      const match = !vehicleMismatch;
      if (!(orOk && crOk && match)) return;
    } else {
      if (!orCr.engineNumber || !orCr.chassisNumber) return;
    }

    const row = {
      requestId: makeRequestId(),
      role,
      vehicleOption,
      transactionType,
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
            engineNo: "ENG-987654",
            chassisNo: "CHA-123456",
            plateNo: "ABC1234",
            mvFileNo: "12345678901",
            color: "WHITE",
          };
        const nextMecData = uploadPayload.mecData?.plateNo
          ? uploadPayload.mecData
          : {
            engineNoStencilled: "ENG-987654",
            chassisNoStencilled: "CHA-123456",
            plateNo: "ABC1234",
            color: "WHITE",
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
      .filter((row) => row.mvcMecUploaded && row.mvcMecValidationState !== VALIDATION_STATE.PASSED)
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
    certificationQueue.some((row) => row.mvcMecUploaded && row.mvcMecValidationState !== VALIDATION_STATE.PASSED) &&
    certificationQueue
      .filter((row) => row.mvcMecUploaded && row.mvcMecValidationState !== VALIDATION_STATE.PASSED)
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
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      mvFileNo: "Extracting...",
      color: "Extracting...",
    }));

    setTimeout(() => {
      setAgentMvcData({
        mvcNo: `MVC-${String(Date.now()).slice(-8)}`,
        mvcIssueDate: new Date().toISOString().split("T")[0],
        engineNo: "ENG-987654",
        chassisNo: "CHA-123456",
        plateNo: "ABC1234",
        mvFileNo: "12345678901",
        color: "WHITE",
      });
    }, 1200);
  };

  const handleAgentMecUpload = (file, preview) => {
    setAgentMecPreview(preview);
    setAgentMecFileName(file?.name || "");
    if (!file) return;

    setAgentMecData((prev) => ({
      ...prev,
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
    }));

    setTimeout(() => {
      setAgentMecData({
        engineNoStencilled: "ENG-987654",
        chassisNoStencilled: "CHA-123456",
        plateNo: "ABC1234",
        color: "WHITE",
      });
    }, 1200);
  };

  const handleAddAgentMvcMecToQueue = () => {
    if (!agentMvcMecRequestId) return;
    if (!agentMvcData.mvcNo || !agentMecData.plateNo) return;
    if (agentMvcData.mvcNo === "Extracting..." || agentMecData.plateNo === "Extracting...") {
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
    if (!mvcData.mvcNo || !mecData.plateNo) return;

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

  const handleCitizenDciValidation = () => {
    if (isIssuingCertificate) return;
    setIsIssuingCertificate(true);
    setTimeout(() => {
      const certNo = makeCertificateNo(0);
      setCertificateNo(certNo);
      
      const mockMvcNo = mvcData?.mvcNo && mvcData.mvcNo !== "Extracting..."
        ? mvcData.mvcNo
        : `MVCC-${String(Date.now()).slice(-8)}`;

      const newMvc = {
        ...mvcData,
        mvcNo: mockMvcNo,
      };
      setMvcData(newMvc);

      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      saveCitizenRequest({
        currentStep: 7,
        status: "CERTIFICATE_ISSUED",
        certificateNo: certNo,
        clearanceReferenceNo: certNo,
        clearanceStatus: "CERTIFICATE_ISSUED",
        voucherAssigned: true,
        voucherStatus: "VOUCHER_ISSUED",
        voucherCode: voucherCode,
        voucherReferenceNo: voucherCode,
        mvcData: newMvc,
      });
    }, 1500);
  };

  const handleAgentMockDciValidation = () => {
    if (isIssuingBulk) return;
    setIsIssuingBulk(true);

    setTimeout(() => {
      setQueueRows((prev) => {
        const source = prev.length > 0 ? prev : fallbackRows;
        const next = source.map((row, idx) => {
          const certNo = row.certificateNo || makeCertificateNo(idx);
          const mockMvcNo = row.mvcData?.mvcNo && row.mvcData.mvcNo !== "Extracting..."
            ? row.mvcData.mvcNo
            : `MVCC-${String(Date.now() + idx).slice(-8)}`;

          const updated = {
            ...row,
            mvcMecValidationState: VALIDATION_STATE.PASSED,
            mvcMecValidationMessage: "Validated by DCI portal.",
            mvcData: {
              ...row.mvcData,
              mvcNo: mockMvcNo,
            },
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
    }, 1500);
  };


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
    if (!isAgent && step !== 4) return;
    if (isAgent && (step !== 3 || !verifyingAgentRowId)) return;
    if (!verifyOrCrDone && !verifyingOrCr && !verifyOrCrError) {
      setVerifyingOrCr(true);
      setVerifyOrCrError("");
      setTimeout(() => {
        setVerifyingOrCr(false);

        const checkVal = `${orCr.plateNumber || ""} ${crCr.plateNumber || ""} ${orCr.chassisNumber || ""} ${orCr.engineNumber || ""} ${crCr.chassisNumber || ""} ${crCr.engineNumber || ""}`;

        if (checkVal.includes("0000")) {
          setVerifyOrCrDone(false);
          const errorMsg = "No matching records found in the LTO Database. Please check your OR/CR documents.";
          setVerifyOrCrError(errorMsg);
          if (isAgent) {
            setQueueRows((prev) =>
              prev.map((r) =>
                r.requestId === verifyingAgentRowId
                  ? { ...r, verifyOrCrDone: false, verifyOrCrError: errorMsg }
                  : r,
              ),
            );
          } else {
            saveCitizenRequest({ verifyOrCrDone: false, verifyOrCrError: errorMsg });
          }
        } else {
          setVerifyOrCrDone(true);
          if (isAgent) {
            setQueueRows((prev) =>
              prev.map((r) =>
                r.requestId === verifyingAgentRowId
                  ? { ...r, verifyOrCrDone: true, verifyOrCrError: "" }
                  : r,
              ),
            );
          } else {
            saveCitizenRequest({ verifyOrCrDone: true, verifyOrCrError: "" });
          }
        }
      }, 1500);
    }
  }, [isAgent, step, verifyingAgentRowId, verifyOrCrDone, verifyingOrCr, verifyOrCrError, orCr, crCr]);

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
        attachments: ticketAttachments.map(f => f.name),
        crAttachment: ticketAttachments[0]?.name || null,
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

      setTicketAttachments([]);
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
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      mvFileNo: "Extracting...",
      color: "Extracting...",
    }));

    setTimeout(() => {
      const next = {
        mvcNo: `MVC-${String(Date.now()).slice(-8)}`,
        mvcIssueDate: new Date().toISOString().split("T")[0],
        engineNo: "ENG-987654",
        chassisNo: "CHA-123456",
        plateNo: "ABC1234",
        mvFileNo: "12345678901",
        color: "WHITE",
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
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
    }));

    setTimeout(() => {
      const next = {
        engineNoStencilled: "ENG-987654",
        chassisNoStencilled: "CHA-123456",
        plateNo: "ABC1234",
        color: "WHITE",
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

  const handleDownload = async () => {
    if (!certificateNo) return;
    const { doc, filename } = await generateClearanceCertificatePDF({
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

  const handlePreview = async () => {
    if (!certificateNo) return;
    const { doc } = await generateClearanceCertificatePDF({
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
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadSlip = async () => {
    if (!voucherCode) return;
    const { doc, filename } = await generateDciCodeSlipPDF({
      requestId,
      voucherCode,
      voucherReferenceNo: voucherCode,
      dateCreated,
      ownerName: orCr.ownerName || crCr.ownerName || selectedRequest?.ownerName || "",
      plateNumber: orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
      mvFileNumber: orCr.mvFileNumber || crCr.mvFileNumber || selectedRequest?.mvFileNumber || "",
      engineNumber: orCr.engineNumber || crCr.engineNumber || selectedRequest?.engineNumber || "",
      chassisNumber: orCr.chassisNumber || crCr.chassisNumber || selectedRequest?.chassisNumber || "",
      make: orCr.make || crCr.make || selectedRequest?.make || "",
      series: orCr.series || crCr.series || selectedRequest?.series || "",
      color: orCr.color || crCr.color || selectedRequest?.color || "",
      yearModel: orCr.yearModel || crCr.yearModel || selectedRequest?.yearModel || "",
    });
    doc.save(filename);
  };

  const handlePreviewSlip = async () => {
    if (!voucherCode) return;
    const { doc } = await generateDciCodeSlipPDF({
      requestId,
      voucherCode,
      voucherReferenceNo: voucherCode,
      dateCreated,
      ownerName: orCr.ownerName || crCr.ownerName || selectedRequest?.ownerName || "",
      plateNumber: orCr.plateNumber || crCr.plateNumber || selectedRequest?.plateNumber || "",
      mvFileNumber: orCr.mvFileNumber || crCr.mvFileNumber || selectedRequest?.mvFileNumber || "",
      engineNumber: orCr.engineNumber || crCr.engineNumber || selectedRequest?.engineNumber || "",
      chassisNumber: orCr.chassisNumber || crCr.chassisNumber || selectedRequest?.chassisNumber || "",
      make: orCr.make || crCr.make || selectedRequest?.make || "",
      series: orCr.series || crCr.series || selectedRequest?.series || "",
      color: orCr.color || crCr.color || selectedRequest?.color || "",
      yearModel: orCr.yearModel || crCr.yearModel || selectedRequest?.yearModel || "",
    });
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownloadAllCertificates = async () => {
    const issuedRows = certificationQueue.filter((row) => row.certificateNo);
    if (issuedRows.length === 0) {
      alert("No issued certificates to download.");
      return;
    }
    for (const row of issuedRows) {
      const plate = row.plateNumber || row.orCr?.plateNumber || "";
      const { doc, filename } = await generateClearanceCertificatePDF({
        requestId: row.requestId,
        certificateNo: row.certificateNo,
        clearanceReferenceNo: row.certificateNo,
        plateNumber: plate,
        voucherCode: row.voucherCode,
        voucherReferenceNo: row.voucherCode,
        dateCreated: row.dateCreated,
        status: row.status,
        clearanceStatus: "CERTIFICATE_ISSUED",
      });
      doc.save(filename);
    }
  };

  const canNext = () => {
    if (isAgent) {
      if (step === 1) {
        if (vehicleOption) return Boolean(transactionType);
        return Boolean(vehicleOption);
      }
      if (step === 2) {
        return certificationQueue.length > 0 && certificationQueue.length <= availableCreditsCount;
      }
      if (step === 3) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.some((row) => row.verifyOrCrDone) &&
          certificationQueue.every((row) => row.verifyOrCrDone || row.verifyOrCrError)
        );
      }
      if (step === 4) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every((row) => row.hpgStatus === HPG_STATUS.APPROVED)
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
        orCr.mvFileNumber &&
        orCr.mvFileNumber.length === 15 &&
        orCr.plateNumber !== "Extracting...";
      const crOk =
        crCr.plateNumber &&
        crCr.ownerName &&
        crCr.mvFileNumber &&
        crCr.mvFileNumber.length === 15 &&
        crCr.plateNumber !== "Extracting...";
      return Boolean(orOk && crOk && !vehicleMismatch);
    }
    if (step === 3) return paymentDone;
    if (step === 4) return verifyOrCrDone;
    if (step === 5) return voucherAssigned;
    if (step === 6) return hpgVerified;
    return false;
  };

  const nextStep = () => {
    if (isAgent && step === 2) {
      certificationQueue.forEach((row) => persistRow(row));
    }
    if (isAgent && step === 3) {
      handleAgentAutoAssignCodes();
      return;
    }
    const maxStep = isAgent ? 5 : 7;
    if (step < maxStep && canNext()) setStep((prev) => prev + 1);
  };

  const handleNextClick = () => {
    if (step === 2) {
      setShowConfirmUploadModal(true);
    } else {
      nextStep();
    }
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
              {role === "agent_fixer" ? "Agent" : "Citizen"}
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
                      className={`text-[10px] sm:text-xs mt-2 truncate ${isActive ? "text-white font-medium" : "text-white/60"
                        }`}
                    >
                      {label}
                    </p>
                    {index < flowSteps.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${isCompleted ? "bg-white" : "bg-white/30"
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
          {isAgent && step === 2 && (
            <div>
              {vehicleOption === "existing" ? (
                <>
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
                      hideEngineAndChassis={true}
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

              <Card className="mt-4 p-4 border border-blue-100 bg-blue-50/40">
                                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Bulk Queue Staging</p>
                      <p className="text-xs text-gray-600">Upload OR/CR then add each transaction to queue.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Credits Remaining: <span className="font-bold text-[#0059b5] text-base">{Math.max(0, availableCreditsCount - certificationQueue.length)}</span>
                      </div>
                      <Button
                        onClick={handleAddToQueue}
                        disabled={
                          (availableCreditsCount - certificationQueue.length <= 0) ||
                          (vehicleOption === "new"
                            ? !orCr.engineNumber || !orCr.chassisNumber
                            : !orNumber ||
                              !crNumber ||
                              !orCr.mvFileNumber ||
                              !crCr.mvFileNumber ||
                              vehicleMismatch)
                        }
                      >
                        Add To Queue
                      </Button>
                    </div>
                  </div>

                  {(availableCreditsCount - certificationQueue.length <= 0) && (
                    <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200 flex items-start gap-2">
                      <span className="font-bold whitespace-nowrap">Notice:</span>
                      <span>You don't have enough credits to add another transaction to the queue. Please finish this request then purchase more credits.</span>
                    </div>
                  )}

                  {certificationQueue.length === 0 ? (
                    <p className="text-sm text-gray-500">No staged entries yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-100 text-left">
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {vehicleOption === "new" ? "Engine No." : "Plate"}
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {vehicleOption === "new" ? "Chassis No." : "Owner"}
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr key={row.requestId} className="border-b border-blue-50">
                            <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            <td className="py-2 text-gray-700">
                              {vehicleOption === "new" ? row.orCr?.engineNumber || "-" : row.plateNumber || "-"}
                            </td>
                            <td className="py-2 text-gray-700">
                              {vehicleOption === "new" ? row.orCr?.chassisNumber || "-" : maskOwnerName(row.orCr?.ownerName || row.crCr?.ownerName || "-")}
                            </td>
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

          {isAgent && step === 3 && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Verify OR/CR (Bulk)</h3>
                </div>
                <Button
                  onClick={handleVerifyAll}
                  disabled={isVerifyingAll || certificationQueue.every(row => row.verifyOrCrDone || row.verifyOrCrError)}
                  className="flex items-center gap-2"
                >
                  {isVerifyingAll ? <Spinner size="xs" /> : null}
                  Verify All
                </Button>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 w-16"></th>
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {vehicleOption === "new" ? "Engine No." : "Plate"}
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationQueue.map((row) => (
                      <tr key={row.requestId} className="border-b border-gray-100">
                        <td className="py-2 w-16">
                                  <div className="flex items-center gap-1">
                                    <CertificateActionButtons row={row} />
                                  </div>
                                </td>
                              <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                        <td className="py-2 text-gray-700">
                          {vehicleOption === "new" ? row.orCr?.engineNumber || "-" : row.plateNumber || "-"}
                        </td>
                        <td className="py-2">
                          {isVerifyingAll && !row.verifyOrCrDone && !row.verifyOrCrError ? (
                            <div className="flex items-center gap-1">
                              <Spinner size="xs" />
                              <span className="text-blue-600 font-semibold text-xs animate-pulse">VERIFYING...</span>
                            </div>
                          ) : row.verifyOrCrDone ? (
                            <span className="text-green-600 font-semibold text-xs">✓ VERIFIED</span>
                          ) : row.verifyOrCrError ? (
                            <span className="text-red-600 font-semibold text-xs">✗ FAILED</span>
                          ) : (
                            <span className="text-amber-600 font-semibold text-xs">PENDING</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showAllVerifiedCards && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0059b5]">LTO Verification Results Review Panel</span>
                      <span className="text-xs text-gray-500">Scroll down to review all cards</span>
                    </div>
                    <div className="flex items-center gap-1 animate-bounce text-[#0059b5] font-bold text-sm">
                      <span>↓</span>
                    </div>
                  </div>

                  <div className="max-h-[480px] overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4 shadow-inner relative">
                    {certificationQueue.map((row) => {
                      const vSpec = row.orCr || emptyVehicle;
                      return (
                        <div key={row.requestId} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 relative">
                          {row.verifyOrCrDone ? (
                            <>
                              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                                <CheckCircle size={20} className="text-green-500" />
                                <h4 className="font-bold text-gray-900">Request {row.requestId}: LTO Verification Successful</h4>
                                {row.vehicleOption !== "new" && (
                                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded ml-auto">PLATE: {row.plateNumber || "-"}</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Make</p>
                                  <p className="font-medium text-gray-900">{vSpec.make || "TOYOTA"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Series</p>
                                  <p className="font-medium text-gray-900">{vSpec.series || "VIOS"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Year Model</p>
                                  <p className="font-medium text-gray-900">{vSpec.yearModel || "2020"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Color</p>
                                  <p className="font-medium text-gray-900">{vSpec.color || "WHITE"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Owner</p>
                                  <p className="font-medium text-gray-900">{maskOwnerName(vSpec.ownerName || "JUAN DELA CRUZ")}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Classification</p>
                                  <p className="font-medium text-gray-900">{vSpec.classification || "PRIVATE"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Vehicle Type</p>
                                  <p className="font-medium text-gray-900">{vSpec.vehicleType || "CAR"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Engine Number</p>
                                  <p className="font-medium text-gray-900">{vSpec.engineNumber || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase mb-0.5">Chassis No.</p>
                                  <p className="font-medium text-gray-900">{vSpec.chassisNumber || "-"}</p>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                <Button 
                                  onClick={() => {
                                    setVerifyingAgentRowId(row.requestId);
                                    setOrCr(vSpec);
                                    setCrCr(row.crCr || emptyVehicle);
                                    setShowMismatchModal(true);
                                  }} 
                                  variant="secondary"
                                >
                                  Report Data Mismatch
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-start gap-3">
                              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                              <div className="w-full">
                                <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                                  <h4 className="text-sm font-bold text-red-900">Request {row.requestId}: Verification Failed</h4>
                                  {row.vehicleOption !== "new" && (
                                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">PLATE: {row.plateNumber || "-"}</span>
                                  )}
                                </div>
                                <p className="text-sm text-red-700 mb-3">{row.verifyOrCrError}</p>
                                <div className="flex justify-end">
                                  <Button 
                                    variant="danger" 
                                    size="sm" 
                                    onClick={() => {
                                      setVerifyingAgentRowId(row.requestId);
                                      setOrCr(vSpec);
                                      setCrCr(row.crCr || emptyVehicle);
                                      setShowTicketAttachmentModal(true);
                                    }}
                                  >
                                    <FileText size={16} /> Open Ticket
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}



          {isAgent && step === 4 && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">HPG Portal (Bulk)</h3>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setHpgForAll(HPG_STATUS.APPROVED)}>
                    <CheckCircle size={16} className="mr-1 inline" /> Mark All Verified by HPG
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 w-16"></th>
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction Code</th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">HPG Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationQueue.map((row) => (
                      <tr key={row.requestId} className="border-b border-gray-100">
                        <td className="py-2 w-16">
                                  <div className="flex items-center gap-1">
                                    <CertificateActionButtons row={row} />
                                  </div>
                                </td>
                              <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                        <td className="py-2 font-mono font-semibold text-gray-700">{row.voucherCode || "-"}</td>
                        <td className="py-2 text-gray-700">{row.hpgStatus === HPG_STATUS.APPROVED ? "VERIFIED" : (row.hpgStatus || HPG_STATUS.PENDING)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {isAgent && step === 5 && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">Certificate Issuance (Bulk)</h3>
                </div>
                <div className="flex gap-2">
                  {certificationQueue.some(row => !row.certificateNo) && !isIssuingBulk && (
                    <Button
                      onClick={handleAgentMockDciValidation}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <CheckCircle size={16} /> Run DCI Validation
                    </Button>
                  )}
                  {!isIssuingBulk && (
                    <Button
                      onClick={handleDownloadAllCertificates}
                      className="flex items-center gap-2"
                      size="sm"
                      variant="outline"
                      disabled={certificationQueue.some(row => !row.certificateNo)}
                    >
                      <Download size={16} /> Download All
                    </Button>
                  )}
                </div>
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
                          <th className="pb-2 w-16"></th>
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request</th>
                          {vehicleOption === "new" ? (
                            <>
                              <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Engine No.</th>
                              <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Chassis No.</th>
                            </>
                          ) : (
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                          )}
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">MVCC / MEC No.</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificate</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr key={row.requestId} className="border-b border-gray-100">
                            <td className="py-2 w-16">
                                  <div className="flex items-center gap-1">
                                    <CertificateActionButtons row={row} />
                                  </div>
                                </td>
                              <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            {vehicleOption === "new" ? (
                              <>
                                <td className="py-2 text-gray-700">{row.orCr?.engineNumber || "-"}</td>
                                <td className="py-2 text-gray-700">{row.orCr?.chassisNumber || "-"}</td>
                              </>
                            ) : (
                              <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                            )}
                            <td className="py-2 font-mono text-xs text-gray-700">{row.mvcData?.mvcNo || "-"}</td>
                            <td className="py-2 font-mono text-xs font-semibold text-gray-900">{row.certificateNo || "-"}</td>
                            <td className="py-2 text-gray-700">{row.certificateNo ? "CERTIFICATE_ISSUED" : "READY"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {certificationQueue.every((row) => row.certificateNo) && (
                    <div className="flex justify-end">
                      <Button onClick={finishBulk}>
                        <CheckCircle size={16} /> Complete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {step === 1 && (
            <Card className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Vehicle Option</h3>
                <p className="text-gray-600">Please select if you are requesting a clearance certificate for a new or an existing vehicle.</p>
              </div>
              <div className="max-w-md mx-auto">
                <div
                  onClick={() => {
                    if (vehicleOption !== "existing") {
                      setVehicleOption("existing");
                      setTransactionType("");
                    }
                  }}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${vehicleOption === "existing"
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
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${transactionType === type
                            ? "border-[#0059b5] bg-blue-50 text-[#0059b5]"
                            : "border-gray-200 hover:border-[#0059b5] hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${transactionType === type ? "border-[#0059b5]" : "border-gray-300"
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
                      "Registration of CKD (Completely Knocked Down) Imported Vehicle",
                      "Omission of New Vehicle"
                    ].map(type => (
                      <div
                        key={type}
                        onClick={() => setTransactionType(type)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${transactionType === type
                            ? "border-[#0059b5] bg-blue-50 text-[#0059b5]"
                            : "border-gray-200 hover:border-[#0059b5] hover:bg-gray-50 text-gray-700"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${transactionType === type ? "border-[#0059b5]" : "border-gray-300"
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
                      <p className="font-medium text-gray-900">{maskOwnerName(orCr.ownerName || "JUAN DELA CRUZ")}</p>
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
                <h3 className="text-base font-bold text-gray-900">Issue Code</h3>
              </div>
              {issuingVoucher ? (
                <div className="flex flex-col items-center justify-center py-5">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">Generating code...</p>
                </div>
              ) : voucherAssigned ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 text-lg">Transaction Code Issued</p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">{voucherCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Plate: {orCr.plateNumber}</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={handlePreviewSlip} variant="outline">
                      <Eye size={16} /> Preview Slip
                    </Button>
                    <Button onClick={handleDownloadSlip} variant="outline">
                      <Download size={16} /> Download Slip
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">Code issues automatically after payment.</p>
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
                  Please present your transaction to HPG/LTO.
                </p>
                <p className="text-xs text-gray-600 mt-2 pb-2">
                  Transaction Code: <span className="font-mono font-semibold">{voucherCode}</span>
                </p>
                <div className="mt-2 flex justify-start gap-3 border-t border-amber-200 pt-3">
                  <Button onClick={handlePreviewSlip} variant="outline" size="sm">
                    <Eye size={14} /> Preview Slip
                  </Button>
                  <Button onClick={handleDownloadSlip} variant="outline" size="sm">
                    <Download size={14} /> Download Slip
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleCitizenHpgVerify}>
                  <CheckCircle size={16} /> Has been verified by HPG
                </Button>
              </div>
            </Card>
          )}

          {!isAgent && step === 7 && (
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
                  <p className="text-xs text-blue-700 mt-1 font-mono font-semibold">MVCC/MEC No: {mvcData?.mvcNo || "—"}</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={handlePreview} variant="outline">
                      <Eye size={16} /> Preview
                    </Button>
                    <Button onClick={handleDownload} variant="outline">
                      <Download size={16} /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Please wait for DCI Validation to verify the documents and issue the certificate.
                  </p>
                  <Button onClick={handleCitizenDciValidation} className="mx-auto flex items-center gap-2">
                    <CheckCircle size={16} /> Run DCI Validation
                  </Button>
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
              <div className="flex items-center gap-4">
                {step === 2 && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">Double check details before proceeding</span>
                  </div>
                )}
                <Button onClick={handleNextClick} disabled={!canNext()}>
                  Next <ChevronRight size={16} />
                </Button>
              </div>
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
                <Paperclip size={20} className="text-[#0059b5]" />
                Supporting Documents
              </h3>

              <button
                onClick={() => {
                  setTicketAttachments([]);
                  setShowTicketAttachmentModal(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Upload Supporting Documents (e.g., OR/CR, Plate Certification, Actual Plate Photo, etc.)
                  </label>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#0059b5] transition-colors relative">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setTicketAttachments((prev) => [...prev, ...files]);
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Upload size={32} className="text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">
                        Drag and drop your files here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        Select multiple files to upload
                      </p>
                    </div>
                  </div>
                </div>

                {ticketAttachments.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Selected Files ({ticketAttachments.length})
                    </p>
                    {ticketAttachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-700 truncate max-w-md">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTicketAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Supported formats: JPG, PNG, PDF, DOC (Max 5MB per file)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setTicketAttachments([]);
                  setShowTicketAttachmentModal(false);
                }}
                disabled={isSubmittingTicket}
              >
                Cancel
              </Button>

              <Button
                className="flex items-center gap-2"
                onClick={() => handleSubmitTicket()}
                disabled={isSubmittingTicket || ticketAttachments.length === 0}
              >
                Create Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-gray-600 mb-6">
              Please confirm that all uploaded data is accurate and final for this transaction.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowConfirmUploadModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmUploadModal(false);
                  nextStep();
                }}
              >
                Proceed
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




