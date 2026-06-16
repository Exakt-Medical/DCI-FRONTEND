import { Upload } from "lucide-react";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { FileUpload } from "../../../components/FileUpload";

const OR_FIELD_CONFIG = [
  { key: "plateNumber", label: "Plate Number", required: true },
  { key: "mvFileNumber", label: "MV File Number" },
  { key: "classification", label: "Classification" },
  { key: "vehicleType", label: "Vehicle Type" },
  { key: "fuelType", label: "Fuel Type" },
  { key: "yearModel", label: "Year Model" },
  { key: "color", label: "Color" },
  { key: "ownerName", label: "Owner Name", required: true },
];

const CR_FIELD_CONFIG = [
  { key: "plateNumber", label: "Plate Number", required: true },
  { key: "mvFileNumber", label: "MV File Number" },
  { key: "engineNumber", label: "Engine Number" },
  { key: "chassisNumber", label: "Chassis Number" },
  { key: "make", label: "Make" },
  { key: "series", label: "Series" },
  { key: "yearModel", label: "Year Model" },
  { key: "color", label: "Color" },
  { key: "ownerName", label: "Owner Name", required: true },
];

export const VehicleFields = ({ values, onChange, fieldSet = "cr" }) => (
  <div className="space-y-3">
    {(fieldSet === "or" ? OR_FIELD_CONFIG : CR_FIELD_CONFIG).map((field) => (
      <Input
        key={field.key}
        label={field.label}
        value={values[field.key] || ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder="Auto-extracted"
        required={true}
      />
    ))}
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Owner Address
        <span className="text-red-500 ml-1">*</span>
      </label>
      <textarea
        value={values.ownerAddress}
        onChange={(e) => onChange("ownerAddress", e.target.value)}
        placeholder="Auto-extracted"
        rows={3}
        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </div>
  </div>
);

export const VehicleDocumentUploadCard = ({
  title,
  uploadLabel,
  onFile,
  preview,
  uploadHint,
  numberLabel,
  numberValue,
  onNumberChange,
  numberPlaceholder,
  extraInputs,
  vehicleLabel,
  vehicleValues,
  vehicleFieldSet,
  onVehicleChange,
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
      <Input
        label={numberLabel}
        value={numberValue}
        onChange={onNumberChange}
        placeholder={numberPlaceholder}
        required={true}
      />
      {extraInputs}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {vehicleLabel}
        </p>
        <VehicleFields
          values={vehicleValues}
          onChange={onVehicleChange}
          fieldSet={vehicleFieldSet}
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
          onChange={field.onChange}
          placeholder={field.placeholder}
          required={true}
        />
      ))}
    </div>
  </Card>
);
