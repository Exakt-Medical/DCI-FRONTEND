import { useState } from "react";
import { AlertCircle, X, Ticket, Paperclip } from "lucide-react";
import { Button } from "../../../components/Button";

const MISMATCH_FIELDS = [
  { key: "mv_file_number", label: "MV File No.", dataKey: "mv_file_number" },
  { key: "plate_number", label: "Plate No.", dataKey: "plate_number" },
  { key: "engine_number", label: "Engine No.", dataKey: "engine_number" },
  { key: "chassis_number", label: "Chassis No.", dataKey: "chassis_number" },
  { key: "make", label: "Make", dataKey: "make" },
  { key: "series", label: "Series / Model", dataKey: "series" },
  { key: "color", label: "Vehicle Color", dataKey: "color" },
  {
    key: "denomination",
    label: "Vehicle Type/Denomination",
    dataKey: "denomination",
  },
  { key: "year_model", label: "Year Model", dataKey: "year_model" },
  { key: "classification", label: "Classification", dataKey: "classification" },
];

export const DataMismatchModal = ({
  vehicleData,
  onSubmit,
  onClose,
  isSubmitting,
}) => {
  const [correctedValues, setCorrectedValues] = useState({});
  const [attachmentFile, setAttachmentFile] = useState({
  crAttachment: null,
  plateCertificationAttachment: null,
  actualPlateAttachment: null,
});

  const handleChange = (key, value) => {
    setCorrectedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const mismatches = MISMATCH_FIELDS.filter((f) =>
      correctedValues[f.key]?.trim(),
    ).map((f) => ({
      field: f.key,
      label: f.label,
      actual: vehicleData[f.dataKey] || "N/A",
      expected: correctedValues[f.key].trim(),
    }));

    if (mismatches.length === 0) return;

    // ✅ THIS is what Spring will store in cr_attachment
   onSubmit({
  crAttachment: JSON.stringify(mismatches),
  attachmentFile,
});
  };

  const filledCount = MISMATCH_FIELDS.filter((f) =>
    correctedValues[f.key]?.trim(),
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-red-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <h2 className="text-base font-bold text-red-700">
                Report Data Mismatch
              </h2>
              <p className="text-xs text-red-500 mt-0.5">
                Enter the correct value for any field that doesn't match
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr] border-b border-gray-200 flex-shrink-0">
          <div className="px-4 py-2 bg-red-50 text-xs font-semibold text-red-500 uppercase tracking-wide border-r border-gray-200">
            LTO Record (Submitted)
          </div>
          <div className="px-4 py-2 bg-green-50 text-xs font-semibold text-green-600 uppercase tracking-wide">
            Correct Value
          </div>
        </div>

{/* Fields */}
<div className="overflow-y-auto flex-1">
  {MISMATCH_FIELDS.map((field) => {
    const submittedValue = vehicleData[field.dataKey] || "—";
    const hasCorrected = !!correctedValues[field.key]?.trim();

    return (
      <div
        key={field.key}
        className={`grid grid-cols-[1fr_1fr] border-b border-gray-100 ${
          hasCorrected ? "bg-green-50/30" : ""
        }`}
      >
        <div className="px-4 py-3 border-r border-gray-100 bg-red-50/20">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {field.label}
          </p>
          <p className="text-sm font-medium text-gray-800 break-words">
            {submittedValue}
          </p>
        </div>

        <div className="px-4 py-3 flex items-center">
          <input
            type="text"
            value={correctedValues[field.key] ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder="Enter correct value…"
            className={`w-full text-sm text-gray-900 bg-transparent border-b focus:outline-none placeholder-gray-300 transition-colors ${
              hasCorrected
                ? "border-green-400 text-green-800"
                : "border-gray-300 focus:border-green-400"
            }`}
          />
        </div>
      </div>
    );
  })}

  {/* Vehicle Attachments */}
  <div className="px-6 py-5 border-t border-gray-100 bg-white">
    <div className="flex items-center gap-2 mb-5">
      <Paperclip size={18} className="text-primary-600" />
      <h3 className="text-sm font-bold text-gray-900">
        Vehicle Attachments
      </h3>
    </div>

    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          CR Attachment (Optional)
        </label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-4 py-2.5 rounded-lg text-sm">
            Choose File
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) =>
                setAttachmentFile((prev) => ({
                  ...prev,
                  crAttachment: e.target.files?.[0] || null,
                }))
              }
            />
          </label>
          <span className="text-sm text-gray-500">
            {attachmentFile?.crAttachment
              ? attachmentFile.crAttachment.name
              : "No file chosen"}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Plate Certification Attachment (Optional)
        </label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-4 py-2.5 rounded-lg text-sm">
            Choose File
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) =>
                setAttachmentFile((prev) => ({
                  ...prev,
                  plateCertificationAttachment:
                    e.target.files?.[0] || null,
                }))
              }
            />
          </label>
          <span className="text-sm text-gray-500">
            {attachmentFile?.plateCertificationAttachment
              ? attachmentFile.plateCertificationAttachment.name
              : "No file chosen"}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Actual Plate Attachment (Optional)
        </label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-4 py-2.5 rounded-lg text-sm">
            Choose File
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) =>
                setAttachmentFile((prev) => ({
                  ...prev,
                  actualPlateAttachment:
                    e.target.files?.[0] || null,
                }))
              }
            />
          </label>
          <span className="text-sm text-gray-500">
            {attachmentFile?.actualPlateAttachment
              ? attachmentFile.actualPlateAttachment.name
              : "No file chosen"}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-500">
            {filledCount === 0 ? (
              "Fill in at least one correct value to submit."
            ) : (
              <span className="text-green-600 font-medium">
                {filledCount} field{filledCount !== 1 ? "s" : ""} corrected
              </span>
            )}
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || filledCount === 0}
              className="flex items-center gap-2"
            >
              <Ticket size={15} />
              {isSubmitting ? "Submitting…" : "Submit Ticket"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
