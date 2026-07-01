import { Upload } from "lucide-react";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { FileUpload } from "../../../components/FileUpload";
import { cn } from "../../../utils/cn";

const OR_FIELD_CONFIG = [
  { key: "plateNumber", label: "Plate Number", required: true },
  { key: "mvFileNumber", label: "MV File Number", required: true },
];

const CR_FIELD_CONFIG = [
  { key: "plateNumber", label: "Plate Number", required: true },
  { key: "mvFileNumber", label: "MV File Number", required: true },
  { key: "engineNumber", label: "Engine Number", required: true },
  { key: "chassisNumber", label: "Chassis Number", required: true },
];

export const VehicleFields = ({ values, onChange, fieldSet = "cr", errors = {} }) => (
  <div className="space-y-3">
    {(fieldSet === "or" ? OR_FIELD_CONFIG : CR_FIELD_CONFIG).map((field) => (
      <Input
        key={field.key}
        label={field.label}
        value={values[field.key] || ""}
        onChange={(e) => onChange(field.key, e.target.value.toUpperCase())}
        placeholder="Auto-extracted"
        required={true}
        error={errors[field.key]}
      />
    ))}
  </div>
);


export const VehicleDocumentUploadCard = ({
  title,
  uploadLabel,
  onFile,
  preview,
  uploadHint,
  vehicleLabel,
  vehicleValues,
  vehicleFieldSet,
  onVehicleChange,
  errors = {},
}) => (
  <Card className="p-5">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
      <Upload size={18} className="text-[#0059b5]" />
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
    </div>
    <FileUpload
      label={uploadLabel}
      accept="image/*,application/pdf"
      onFile={onFile}
      preview={preview}
      hint={uploadHint}
    />
    <p className="mt-2 text-[11px] text-gray-500">
      OCR accepts PDF and image uploads for automatic field extraction.
    </p>
    <div className="mt-4 space-y-3">
      <div className="pt-2 border-t border-gray-200">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {vehicleLabel}
        </p>
        <VehicleFields
          values={vehicleValues}
          onChange={onVehicleChange}
          fieldSet={vehicleFieldSet}
          errors={errors}
        />
      </div>
    </div>
  </Card>
);


export const MvcMecUploadCard = ({
  title,
  uploadLabel,
  onFile,
  preview,
  fields,
  uploadHint,
}) => (
  <Card className="p-5 border border-gray-200">
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
      <Upload size={18} className="text-[#0059b5]" />
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
    </div>
    <FileUpload
      label={uploadLabel}
      accept="image/*,application/pdf"
      onFile={onFile}
      preview={preview}
      hint={uploadHint}
    />
    <p className="mt-2 text-[11px] text-gray-500">
      OCR accepts PDF and image uploads for automatic field extraction.
    </p>
    <div className="mt-4 space-y-3">
      {fields.map((field) => (
        <Input
          key={field.key}
          label={field.label}
          value={field.value}
          onChange={(e) => {
            if (field.onChange) {
              field.onChange({ target: { value: e.target.value.toUpperCase() } });
            }
          }}
          placeholder={field.placeholder}
          required={true}
        />
      ))}
    </div>
  </Card>
);
