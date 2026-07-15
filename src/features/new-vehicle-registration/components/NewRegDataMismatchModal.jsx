import { useState } from "react";
import { AlertCircle, X, Ticket, Flag, Check } from "lucide-react";
import { Button } from "../../../components/Button";

const MISMATCH_FIELDS = [
  { key: "csrNo", label: "CSR No." },
  { key: "invoiceNo", label: "Invoice No." },
  { key: "policyNo", label: "CTPL Policy No." },
  { key: "plateNumber", label: "Plate No." },
  { key: "mvFileNumber", label: "MV File No." },
  { key: "engineNumber", label: "Engine No." },
  { key: "chassisNumber", label: "Chassis No." },
  { key: "make", label: "Make" },
  { key: "series", label: "Series / Model" },
  { key: "yearModel", label: "Year Model" },
];

export const NewRegDataMismatchModal = ({ documents, onSubmit, onClose, isSubmitting }) => {
  const [correctedValues, setCorrectedValues] = useState({});
  const [flaggedFields, setFlaggedFields] = useState({});

  const handleChange = (key, value) => {
    setCorrectedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleFlag = (key) => {
    setFlaggedFields((prev) => {
      const isFlagged = !!prev[key];
      if (isFlagged) {
        setCorrectedValues((prevVals) => {
          const next = { ...prevVals };
          delete next[key];
          return next;
        });
      }
      return { ...prev, [key]: !isFlagged };
    });
  };

  const handleSubmit = () => {
    const mismatches = MISMATCH_FIELDS.filter((f) => correctedValues[f.key]?.trim()).map((f) => ({
      field: f.key,
      label: f.label,
      expected: correctedValues[f.key].trim(),
    }));
    if (mismatches.length === 0) return;
    onSubmit({ mismatches });
  };

  const filledCount = MISMATCH_FIELDS.filter((f) => correctedValues[f.key]?.trim()).length;

  const getDocValue = (key) => {
    for (const doc of Object.values(documents)) {
      if (doc[key] && String(doc[key]).trim()) return String(doc[key]).trim();
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <h2 className="text-base font-bold text-red-700">Report Data Mismatch</h2>
              <p className="text-xs text-red-500 mt-0.5">
                Flag fields that don't match the physical documents
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_1fr] border-b border-gray-200 flex-shrink-0">
          <div className="px-4 py-2 bg-red-50 text-xs font-semibold text-red-500 uppercase tracking-wide border-r border-gray-200">
            Extracted Value
          </div>
          <div className="px-4 py-2 bg-green-50 text-xs font-semibold text-green-600 uppercase tracking-wide">
            Correct Value
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {MISMATCH_FIELDS.map((field) => {
            const extractedValue = getDocValue(field.key);
            const isFlagged = !!flaggedFields[field.key];
            const hasCorrected = !!correctedValues[field.key]?.trim();
            return (
              <div
                key={field.key}
                className={`grid grid-cols-[1fr_1fr] border-b border-gray-100 transition-colors ${
                  hasCorrected ? "bg-green-50/30" : isFlagged ? "bg-red-50/20" : ""
                }`}
              >
                <div className="px-4 py-3 border-r border-gray-100 bg-red-50/20">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    {field.label}
                  </p>
                  <p className="text-sm font-medium text-gray-800 break-words">
                    {extractedValue || "—"}
                  </p>
                </div>
                <div className="px-4 py-3 flex items-center gap-2">
                  {isFlagged ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={correctedValues[field.key] ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder="Enter correct value..."
                        autoFocus
                        className={`flex-1 text-sm text-gray-900 bg-transparent border-b focus:outline-none placeholder-gray-300 transition-colors ${
                          hasCorrected ? "border-green-400 text-green-800" : "border-gray-300 focus:border-primary-400"
                        }`}
                      />
                      <button
                        onClick={() => handleToggleFlag(field.key)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Remove flag"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleFlag(field.key)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors border border-dashed border-gray-200 hover:border-red-300"
                    >
                      <Flag size={11} />
                      Flag Mismatch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-500">
            {filledCount === 0 ? (
              "Flag at least one field with a mismatch to submit."
            ) : (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Check size={12} />
                {filledCount} field{filledCount !== 1 ? "s" : ""} corrected
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || filledCount === 0} className="flex items-center gap-2">
              <Ticket size={15} />
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
