import { useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { FileUpload } from "../../../components/FileUpload";
import { getDocUploadConfig, getDocMockOcrData } from "../utils/newVehicleRegistrationUtils";

export const NewRegUploadCard = ({
  docType,
  documentData,
  onChange,
  preview,
  fileName,
  errors = {},
  disabled = false,
}) => {
  const config = getDocUploadConfig(docType);
  const fieldLabels = config?.fieldLabels || {};
  const fields = Object.keys(fieldLabels);

  const handleFile = (previewUrl, file) => {
    if (!file) {
      onChange(docType, null, null, getDocMockOcrData(docType));
      return;
    }
    const mockData = getDocMockOcrData(docType);
    onChange(docType, previewUrl, file?.name || "", mockData);
  };

  return (
    <Card className="p-5 border border-gray-200">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <Upload size={18} className="text-[#0059b5]" />
        <h3 className="text-base font-bold text-gray-900">{config?.label || docType}</h3>
      </div>
      <FileUpload
        label={`Upload ${config?.label || docType}`}
        accept="image/*,application/pdf"
        onFile={(previewUrl, file) => handleFile(previewUrl, file)}
        preview={preview}
        hint={fileName || "Upload document for auto-extraction"}
        disabled={disabled}
      />
      <p className="mt-2 text-[11px] text-gray-500">
        OCR accepts PDF and image uploads for automatic field extraction.
      </p>
      <div className="mt-4 space-y-3">
        <div className="pt-2 border-t border-gray-200">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Extracted Fields
          </p>
          <div className="space-y-3">
            {fields.map((key) => (
              <Input
                key={key}
                label={fieldLabels[key]}
                value={documentData?.[key] || ""}
                onChange={(e) => onChange(docType, null, null, { ...documentData, [key]: e.target.value.toUpperCase() })}
                placeholder="Auto-extracted"
                required={config?.expectedFields?.includes(key)}
                error={errors[key]}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
