import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Search,
  Bike,
  Ticket,
  Flag,
} from "lucide-react";
import { CITIZEN_REG_STEPS, NEW_REG_DOC_TYPES, VEHICLE_TYPE, VEHICLE_TYPE_LABELS, VALIDATION_STATE, emptySalesInvoice, emptyCsr, emptyCtpl, emptyStencil, isAllDocumentsComplete, generateRegRefNumber } from "./utils/newVehicleRegistrationUtils";
import { generateNVRCertificatePDF } from "./utils/generateNVRCertificatePDF";
import { NewRegUploadCard } from "./components/NewRegUploadCard";
import { NewRegDataMismatchModal } from "./components/NewRegDataMismatchModal";
import { ticketService } from "../../services/ticketService";
import { useAlert } from "../../hooks/useAlert";

function generateRefNumber() {
  const pad = (n) => String(n).padStart(4, "0");
  const now = new Date();
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const rand = pad(Math.floor(Math.random() * 9000) + 1000);
  return `REG-${date}-${rand}`;
}

const DOC_TYPES_ORDER = [
  NEW_REG_DOC_TYPES.SALES_INVOICE,
  NEW_REG_DOC_TYPES.CSR,
  NEW_REG_DOC_TYPES.CTPL,
  NEW_REG_DOC_TYPES.STENCIL,
];

export const NewVehicleRegistrationFlow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error: showError, success: showSuccessAlert } = useAlert();

  const flowSteps = CITIZEN_REG_STEPS;
  const maxStep = flowSteps.length;

  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const queryStep = Number(params.get("step"));
    if (queryStep > 0) return Math.min(queryStep, maxStep);
    return 1;
  });

  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPE.MV);
  const [refNumber, setRefNumber] = useState(generateRefNumber());
  const [requestId, setRequestId] = useState("");
  const [isDataMismatchModalOpen, setIsDataMismatchModalOpen] = useState(false);
  const [isSubmittingMismatch, setIsSubmittingMismatch] = useState(false);

  const [documents, setDocuments] = useState({
    [NEW_REG_DOC_TYPES.SALES_INVOICE]: { ...emptySalesInvoice },
    [NEW_REG_DOC_TYPES.CSR]: { ...emptyCsr },
    [NEW_REG_DOC_TYPES.CTPL]: { ...emptyCtpl },
    [NEW_REG_DOC_TYPES.STENCIL]: { ...emptyStencil },
  });

  const [previews, setPreviews] = useState({});
  const [fileNames, setFileNames] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState({});

  const [isPaying, setIsPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyErrorType, setVerifyErrorType] = useState(null);

  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [certificateNo, setCertificateNo] = useState("");
  const [certificateIssued, setCertificateIssued] = useState(false);

  const onCancel = () => navigate("/dci-access/requests");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("step") !== String(step)) {
      params.set("step", String(step));
      if (requestId) params.set("id", requestId);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [step, location.search, navigate, requestId]);

  useEffect(() => {
    if (step === 4 && !certificateNo && !certificateIssued && !isIssuingCertificate) {
      handleIssueCertificate();
    }
  }, [step]);

  const handleDocChange = (docType, previewUrl, fileName, data) => {
    if (previewUrl !== null) {
      setPreviews((prev) => ({ ...prev, [docType]: previewUrl }));
      setUploadedDocs((prev) => ({ ...prev, [docType]: true }));
    }
    if (fileName !== null) {
      setFileNames((prev) => ({ ...prev, [docType]: fileName }));
    }
    if (data) {
      setDocuments((prev) => ({ ...prev, [docType]: data }));
    }
  };

  const handleRemoveDoc = (docType) => {
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
    setFileNames((prev) => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
  };

  const allDocsUploaded = DOC_TYPES_ORDER.every((t) => uploadedDocs[t]);
  const allDocsComplete = isAllDocumentsComplete(documents);

  const canProceedStep1 = allDocsUploaded && allDocsComplete;

  const handleProceedToPayment = () => {
    setStep(2);
  };

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      const ref = `PAY-${Math.floor(Math.random() * 90000) + 10000}`;
      setPaymentRef(ref);
      setPaymentDone(true);
      setIsPaying(false);
      const rid = generateRegRefNumber();
      setRequestId(rid);
      const existing = JSON.parse(localStorage.getItem("dci_mock_requests") || "[]");
      existing.push({
        id: rid,
        type: "NEW_REGISTRATION",
        refNumber: refNumber,
        vehicleType,
        documents,
        previews,
        fileNames,
        uploadedDocs,
        paymentDone: true,
        paymentRef: ref,
        status: "REGISTRATION_PAID",
        step: 2,
        dateCreated: new Date().toISOString().split("T")[0],
      });
      localStorage.setItem("dci_mock_requests", JSON.stringify(existing));
    }, 1500);
  };

  const handleVerify = (simulateType) => {
    setIsVerifying(true);
    setVerifyMessage("");
    setVerifyErrorType(null);
    setTimeout(() => {
      const passed = !simulateType;
      if (passed) {
        setVerificationPassed(true);
        setVerificationFailed(false);
        setVerifyErrorType(null);
        setVerifyMessage("Vehicle registration verified successfully in VVS database.");
        const stored = JSON.parse(localStorage.getItem("dci_mock_requests") || "[]");
        const idx = stored.findIndex((r) => r.id === requestId);
        if (idx >= 0) {
          stored[idx].status = "VEHICLE_VERIFIED";
          stored[idx].step = 3;
          localStorage.setItem("dci_mock_requests", JSON.stringify(stored));
        }
      } else {
        setVerificationPassed(false);
        setVerificationFailed(true);
        setVerifyErrorType(simulateType);
        if (simulateType === "DATA_MISMATCH") {
          setVerifyMessage("Data mismatch detected between extracted document values and VVS database records.");
        } else {
          setVerifyMessage("No matching vehicle record found in VVS database. Please check your documents.");
        }
      }
      setIsVerifying(false);
    }, 1500);
  };

  const handleIssueCertificate = () => {
    setIsIssuingCertificate(true);
    setTimeout(() => {
      const certNo = `DCI-NVR-${Math.floor(Math.random() * 90000) + 10000}`;
      setCertificateNo(certNo);
      setCertificateIssued(true);
      const stored = JSON.parse(localStorage.getItem("dci_mock_requests") || "[]");
      const idx = stored.findIndex((r) => r.id === requestId);
      if (idx >= 0) {
        stored[idx].certificateNo = certNo;
        stored[idx].status = "CERTIFICATE_ISSUED";
        stored[idx].step = 4;
        localStorage.setItem("dci_mock_requests", JSON.stringify(stored));
      }
      setIsIssuingCertificate(false);
    }, 1500);
  };

  const renderStepIndicator = () => (
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
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVehicleType(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    vehicleType === key
                      ? "border-[#0059b5] bg-[#0059b5]/5 text-[#0059b5]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {key === VEHICLE_TYPE.MC ? <Bike size={18} /> : <Car size={18} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DOC_TYPES_ORDER.map((docType) => (
          <div key={docType} className="relative">
            {uploadedDocs[docType] && (
              <button
                onClick={() => handleRemoveDoc(docType)}
                className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                title="Remove document"
              >
                <X size={14} />
              </button>
            )}
            <NewRegUploadCard
              docType={docType}
              documentData={documents[docType]}
              onChange={handleDocChange}
              preview={previews[docType]}
              fileName={fileNames[docType]}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div>
          {!allDocsComplete && allDocsUploaded && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle size={14} />
              Some documents have missing fields. Please review extracted data.
            </p>
          )}
          {!allDocsUploaded && (
            <p className="text-xs text-gray-500">
              Upload all 4 documents to proceed.
            </p>
          )}
        </div>
        <Button
          onClick={handleProceedToPayment}
          disabled={!canProceedStep1}
        >
          Proceed to Payment
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#0059b5]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard size={28} className="text-[#0059b5]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Registration Payment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pay the registration fee to continue
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Reference No.</span>
              <span className="text-sm font-semibold text-gray-900">{refNumber}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Vehicle Type</span>
              <span className="text-sm font-semibold text-gray-900">{VEHICLE_TYPE_LABELS[vehicleType]}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Registration Fee</span>
                <span className="text-lg font-bold text-[#0059b5]">
                  PHP 100.00
                </span>
              </div>
            </div>
          </div>

          {paymentDone ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-base font-bold text-green-700">Payment Successful</h3>
              <p className="text-sm text-gray-500 mt-1">Reference: {paymentRef}</p>
            </div>
          ) : (
            <Button
              onClick={handlePay}
              disabled={isPaying}
              className="w-full"
              size="lg"
            >
              {isPaying ? (
                <><Spinner className="mr-2" /> Processing Payment...</>
              ) : (
                <><CreditCard size={18} className="mr-2" /> Pay PHP 100.00</>
              )}
            </Button>
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ChevronLeft size={16} /> Back
          </Button>
          {paymentDone && (
            <Button onClick={() => setStep(3)}>
              Proceed to Verification <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );

  const renderStep3 = () => (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#0059b5]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={28} className="text-[#0059b5]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Verify Vehicle Registration</h2>
          <p className="text-sm text-gray-500 mt-1">
            The system will check the vehicle details against the VVS database.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reference No.</span>
            <span className="font-medium">{refNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Vehicle Type</span>
            <span className="font-medium">{VEHICLE_TYPE_LABELS[vehicleType]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CSR No.</span>
            <span className="font-medium">{documents[NEW_REG_DOC_TYPES.CSR]?.csrNo || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Invoice No.</span>
            <span className="font-medium">{documents[NEW_REG_DOC_TYPES.SALES_INVOICE]?.invoiceNo || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Engine No.</span>
            <span className="font-medium">{documents[NEW_REG_DOC_TYPES.CSR]?.engineNumber || documents[NEW_REG_DOC_TYPES.STENCIL]?.engineNumber || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Chassis No.</span>
            <span className="font-medium">{documents[NEW_REG_DOC_TYPES.CSR]?.chassisNumber || documents[NEW_REG_DOC_TYPES.STENCIL]?.chassisNumber || "-"}</span>
          </div>
          {paymentRef && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Ref</span>
              <span className="font-medium">{paymentRef}</span>
            </div>
          )}
        </div>

        {verificationPassed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Verification Passed</p>
              <p className="text-xs text-green-700 mt-1">{verifyMessage}</p>
            </div>
          </div>
        )}

        {verificationFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Verification Failed</p>
              <p className="text-xs text-red-700 mt-1">{verifyMessage}</p>
            </div>
          </div>
        )}

        {!verificationPassed && !verificationFailed && !isVerifying && (
          <Button
            onClick={() => handleVerify()}
            className="w-full"
            size="lg"
          >
            <Search size={18} className="mr-2" /> Verify Vehicle
          </Button>
        )}

        {isVerifying && (
          <Button disabled className="w-full" size="lg">
            <Spinner className="mr-2" /> Verifying with VVS...
          </Button>
        )}

        {verificationFailed && !isVerifying && (
          <div className="flex flex-col gap-2">
            {verifyErrorType === "DATA_MISMATCH" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDataMismatchModalOpen(true)}
                className="w-full"
              >
                <Flag size={14} className="mr-1" /> Report Data Mismatch
              </Button>
            )}
            {verifyErrorType === "NOT_FOUND" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const stored = JSON.parse(localStorage.getItem("dci_mock_tickets") || "[]");
                  stored.push({ id: `TKT-${Date.now()}`, referenceNumber: refNumber, type: "NOT_FOUND", description: "Vehicle not found in VVS database.", status: "OPEN", dateCreated: new Date().toISOString() });
                  localStorage.setItem("dci_mock_tickets", JSON.stringify(stored));
                  showSuccessAlert("Not Found report submitted successfully.");
                }}
                className="w-full"
              >
                <Flag size={14} className="mr-1" /> Report Data Not Found
              </Button>
            )}
            <Button
              onClick={() => handleVerify()}
              disabled={isVerifying}
              variant="outline"
              className="w-full"
            >
              Retry Verification
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setStep(paymentDone ? 2 : 1)}>
          <ChevronLeft size={16} /> Back
        </Button>
        {verificationPassed && (
          <Button onClick={() => setStep(4)}>
            Issue Certificate <ChevronRight size={16} />
          </Button>
        )}
      </div>

      {isDataMismatchModalOpen && (
        <NewRegDataMismatchModal
          documents={documents}
          onSubmit={async ({ mismatches }) => {
            setIsSubmittingMismatch(true);
            try {
              const payload = {
                referenceNumber: refNumber,
                type: "DATA_MISMATCH",
                description: JSON.stringify(mismatches),
                status: "OPEN",
              };
              const stored = JSON.parse(localStorage.getItem("dci_mock_tickets") || "[]");
              stored.push({ ...payload, id: `TKT-${Date.now()}`, dateCreated: new Date().toISOString() });
              localStorage.setItem("dci_mock_tickets", JSON.stringify(stored));
              showSuccessAlert("Data mismatch ticket submitted successfully.");
              setIsDataMismatchModalOpen(false);
            } catch (err) {
              showError("Failed to submit ticket.");
            } finally {
              setIsSubmittingMismatch(false);
            }
          }}
          onClose={() => setIsDataMismatchModalOpen(false)}
          isSubmitting={isSubmittingMismatch}
        />
      )}

      {!verificationPassed && !verificationFailed && !isVerifying && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 mt-6">
          <span className="text-xs text-gray-400 mr-2">Simulate:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVerify("NOT_FOUND")}
            className="text-xs px-2"
          >
            Not Found
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVerify("DATA_MISMATCH")}
            className="text-xs px-2"
          >
            Data Mismatch
          </Button>
        </div>
      )}
    </div>
  );

  const handlePreview = async () => {
    if (!certificateNo) return;
    try {
      const { doc } = await generateNVRCertificatePDF({
        certificateNo,
        refNumber,
        vehicleType: VEHICLE_TYPE_LABELS[vehicleType],
        csr: documents[NEW_REG_DOC_TYPES.CSR],
        stencil: documents[NEW_REG_DOC_TYPES.STENCIL],
        invoice: documents[NEW_REG_DOC_TYPES.SALES_INVOICE],
        ctpl: documents[NEW_REG_DOC_TYPES.CTPL],
        dateCreated: new Date().toISOString(),
      });
      const pdfUrl = doc.output("bloburl");
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("Failed to generate PDF preview:", err);
      showError("Error", "Failed to preview certificate.");
    }
  };

  const handleDownload = async () => {
    if (!certificateNo) return;
    try {
      const { doc, filename } = await generateNVRCertificatePDF({
        certificateNo,
        refNumber,
        vehicleType: VEHICLE_TYPE_LABELS[vehicleType],
        csr: documents[NEW_REG_DOC_TYPES.CSR],
        stencil: documents[NEW_REG_DOC_TYPES.STENCIL],
        invoice: documents[NEW_REG_DOC_TYPES.SALES_INVOICE],
        ctpl: documents[NEW_REG_DOC_TYPES.CTPL],
        dateCreated: new Date().toISOString(),
      });
      doc.save(filename);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      showError("Error", "Failed to download certificate.");
    }
  };

  const generateSampleDocPdf = async (docType) => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", "a4");
    const data = documents[docType] || {};
    const labels = {
      [NEW_REG_DOC_TYPES.SALES_INVOICE]: "Sales Invoice",
      [NEW_REG_DOC_TYPES.CSR]: "Certificate of Stock Report (CSR)",
      [NEW_REG_DOC_TYPES.CTPL]: "Compulsory Third Party Liability (CTPL)",
      [NEW_REG_DOC_TYPES.STENCIL]: "Stencil / MV Plate Detail",
    };
    const title = labels[docType] || docType;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: "center" });
    doc.setDrawColor(0, 89, 181);
    doc.setLineWidth(0.8);
    const tw = doc.getTextWidth(title);
    doc.line((210 - tw) / 2, 23, (210 + tw) / 2, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let y = 40;
    for (const [key, val] of Object.entries(data)) {
      if (!val) continue;
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      doc.text(`${label}: ${val}`, 20, y);
      y += 8;
    }
    if (y === 40) {
      doc.text("Reference No: " + refNumber, 20, 40);
      y = 56;
    }
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Sample document for demo purposes only.", 105, 280, { align: "center" });
    return doc;
  };

  const handleViewDoc = async (docType) => {
    const doc = await generateSampleDocPdf(docType);
    window.open(doc.output("bloburl"), "_blank");
  };

  const handleDownloadDoc = async (docType) => {
    const doc = await generateSampleDocPdf(docType);
    const label = docType === NEW_REG_DOC_TYPES.SALES_INVOICE ? "Sales_Invoice" : docType === NEW_REG_DOC_TYPES.CSR ? "CSR" : docType === NEW_REG_DOC_TYPES.CTPL ? "CTPL" : "Stencil";
    doc.save(`${label}_${refNumber}.pdf`);
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <FileText size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">Issue Certificate</h3>
        </div>
        {isIssuingCertificate || (!certificateNo && !certificateIssued) ? (
          <div className="text-center py-8">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Waiting for DCI Validation and Certificate Issuance...</p>
          </div>
        ) : certificateNo ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-green-700 text-lg">Certificate Issued</p>
            <p className="text-sm font-mono font-bold text-gray-900 mt-2">{certificateNo}</p>
            <p className="text-xs text-gray-500 mt-1">Vehicle: {VEHICLE_TYPE_LABELS[vehicleType]}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Button onClick={handlePreview} variant="outline" className="flex items-center gap-1.5">
                <Eye size={16} /> Preview
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex items-center gap-1.5">
                <Download size={16} /> Download
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Supporting Documents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOC_TYPES_ORDER.map((docType) => (
            <div key={docType} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#0059b5]" />
                <span className="text-xs font-medium text-gray-700">
                  {docType === NEW_REG_DOC_TYPES.SALES_INVOICE && "Sales Invoice"}
                  {docType === NEW_REG_DOC_TYPES.CSR && "CSR"}
                  {docType === NEW_REG_DOC_TYPES.CTPL && "CTPL"}
                  {docType === NEW_REG_DOC_TYPES.STENCIL && "Stencil"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleViewDoc(docType)}
                  className="p-1.5 text-gray-500 hover:text-[#0059b5] transition-colors"
                  title="View"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDownloadDoc(docType)}
                  className="p-1.5 text-gray-500 hover:text-[#0059b5] transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">New Vehicle Registration</span>
            <span className="text-xs text-gray-500 ml-auto">
              Ref: {refNumber}
              {step > 1 && step < 5 && (
                <button onClick={onCancel} className="ml-3 text-red-500 hover:text-red-700 text-xs underline">
                  Cancel
                </button>
              )}
            </span>
          </div>

          <div className="px-6 py-4 bg-[#0059b5]">
            {renderStepIndicator()}
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};
