import { useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import { Check, Loader2, AlertCircle, FileText } from "lucide-react";

const DOCUMENT_FIELDS = {
  or: [
    { key: "plateNumber", label: "Plate No." },
    { key: "mvFileNumber", label: "File No." },
    { key: "color", label: "Color" },
    { key: "classification", label: "Classification" },
    { key: "yearModel", label: "Year Model" },
    { key: "ownerName", label: "Owner's Name" },
    { key: "ownerAddress", label: "Owner's Address" },
  ],
  cr: [
    { key: "engineNumber", label: "Engine" },
    { key: "chassisNumber", label: "Chassis No." },
    { key: "make", label: "Make/Brand" },
    { key: "series", label: "Series" },
    { key: "bodyType", label: "Body Type" },
    { key: "vehicleType", label: "Vehicle Type" },
  ],
  mvcc: [
    { key: "mvccControlNo", label: "MVCC Number" },
    { key: "mvccDateIssued", label: "Issue Date" },
    { key: "mvFileNo", label: "MV File Number" },
    { key: "engineNo", label: "Engine Number" },
    { key: "chassisNo", label: "Chassis Number" },
    { key: "plateNo", label: "Plate Number" },
    { key: "color", label: "Color" },
  ],
  mec: [
    { key: "mecControlNo", label: "MEC Number" },
    { key: "mecDateIssued", label: "Issue Date" },
    { key: "mecEngineNo", label: "Engine Number" },
    { key: "mecChassisNo", label: "Chassis Number" },
    { key: "mecPlateNo", label: "Plate Number" },
    { key: "mecColor", label: "Color" },
  ],
};

const DOCUMENT_NAMES = {
  or: "Official Receipt (OR)",
  cr: "Certificate of Registration (CR)",
  mvcc: "MVCC Certificate",
  mec: "MEC Certificate",
};

export const OcrProgressModal = ({
  isOpen,
  status, // "extracting", "success", "error"
  documentType, // "or", "cr", "mvcc", "mec"
  errorMsg = "",
  onClose,
  extractedFields = {}, // Prop listing successfully auto-extracted fields
}) => {
  const [progress, setProgress] = useState(0);
  const [completedFields, setCompletedFields] = useState([]);
  const fields = DOCUMENT_FIELDS[documentType] || [];
  const docName = DOCUMENT_NAMES[documentType] || "Document";

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCompletedFields([]);
      return;
    }

    if (status === "extracting") {
      setProgress(0);
      setCompletedFields([]);

      // Increment progress slowly up to 90%
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          const next = prev + Math.floor(Math.random() * 8) + 4;
          return Math.min(next, 90);
        });
      }, 150);

      return () => clearInterval(progressInterval);
    }
  }, [isOpen, status]);

  // Sync field checklists with progress
  useEffect(() => {
    if (status === "extracting") {
      const fieldCount = fields.length;
      if (fieldCount === 0) return;

      const newCompleted = [];
      fields.forEach((field, index) => {
        const threshold = ((index + 1) / fieldCount) * 85;
        if (progress >= threshold) {
          newCompleted.push(field.key);
        }
      });
      setCompletedFields(newCompleted);
    }
  }, [progress, fields, status]);

  // When status becomes success or error
  useEffect(() => {
    if (status === "success") {
      setProgress(100);
      setCompletedFields(fields.map((f) => f.key));

      // Calculate if any expected fields failed to extract
      const hasMissingFields = fields.some((f) => !extractedFields[f.key]);

      // If fields are missing, do not auto-close; let the user inspect the report
      if (!hasMissingFields) {
        const timer = setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else if (status === "error") {
      setProgress(100);
    }
  }, [status, fields, onClose, extractedFields]);

  if (!isOpen) return null;

  const hasMissingFields = status === "success" && fields.some((f) => !extractedFields[f.key]);

  return (
    <Modal isOpen={isOpen} onClose={(status === "error" || hasMissingFields) ? onClose : undefined} size="sm" hideHeader>
      <div className="p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className={`p-3 rounded-2xl ${status === "error" || hasMissingFields ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600 animate-pulse"}`}>
            <FileText size={32} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {status === "extracting" && `Extracting ${docName}`}
            {status === "success" && (hasMissingFields ? "Extraction Partial" : "Extraction Complete!")}
            {status === "error" && "Extraction Failed"}
          </h3>
          <p className="text-sm text-gray-500 mt-1.5">
            {status === "extracting" && "Reading details via OCR scanner. Please wait."}
            {status === "success" && (hasMissingFields ? "Some fields could not be read. Please check red items below." : "Successfully extracted vehicle details.")}
            {status === "error" && (errorMsg || "Unable to read fields from document.")}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between text-xs font-semibold text-gray-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === "error" || hasMissingFields ? "bg-red-500" : status === "success" ? "bg-green-500" : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Fields List */}
        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 text-left divide-y divide-gray-100">
          {fields.map((field) => {
            const isCompleted = completedFields.includes(field.key);
            // Verify if it was successfully extracted on complete
            const isExtracted = status === "success" ? !!extractedFields[field.key] : isCompleted;
            
            return (
              <div key={field.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
                {status === "error" && !isCompleted ? (
                  <AlertCircle size={16} className="text-red-500" />
                ) : status === "success" && !isExtracted ? (
                  <div className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                    <span className="text-[10px] uppercase">Manual Input</span>
                    <AlertCircle size={14} />
                  </div>
                ) : isExtracted ? (
                  <div className="p-0.5 bg-green-100 text-green-700 rounded-full">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {(status === "error" || hasMissingFields) && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-150 hover:bg-gray-200 text-gray-800 font-semibold transition-colors mt-2"
          >
            Review Fields Manually
          </button>
        )}
      </div>
    </Modal>
  );
};
