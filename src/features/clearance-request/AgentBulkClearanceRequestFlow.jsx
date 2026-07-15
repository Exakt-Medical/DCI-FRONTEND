import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Modal } from "../../components/Modal";
import { Spinner } from "../../components/Spinner";
import { CheckCircle, AlertTriangle, Download, Plus, ChevronRight, ChevronLeft, Trash2, Shield, Search, Car, X, FileText } from "lucide-react";
import { VehicleDocumentUploadCard, VehicleFields } from "./components/FlowFormCards";
import { UploadDocumentGuidelineModal } from "./components/UploadDocumentGuidelineModal";
import { useAlert } from "../../hooks/useAlert";
import { emptyVehicle, OR_EXPECTED_FIELDS, mergeVehicleFields } from "./utils/clearanceRequestUtils";
import { useOrCrOcr } from "./hooks/useOrCrOcr";
import { useAuth } from "../../context/AuthContext";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import { formatOcrHint, OCR_STATUS } from "../../hooks/useOcrForm";
import { DataMismatchModal } from "./components/DataMismatchModal";
import { OrCrMismatchModal } from "./components/OrCrMismatchModal";
import { ticketService } from "../../services/ticketService";
import { Button } from "../../components/Button";
import { useRequest } from "../../context/RequestContext";
import { fetchMyRequests } from "../../services/certificateRequestService";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";
import { voucherInventoryService } from "../../services/voucherInventoryService";
import { verificationService } from "../../services/verificationService";
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { OcrProgressModal } from "./components/OcrProgressModal";

function generateRefNumber() {
  const pad = (n) => String(n).padStart(4, "0");
  const now = new Date();
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = pad(Math.floor(Math.random() * 9000) + 1000);
  return `REF-${date}-${rand}`;
}

const BULK_STEPS = [
  "Add to Queue",
  "Verify Vehicles",
  "HPG Verify",
  "DCI Clearance",
  "Issue Certificate"
];

export const AgentBulkClearanceRequestFlow = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { error: showError, success: showSuccessAlert } = useAlert();
  const { handleRequestSave } = useRequest();
  
  const [step, setStep] = useState(1);
  const [queue, setQueue] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [hasShownGuideline, setHasShownGuideline] = useState(false);
  const [guidelineRevisitedHint, setGuidelineRevisitedHint] = useState(false);
  const [extractedFields, setExtractedFields] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orCrMismatches, setOrCrMismatches] = useState([]);
  const [isOrCrMismatchModalOpen, setIsOrCrMismatchModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    if (step === 1 && !hasShownGuideline) {
      setShowGuidelineModal(true);
      setHasShownGuideline(true);
      setGuidelineRevisitedHint(true);
    }
  }, [step, hasShownGuideline]);

  // Fetch available vouchers on mount
  useEffect(() => {
    const fetchVoucherCount = async () => {
      try {
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        const userId = localStorage.getItem("userId") || profile.id;
        if (userId) {
          const inventory = await voucherInventoryService.fetchAgentInventory(userId, 1, 1000);
          const available = (inventory.content || []).filter(v => v.inventoryStatus === "AVAILABLE" || v.status === "AVAILABLE");
          setAvailableVouchers(available);
        }
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      }
    };
    fetchVoucherCount();
  }, []);

  // Poll for HPG, DCI, and Certificate status
  useEffect(() => {
    let interval;
    if (step >= 3 && step <= 5 && queue.length > 0) {
      interval = setInterval(async () => {
        try {
          const requests = await fetchMyRequests();
          if (!requests || requests.length === 0) return;

          setQueue(prevQueue => {
            let hasChanges = false;
            const updated = prevQueue.map(item => {
              if (!item.backendId) return item;
              const remoteItem = requests.find(r => String(r.id) === String(item.backendId));
              if (remoteItem && remoteItem.status !== item.status) {
                hasChanges = true;
                
                let newStatus = remoteItem.status;
                let newCertNo = remoteItem.certificateNo || item.certificateNo;
                
                // Auto-advance DCI validated status to CERTIFICATE_ISSUED for bulk flow
                if (newStatus === "MVC_MEC_VALIDATED") {
                  newStatus = "CERTIFICATE_ISSUED";
                  // Update backend silently
                  handleRequestSave({
                    id: remoteItem.id,
                    status: "CERTIFICATE_ISSUED",
                    clearanceStatus: "CERTIFICATE_ISSUED",
                    certificateNo: ""
                  }).catch(console.error);
                }

                return {
                  ...item,
                  status: newStatus,
                  certificateNo: newCertNo,
                };
              }
              return item;
            });
            return hasChanges ? updated : prevQueue;
          });
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, queue]);
  
  // Current Form State
  const [transactionType, setTransactionType] = useState("Transfer of Ownership");
  const [vehicleOption, setVehicleOption] = useState("EXISTING");
  const [orCr, setOrCr] = useState({ ...emptyVehicle });
  const [crCr, setCrCr] = useState({ ...emptyVehicle });
  
  const [orPreview, setOrPreview] = useState(null);
  const [crPreview, setCrPreview] = useState(null);

  const [pendingNavigationPath, setPendingNavigationPath] = useState(null);
  const [showNavigationWarningModal, setShowNavigationWarningModal] = useState(false);

  const [isDataMismatchModalOpen, setIsDataMismatchModalOpen] = useState(false);
  const [selectedMismatchItem, setSelectedMismatchItem] = useState(null);

  useEffect(() => {
    const shouldBlock = queue.length > 0 && step < 3;

    const handleBeforeUnload = (e) => {
      if (window.bypassBeforeUnload) return;
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleLinkClick = (e) => {
      if (shouldBlock) {
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
  }, [queue.length, step]);

  const [validationErrors, setValidationErrors] = useState({});

  const {
    ocrUploadState,
    setOcrState,
    handleOrUpload,
    handleCrUpload,
  } = useOrCrOcr({
    orCr, crCr,
    setOrCr, setCrCr,
    setOrPreview, setCrPreview,
    setValidationErrors,
    onOrExtracted: (parsedVehicle) => {
      setCrCr((prev) => mergeVehicleFields(prev, parsedVehicle));
      const extracted = {};
      Object.keys(parsedVehicle).forEach((k) => {
        if (parsedVehicle[k]) extracted[k] = true;
      });
      setExtractedFields((prev) => ({ ...prev, ...extracted }));
    },
    onCrExtracted: (parsedVehicle) => {
      setOrCr((prev) => mergeVehicleFields(prev, parsedVehicle));
      const extracted = {};
      Object.keys(parsedVehicle).forEach((k) => {
        if (parsedVehicle[k]) extracted[k] = true;
      });
      setExtractedFields((prev) => ({ ...prev, ...extracted }));

      const newMismatches = [];
      const fieldsToCheck = [
        { field: "plateNumber", label: "Plate Number" },
        { field: "mvFileNumber", label: "MV File Number" },
        { field: "color", label: "Color" },
        { field: "yearModel", label: "Year Model" },
        { field: "ownerName", label: "Owner's Name" },
        { field: "classification", label: "Classification" },
      ];
      fieldsToCheck.forEach(({ field, label }) => {
        const orVal = orCr[field];
        const crVal = parsedVehicle[field];
        if (orVal && crVal && orVal.toUpperCase() !== crVal.toUpperCase()) {
          newMismatches.push({
            field,
            label,
            orValue: orVal.toUpperCase(),
            crValue: crVal.toUpperCase(),
          });
        }
      });
      if (newMismatches.length > 0) {
        setOrCrMismatches(newMismatches);
        setIsOrCrMismatchModalOpen(true);
      }
    }
  });

  // Backend integration states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    const matchTicketsToQueue = async () => {
      if (queue.length === 0) return;
      try {
        const tickets = await ticketService.getAll();
        setQueue(prevQueue => {
          let hasChanges = false;
          const updated = prevQueue.map(item => {
            const plate = item.crCr?.plateNumber || item.orCr?.plateNumber;
            const matched = tickets.find(t => 
              plate && String(t.plateNo || t.vehicleInfo?.plateNo).toUpperCase() === String(plate).toUpperCase()
            );
            if (matched && (!item.submittedTicket || item.submittedTicket.id !== matched.id || item.submittedTicket.status !== matched.status)) {
              hasChanges = true;
              return { ...item, submittedTicket: matched };
            }
            return item;
          });
          return hasChanges ? updated : prevQueue;
        });
      } catch (e) {
        console.error("Failed to match tickets to queue", e);
      }
    };
    matchTicketsToQueue();
  }, [queue.length]);

  const getTicketPrefilledData = () => {
    const vehicleInfo = {
      plateNo: "",
      make: "",
      model: "",
      mvFileNo: "",
      engineNo: "",
      chassisNo: "",
      color: "",
      denomination: "",
      yearModel: "",
      classification: "",
    };
    if (selectedMismatchItem) {
      const item = selectedMismatchItem;
      vehicleInfo.plateNo = item.crCr?.plateNumber || item.orCr?.plateNumber || "";
      vehicleInfo.make = item.crCr?.makeBrand || item.orCr?.makeBrand || "";
      vehicleInfo.model = item.crCr?.series || item.orCr?.series || "";
      vehicleInfo.mvFileNo = item.crCr?.mvFileNumber || item.orCr?.mvFileNumber || "";
      vehicleInfo.engineNo = item.crCr?.engineNumber || item.orCr?.engineNumber || "";
      vehicleInfo.chassisNo = item.crCr?.chassisNumber || item.orCr?.chassisNumber || "";
      vehicleInfo.color = item.crCr?.color || item.orCr?.color || "";
      vehicleInfo.denomination = item.crCr?.denomination || item.orCr?.denomination || "";
      vehicleInfo.yearModel = item.crCr?.yearModel || item.orCr?.yearModel || "";
      vehicleInfo.classification = item.crCr?.classification || item.orCr?.classification || "";
    }
    return {
      concernType: "vehicle",
      vehicleSubType: "dataMismatch",
      subject: `Issue in Bulk Clearance Request`,
      description: `Encountered an issue during Step 2 (Verify Vehicles) of the Bulk Clearance Request Flow.`,
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
      address: null,
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
      vehicleColor: formData.vehicleInfo?.color ?? null,
      vehicleTypeDenomination: formData.vehicleInfo?.denomination ?? null,
      yearModel: formData.vehicleInfo?.yearModel ?? null,
      classification: formData.vehicleInfo?.classification ?? null,
    });
    if (created) {
      showSuccessAlert("Ticket Submitted", `Your support ticket has been submitted. Reference: ${referenceNumber}`);
      setQueue(prev => prev.map(item => 
        item.id === selectedMismatchItem.id ? { ...item, submittedTicket: created } : item
      ));
      setIsTicketModalOpen(false);
    }
    return created;
  };

  const handleAddToQueue = () => {
    // Basic validation
    if (!orCr.plateNumber && !crCr.plateNumber) {
      showError("Validation Failed", "Please enter at least a Plate Number in OR or CR.");
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      transactionType,
      vehicleOption,
      orCr: { ...orCr },
      crCr: { ...crCr },
      status: "QUEUED",
      plateNumber: orCr.plateNumber || crCr.plateNumber || "Unknown",
    };

    setQueue([...queue, newItem]);
    
    // Reset form
    setOrCr({ ...emptyVehicle });
    setCrCr({ ...emptyVehicle });
    setOrPreview(null);
    setCrPreview(null);
    setValidationErrors({});
    setExtractedFields({});
    showSuccessAlert("Added", "Vehicle added to bulk queue.");
  };

  const handleRemoveFromQueue = (id) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (queue.length === 0) {
        showError("Queue Empty", "Please add at least one vehicle to the queue.");
        return;
      }
      if (queue.length > availableVouchers.length) {
        showError("Insufficient Credits", `You have ${availableVouchers.length} credits but your queue has ${queue.length} vehicles.`);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (queue.some(item => item.status === "QUEUED" || item.status === "VERIFYING")) {
        showError("Verification Required", "Please verify all vehicles before proceeding.");
        return;
      }
      const successfulItems = queue.filter(item => item.status === "VERIFIED");
      if (successfulItems.length === 0) {
        showError("No Verified Vehicles", "There are no successfully verified vehicles to proceed with.");
        return;
      }
      setConfirmAction("proceed");
      setShowConfirmModal(true);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleConfirmNext = () => {
    setShowConfirmModal(false);
    const successfulItems = queue.filter(item => item.status === "VERIFIED");
    setQueue(successfulItems);
    setStep(3);
  };

  const handleOrCrMismatchSubmit = (resolvedValues) => {
    setOrCr((prev) => ({ ...prev, ...resolvedValues }));
    setCrCr((prev) => ({ ...prev, ...resolvedValues }));
    setIsOrCrMismatchModalOpen(false);
  };

  const handleVerifyQueue = async () => {
    setIsVerifying(true);
    
    if (queue.length > availableVouchers.length) {
      showError("Insufficient Credits", `You have ${availableVouchers.length} credits but are trying to process ${queue.length} vehicles.`);
      setIsVerifying(false);
      return;
    }

    try {
      const vouchersToUse = [...availableVouchers];
      let hasFailures = false;

      const updatedQueue = [];

      for (const item of queue) {
        if (item.status !== "QUEUED") {
          updatedQueue.push(item);
          continue;
        }
        
        try {
          const payload = {
            mvFileNumber: (item.crCr.mvFileNumber || item.orCr.mvFileNumber || "").trim().toUpperCase(),
            plateNumber: (item.crCr.plateNumber || item.orCr.plateNumber || "").trim().toUpperCase(),
            engineNumber: (item.crCr.engineNumber || item.orCr.engineNumber || "").trim().toUpperCase(),
            chassisNumber: (item.crCr.chassisNumber || item.orCr.chassisNumber || "").trim().toUpperCase(),
          };
          
          const verifyRes = await verificationService.verify(payload);
          const vvsData = verifyRes?.data || {};

          if (vvsData.verificationStatus !== "VERIFIED") {
            throw new Error(vvsData.failureReason || "No matching verified vehicle record found.");
          }

          const ownerName =
            [vvsData.ownerFirstName, vvsData.ownerMiddleName, vvsData.ownerLastName]
              .filter(Boolean)
              .join(" ") ||
            vvsData.ownerName ||
            "Unknown Owner";

          const assignedVoucher = vouchersToUse.shift();
          const assignedVoucherCode = assignedVoucher.voucherCode;
          const assignedVoucherId = assignedVoucher.voucherId || assignedVoucher.id;

          const requestRecord = {
            currentStep: 3,
            status: "DOCUMENTS_VERIFIED",
            verificationId: vvsData.verificationId || "",
            vvsOwnerName: ownerName,
            vvsVehicleDetails: vvsData,
            voucherCode: assignedVoucherCode,
            voucherId: assignedVoucherId,
            voucherStatus: "VOUCHER_ISSUED",
            plateNumber: item.plateNumber,
            orCr: item.orCr,
            crCr: item.crCr,
            dateCreated: new Date().toISOString().split("T")[0],
            role,
            vehicleOption: item.vehicleOption,
            transactionType: item.transactionType,
          };

          const savedReq = await handleRequestSave(requestRecord);
          
          updatedQueue.push({
            ...item,
            status: "VERIFIED",
            backendId: savedReq?.id || null,
            voucherCode: assignedVoucherCode,
            vvsData,
          });

          // 50ms delay to ensure unique timestamp-based reference IDs on the backend
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          hasFailures = true;
          updatedQueue.push({
            ...item,
            status: "FAILED",
            error: error.message || "Verification failed.",
          });
        }
      }

      setQueue(updatedQueue);
      
      if (hasFailures) {
        showError("Verification Complete with Errors", "Some vehicles failed verification. Please review them.");
      } else {
        showSuccessAlert("Verification Complete", "All vehicles in queue have been verified.");
      }
    } catch (err) {
      showError("Verification Process Error", "An error occurred during verification.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDataMismatchSubmit = async ({ crAttachment, vvsDetails, vvsOwnerDetails }) => {
    const referenceNumber = generateRefNumber();
    const userName = [localStorage.getItem("firstname"), localStorage.getItem("lastname")].filter(Boolean).join(" ");
    try {
      const created = await ticketService.create({
        referenceNumber,
        requestedBy: userName,
        type: "Data Mismatch",
        status: "PENDING",
        crAttachment,
        name: vvsOwnerDetails?.fullName ?? null,
        address: vvsOwnerDetails?.address ?? null,
        processedBy: null,
        dateRequested: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        escalated: "NO",
        roleBased: role?.toUpperCase() ?? null,
        plateNo: vvsDetails?.plate_number ?? null,
        mvFileNo: vvsDetails?.mv_file_number ?? null,
        make: vvsDetails?.make ?? null,
        series: vvsDetails?.series ?? null,
        engineNo: vvsDetails?.engine_number ?? null,
        chassisNo: vvsDetails?.chassis_number ?? null,
        vehicleColor: vvsDetails?.color ?? null,
        vehicleTypeDenomination: vvsDetails?.denomination ?? null,
        yearModel: vvsDetails?.year_model ?? null,
        classification: vvsDetails?.classification ?? null,
      });
      if (created) {
        showSuccessAlert("Ticket Submitted", `Data Mismatch ticket ${referenceNumber} has been created.`);
        setQueue(prev => prev.map(item => 
          item.id === selectedMismatchItem.id ? { ...item, submittedTicket: created } : item
        ));
        setIsDataMismatchModalOpen(false);
        setSelectedMismatchItem(null);
      }
    } catch {
      showError("Submission Failed", "There was an error creating your ticket.");
    }
  };

  const handleDownloadPDF = async (item) => {
    try {
      const { doc, filename } = await generateClearanceCertificatePDF({
        id: item.backendId || item.id,
        certificateNo: item.certificateNo || "",
        clearanceReferenceNo: item.certificateNo || "",
        plateNumber: item.plateNumber,
        voucherCode: item.voucherCode,
        voucherReferenceNo: item.voucherCode,
        dateCreated: new Date().toISOString().split("T")[0],
        status: item.status,
        clearanceStatus: "CERTIFICATE_ISSUED",
        orCr: item.orCr,
        crCr: item.crCr,
        mvcData: null,
        mecData: null,
      });
      doc.save(filename);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      showError("Error", "Failed to download certificate.");
    }
  };

  const handlePrevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  const updateOrCr = (field, value) => {
    setOrCr(prev => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
    setExtractedFields(prev => ({ ...prev, [field]: false }));
  };
  
  const updateCrCr = (field, value) => {
    setCrCr(prev => ({ ...prev, [field]: value ? value.toUpperCase() : "" }));
    setExtractedFields(prev => ({ ...prev, [field]: false }));
  };
  const isNextDisabled = () => {
    if (step === 1) return queue.length === 0;
    if (step === 2) return queue.some(item => item.status === "QUEUED");
    if (step === 3) return queue.some(item => item.status === "VERIFIED");
    if (step === 4) return queue.some(item => item.status === "HPG_VERIFIED");
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4">
      <Modal
        isOpen={showNavigationWarningModal}
        onClose={() => setShowNavigationWarningModal(false)}
        title="Warning: Leaving Bulk Request"
        size="md"
      >
        <div className="space-y-4 m-5">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle size={24} />
            <p className="font-medium text-lg">Are you sure you want to leave?</p>
          </div>
          <p className="text-gray-600">
            If you leave this page, your bulk batch will be discontinued, but any requests that is not done will be continued individually in your requests queue.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setShowNavigationWarningModal(false)}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowNavigationWarningModal(false);
                window.bypassBeforeUnload = true;
                if (pendingNavigationPath) {
                  navigate(pendingNavigationPath);
                } else {
                  navigate("/dci-access/requests");
                }
              }}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
            >
              Leave Page
            </button>
          </div>
        </div>
      </Modal>

      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">Bulk Clearance Request</span>
            <span className="text-xs text-gray-500 ml-auto">
              {role === "agent_fixer" ? "Agent / Fixer" : "Agent"}
            </span>
          </div>

          {/* Stepper */}
          <div className="px-6 py-4 bg-[#0059b5]">
            <div className="flex items-center justify-between gap-2">
              {BULK_STEPS.map((label, index) => {
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
                    {index < BULK_STEPS.length - 1 && (
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

        {/* Content */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {step === 1 && (
            <div className="space-y-8">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Option */}
                <div>
                  <label className="block text-sm font-bold text-[#001b3b] mb-2">Vehicle Option</label>
                  <select 
                    value={vehicleOption} 
                    onChange={(e) => setVehicleOption(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0059b5] focus:border-[#0059b5] transition-colors shadow-sm bg-white"
                  >
                    <option value="EXISTING">Existing Vehicle</option>
                  </select>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-bold text-[#001b3b] mb-2">Transaction Type</label>
                  <select 
                    value={transactionType} 
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0059b5] focus:border-[#0059b5] transition-colors shadow-sm bg-white"
                  >
                    <option value="Transfer of Ownership">Transfer of Ownership</option>
                    <option value="Change Color / Body Design">Change Color / Body Design</option>
                    <option value="Change Engine/Motor">Change Engine/Motor</option>
                    <option value="Change Chassis/VIN/Frame">Change Chassis/VIN/Frame</option>
                    <option value="Permit to Assemble">Permit to Assemble</option>
                    <option value="Record Check">Record Check</option>
                  </select>
                </div>
              </div>

              {/* Document Upload */}
              <div className="max-w-4xl mx-auto mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div>
                    <h3 className="text-base font-bold text-[#001b3b]">Upload Vehicle Documents</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload OR and CR documents to extract vehicle details for the queue.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowGuidelineModal(true);
                      setGuidelineRevisitedHint(false);
                    }}
                    className={`text-xs font-semibold underline px-3.5 py-2 rounded-lg border transition-all shrink-0 ${
                      guidelineRevisitedHint
                        ? "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                        : "bg-white border-gray-200 text-[#0059b5] hover:bg-gray-50"
                    }`}
                  >
                    Need Help? View Upload Guidelines
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <VehicleDocumentUploadCard
                    title="OR"
                    uploadLabel="Upload Official Receipt"
                    onFile={handleOrUpload}
                    preview={orPreview}
                    uploadHint={formatOcrHint(ocrUploadState.or)}
                    errors={validationErrors}
                    hideFields={true}
                  />
                  <VehicleDocumentUploadCard
                    title="CR"
                    uploadLabel="Upload Certificate of Registration"
                    onFile={handleCrUpload}
                    preview={crPreview}
                    uploadHint={formatOcrHint(ocrUploadState.cr)}
                    errors={validationErrors}
                    disabled={!orPreview || ocrUploadState.or.status === OCR_STATUS.EXTRACTING}
                    hideFields={true}
                  />
                </div>

                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <FileText size={18} className="text-[#0059b5]" />
                    <h3 className="text-base font-bold text-gray-900">Vehicle Details</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-4">
                    Please review and complete the vehicle details below.
                  </p>
                  <VehicleFields
                    values={crCr}
                    onChange={(field, value) => {
                      updateCrCr(field, value);
                      if (OR_EXPECTED_FIELDS.includes(field)) {
                        updateOrCr(field, value);
                      }
                    }}
                    fieldSet="cr"
                    errors={validationErrors}
                    isExtracting={ocrUploadState.cr.status === OCR_STATUS.EXTRACTING || ocrUploadState.or.status === OCR_STATUS.EXTRACTING}
                    successFields={extractedFields}
                  />
                </Card>
                
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={handleAddToQueue} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0059b5] hover:bg-[#004a96] text-white rounded-full font-medium transition-colors shadow-sm"
                  >
                    <Plus size={18} /> Add Vehicle to Queue
                  </button>
                </div>
              </div>

              {/* Queue List */}
              {queue.length > 0 && (
                <div className="max-w-4xl mx-auto mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-[#0059b5] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{queue.length}</span>
                    Vehicles in Queue
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {queue.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">#{index + 1} - {item.plateNumber}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{item.transactionType}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveFromQueue(item.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="max-w-4xl mx-auto py-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <Shield size={24} className="text-[#0059b5]" />
                <h2 className="text-2xl font-bold text-[#001b3b]">Verify Vehicles</h2>
              </div>

              {queue.some(item => item.status === "QUEUED") ? (
                <div className="text-center py-12">
                  {isVerifying ? (
                    <div className="flex flex-col items-center">
                      <Spinner size="lg" className="text-[#0059b5] mb-4" />
                      <p className="text-gray-500">Verifying {queue.length} vehicles against VVS and checking credits...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <AlertTriangle size={56} className="mx-auto text-amber-500" />
                      <p className="text-gray-600 text-lg max-w-md mx-auto">
                        You have <span className="font-bold">{availableVouchers.length}</span> available transaction credits.
                        You are about to verify <span className="font-bold">{queue.length}</span> vehicles.
                      </p>
                      <button 
                        onClick={() => {
                          setConfirmAction("verify");
                          setShowConfirmModal(true);
                        }} 
                        className="mt-4 px-8 py-3 bg-[#0059b5] text-white rounded-full font-bold hover:bg-[#004a96] transition-colors shadow-md"
                      >
                        Verify All Now
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3 mb-6">
                    <CheckCircle className="text-green-600 w-6 h-6 shrink-0" />
                    <p className="font-medium">All vehicles have been successfully verified against the LTO system.</p>
                  </div>
                  
                  {queue.map((item, index) => (
                    <div key={item.id} className={`bg-white border ${item.status === "FAILED" ? "border-red-300" : "border-gray-200"} rounded-xl p-6 shadow-sm`}>
                      <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${item.status === "FAILED" ? "border-red-200" : "border-gray-200"}`}>
                        <span className="bg-[#0059b5] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                        <h3 className="text-lg font-bold text-gray-900">{item.plateNumber}</h3>
                        {item.status === "VERIFIED" && (
                          <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle size={12} /> Verified
                          </span>
                        )}
                        {item.status === "FAILED" && (
                          <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <AlertTriangle size={12} /> Verification Failed
                          </span>
                        )}
                      </div>
                      
                      {item.status === "FAILED" && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          <strong>Error:</strong> {item.error}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Make</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.crCr.make || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Series</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.crCr.series || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Year Model</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">N/A</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Color</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">N/A</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Owner</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.vvsData?.ownerName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Classification</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.vvsData?.classification || "N/A"}</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Vehicle Type</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.vvsData?.denomination || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Engine Number</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.crCr.engineNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Chassis No.</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.crCr.chassisNumber || "N/A"}</p>
                        </div>
                        
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">MV File No.</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.orCr.mvFileNumber || item.crCr.mvFileNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Plate Number</p>
                          <p className="text-sm font-semibold text-gray-900 uppercase">{item.crCr.plateNumber || item.orCr.plateNumber || "N/A"}</p>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end gap-3">
                        {item.submittedTicket ? (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedMismatchItem(item);
                              setIsTicketModalOpen(true);
                            }}
                            className="text-primary-700 border-primary-300 hover:bg-primary-50 font-medium"
                          >
                            View Submitted Ticket
                          </Button>
                        ) : (
                          <>
                            {item.status === "FAILED" && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedMismatchItem(item);
                                  setIsTicketModalOpen(true);
                                }}
                                className="text-gray-500 hover:text-gray-700 font-medium border-gray-300"
                              >
                                Report an Issue
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setSelectedMismatchItem(item);
                                setIsDataMismatchModalOpen(true);
                              }}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-solid border-2"
                            >
                              Report Data Mismatch
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#001b3b]">HPG Verification</h2>
                  <p className="text-gray-500 text-sm mt-1">Waiting for HPG to verify these transactions.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                    <div>
                      <p className="font-bold text-gray-900">#{idx + 1} - {item.plateNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.transactionType}</p>
                      <p className="text-xs text-gray-400 mt-1">Transaction Code: <span className="font-mono font-semibold text-gray-700">{item.voucherCode || `TX-BULK-${item.id.slice(-6)}`}</span></p>
                    </div>
                    <div>
                      {item.status === "HPG_VERIFIED" || item.status === "CERTIFICATE_ISSUED" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle size={12} /> HPG Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-2">
                          <Spinner size="sm" /> Waiting for HPG
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#001b3b]">DCI Clearance</h2>
                  <p className="text-gray-500 text-sm mt-1">Waiting for DCI portal to clear these transactions.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                    <div>
                      <p className="font-bold text-gray-900">#{idx + 1} - {item.plateNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.transactionType}</p>
                      <p className="text-xs text-gray-400 mt-1">Transaction Code: <span className="font-mono font-semibold text-gray-700">{item.voucherCode || `TX-BULK-${item.id.slice(-6)}`}</span></p>
                    </div>
                    <div>
                      {item.status === "CERTIFICATE_ISSUED" ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle size={12} /> DCI Cleared
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-2">
                          <Spinner size="sm" /> Waiting for DCI
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="max-w-3xl mx-auto text-center py-8">
              <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-[#001b3b] mb-2">Issue Certificates</h2>
              <p className="text-gray-500 text-sm mb-8">
                Transactions that have been cleared are ready for certificate download.
              </p>
              
              <div className="space-y-4 text-left">
                {queue.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-5 border border-gray-200 rounded-xl shadow-sm bg-white hover:border-[#0059b5] transition-colors group">
                    <div>
                      <p className="font-bold text-lg text-gray-900 group-hover:text-[#0059b5] transition-colors">{item.plateNumber}</p>
                      <p className="text-sm text-gray-500 mt-1">Ref: {item.voucherCode || `REF-BULK-${item.id.slice(-4)}`}</p>
                    </div>
                    <div>
                      {item.status === "CERTIFICATE_ISSUED" ? (
                        <button 
                          onClick={() => handleDownloadPDF(item)}
                          className="flex items-center gap-2 px-4 py-2 border border-[#0059b5] text-[#0059b5] hover:bg-[#0059b5] hover:text-white rounded-full text-sm font-medium transition-colors"
                        >
                          <Download size={16} /> Download
                        </button>
                      ) : (
                        <span className="text-sm text-amber-600 font-medium px-4 py-2">Pending Clearance</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="mt-12 flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                if (step > 1) {
                  handlePrevStep();
                } else {
                  if (queue.length > 0) {
                    setShowNavigationWarningModal(true);
                  } else {
                    navigate("/dci-access/requests");
                  }
                }
              }}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              {step > 1 ? (
                <>
                  <ChevronLeft className="w-4 h-4" /> Back
                </>
              ) : (
                <>
                  <X className="w-4 h-4" /> Cancel
                </>
              )}
            </button>
            
            <div className="flex items-center gap-3">
              {(step === 1 || step === 2) && (
                <span className="text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                  Credits: <strong className={availableVouchers.length > 0 ? "text-green-600" : "text-red-600"}>{availableVouchers.length}</strong>
                </span>
              )}
              <button
                onClick={() => {
                  if (step === 5) {
                    navigate("/dci-access/requests");
                  } else {
                    handleNextStep();
                  }
                }}
                disabled={isNextDisabled()}
                className={`px-8 py-2.5 bg-[#0059b5] hover:bg-[#004a96] text-white text-sm font-medium rounded-full shadow-md shadow-blue-900/20 transition-all flex items-center gap-2 ${isNextDisabled() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {step === 5 ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDataMismatchModalOpen && (
        <DataMismatchModal
          isOpen={isDataMismatchModalOpen}
          onClose={() => {
            setIsDataMismatchModalOpen(false);
            setSelectedMismatchItem(null);
          }}
          onSubmit={handleDataMismatchSubmit}
          vehicleData={selectedMismatchItem ? {
            mv_file_number: selectedMismatchItem.crCr?.mvFileNumber || selectedMismatchItem.orCr?.mvFileNumber || "",
            plate_number: selectedMismatchItem.crCr?.plateNumber || selectedMismatchItem.orCr?.plateNumber || "",
            engine_number: selectedMismatchItem.crCr?.engineNumber || "",
            chassis_number: selectedMismatchItem.crCr?.chassisNumber || "",
            make: selectedMismatchItem.crCr?.make || "",
            series: selectedMismatchItem.crCr?.series || "",
            color: "",
            denomination: "",
            year_model: "",
            classification: "",
          } : {}}
          ownerData={{}}
        />
      )}
      <UploadDocumentGuidelineModal
        isOpen={showGuidelineModal}
        onClose={() => setShowGuidelineModal(false)}
      />
      <CreateTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedMismatchItem(null);
        }}
        onSubmit={handleCreateTicket}
        prefilledData={getTicketPrefilledData()}
        previewTicket={selectedMismatchItem?.submittedTicket}
      />

      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
          size="sm"
          hideHeader
        >
          <div className="p-8 text-center space-y-5">
            <h3 className="text-2xl font-bold text-gray-900">Are you sure?</h3>
            <p className="text-gray-500 text-lg leading-relaxed max-w-[340px] mx-auto">
              {confirmAction === "verify"
                ? "Please confirm that you want to submit this queue of OR/CR uploads for VVS verification."
                : "Please confirm that all uploaded data is accurate and final for this bulk transaction."}
            </p>
            <div className="flex justify-center gap-4 pt-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-8 py-2.5 rounded-2xl border-2 border-[#0059b5] text-[#0059b5] font-semibold hover:bg-blue-50/50 transition-colors min-w-[120px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  if (confirmAction === "verify") {
                    handleVerifyQueue();
                  } else {
                    handleConfirmNext();
                  }
                  setConfirmAction(null);
                }}
                className="px-8 py-2.5 rounded-2xl bg-[#0059b5] text-white font-semibold hover:bg-[#004bb0] transition-colors shadow-lg shadow-blue-500/10 min-w-[120px]"
              >
                Proceed
              </button>
            </div>
          </div>
        </Modal>
      )}

      <OcrProgressModal
        isOpen={ocrUploadState.or.status === "extracting" || ocrUploadState.or.status === "success" || ocrUploadState.or.status === "error"}
        status={ocrUploadState.or.status}
        documentType="or"
        errorMsg={ocrUploadState.or.error}
        onClose={() => {
          setOcrState("or", { status: OCR_STATUS.IDLE });
          if (ocrUploadState.or.status === "error") {
            setOrPreview(null);
            setOrCr(emptyVehicle);
          }
        }}
      />

      <OcrProgressModal
        isOpen={ocrUploadState.cr.status === "extracting" || ocrUploadState.cr.status === "success" || ocrUploadState.cr.status === "error"}
        status={ocrUploadState.cr.status}
        documentType="cr"
        errorMsg={ocrUploadState.cr.error}
        onClose={() => {
          setOcrState("cr", { status: OCR_STATUS.IDLE });
          if (ocrUploadState.cr.status === "error") {
            setCrPreview(null);
            setCrCr(emptyVehicle);
          }
        }}
      />

      <OrCrMismatchModal
        isOpen={isOrCrMismatchModalOpen}
        onClose={() => setIsOrCrMismatchModalOpen(false)}
        mismatches={orCrMismatches}
        onSubmit={handleOrCrMismatchSubmit}
      />
    </div>
  );
};
