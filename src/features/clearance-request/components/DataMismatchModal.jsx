import { useState } from "react";
import {
  AlertCircle,
  X,
  Ticket,
  Paperclip,
  User,
  Car,
  Flag,
  Check,
} from "lucide-react";
import { Button } from "../../../components/Button";

const VEHICLE_MISMATCH_FIELDS = [
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

const OWNER_MISMATCH_FIELDS = [
  { key: "owner_fullName", label: "Full Name", dataKey: "fullName" },
  { key: "owner_address", label: "Address", dataKey: "address" },
];

const ALL_MISMATCH_FIELDS = [
  ...VEHICLE_MISMATCH_FIELDS,
  ...OWNER_MISMATCH_FIELDS,
];

export const DataMismatchModal = ({
  vehicleData,
  ownerData,
  onSubmit,
  onClose,
  isSubmitting,
}) => {
  const [correctedValues, setCorrectedValues] = useState({});
  // ✅ Track which fields have been flagged (input revealed)
  const [flaggedFields, setFlaggedFields] = useState({});
  const [attachmentFile, setAttachmentFile] = useState({
    crAttachment: null,
    plateCertificationAttachment: null,
    actualPlateAttachment: null,
  });

  const handleChange = (key, value) => {
    setCorrectedValues((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ Toggle flagged state for a field
  const handleToggleFlag = (key) => {
    setFlaggedFields((prev) => {
      const isCurrentlyFlagged = !!prev[key];
      // If un-flagging, also clear the corrected value
      if (isCurrentlyFlagged) {
        setCorrectedValues((prevVals) => {
          const updated = { ...prevVals };
          delete updated[key];
          return updated;
        });
      }
      return { ...prev, [key]: !isCurrentlyFlagged };
    });
  };

  const handleSubmit = () => {
    const mismatches = ALL_MISMATCH_FIELDS.filter((f) =>
      correctedValues[f.key]?.trim(),
    ).map((f) => {
      const isOwnerField = OWNER_MISMATCH_FIELDS.some((of) => of.key === f.key);
      const sourceData = isOwnerField ? ownerData : vehicleData;
      return {
        field: f.key,
        label: f.label,
        actual: sourceData?.[f.dataKey] || "N/A",
        expected: correctedValues[f.key].trim(),
      };
    });

    if (mismatches.length === 0) return;

    onSubmit({
      crAttachment: JSON.stringify(mismatches),
      attachmentFile,
      vvsDetails: vehicleData,
      vvsOwnerDetails: ownerData,
    });
  };

  const filledCount = ALL_MISMATCH_FIELDS.filter((f) =>
    correctedValues[f.key]?.trim(),
  ).length;

  const renderFieldRow = (field, sourceData) => {
    const submittedValue = sourceData?.[field.dataKey] || "—";
    const isFlagged = !!flaggedFields[field.key];
    const hasCorrected = !!correctedValues[field.key]?.trim();

    return (
      <div
        key={field.key}
        className={`grid grid-cols-[1fr_1fr] border-b border-gray-100 transition-colors ${
          hasCorrected ? "bg-green-50/30" : isFlagged ? "bg-red-50/20" : ""
        }`}
      >
        {/* LTO Record column */}
        <div className="px-4 py-3 border-r border-gray-100 bg-red-50/20">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {field.label}
          </p>
          <p className="text-sm font-medium text-gray-800 break-words">
            {submittedValue}
          </p>
        </div>

        {/* On Hand Record column */}
        <div className="px-4 py-3 flex items-center gap-2">
          {isFlagged ? (
            // ✅ Show input + unflag button when flagged
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={correctedValues[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="Enter correct value…"
                autoFocus
                className={`flex-1 text-sm text-gray-900 bg-transparent border-b focus:outline-none placeholder-gray-300 transition-colors ${
                  hasCorrected
                    ? "border-green-400 text-green-800"
                    : "border-gray-300 focus:border-primary-400"
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
            // ✅ Show "Flag Mismatch" button when not flagged
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
  };

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
                Click "Flag Mismatch" on any field that doesn't match, then
                enter the correct value
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
            LTO Record
          </div>
          <div className="px-4 py-2 bg-green-50 text-xs font-semibold text-green-600 uppercase tracking-wide">
            On Hand Record
          </div>
        </div>

        {/* Fields */}
        <div className="overflow-y-auto flex-1">
          {/* Vehicle Section */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Car size={13} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Vehicle Details
            </span>
          </div>
          {VEHICLE_MISMATCH_FIELDS.map((field) =>
            renderFieldRow(field, vehicleData),
          )}

          {/* Owner Section */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <User size={13} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Owner Details
            </span>
          </div>
          {OWNER_MISMATCH_FIELDS.map((field) =>
            renderFieldRow(field, ownerData),
          )}

          {/* Vehicle Attachments */}
          <div className="px-6 py-5 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 mb-5">
              <Paperclip size={18} className="text-primary-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Vehicle Attachments
              </h3>
            </div>

            <div className="space-y-5">
              {[
                { label: "CR Attachment (Optional)", key: "crAttachment" },
                {
                  label: "Plate Certification Attachment (Optional)",
                  key: "plateCertificationAttachment",
                },
                {
                  label: "Actual Plate Attachment (Optional)",
                  key: "actualPlateAttachment",
                },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    {label}
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
                            [key]: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>
                    <span className="text-sm text-gray-500">
                      {attachmentFile?.[key]
                        ? attachmentFile[key].name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
