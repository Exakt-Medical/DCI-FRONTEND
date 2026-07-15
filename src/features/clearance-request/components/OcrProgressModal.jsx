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
  ],
  mec: [
    { key: "mecControlNo", label: "MEC Number" },
    { key: "mecDateIssued", label: "Issue Date" },
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

      // Auto close success modal after 1.2s
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
      return () => clearTimeout(timer);
    } else if (status === "error") {
      setProgress(100);
    }
  }, [status, fields, onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={status === "error" ? onClose : undefined} size="sm" hideHeader>
      <div className="p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl animate-pulse">
            <FileText size={32} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {status === "extracting" && `Extracting ${docName}`}
            {status === "success" && "Extraction Complete!"}
            {status === "error" && "Extraction Failed"}
          </h3>
          <p className="text-sm text-gray-500 mt-1.5">
            {status === "extracting" && "Reading details via OCR scanner. Please wait."}
            {status === "success" && "Successfully extracted vehicle details."}
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
                status === "error" ? "bg-red-500" : status === "success" ? "bg-green-500" : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Fields List */}
        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 text-left divide-y divide-gray-100">
          {fields.map((field) => {
            const isCompleted = completedFields.includes(field.key);
            return (
              <div key={field.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
                {status === "error" && !isCompleted ? (
                  <AlertCircle size={16} className="text-red-500" />
                ) : isCompleted ? (
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

        {status === "error" && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors mt-2"
          >
            Close
          </button>
        )}
      </div>
    </Modal>
  );
};
