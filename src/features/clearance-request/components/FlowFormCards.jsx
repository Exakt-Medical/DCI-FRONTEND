import { Upload } from "lucide-react";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { FileUpload } from "../../../components/FileUpload";

export const VehicleFields = ({ values, onChange }) => (
  <div className="space-y-3">
    <Input
      label="Plate Number"
      value={values.plateNumber}
      onChange={(e) => onChange("plateNumber", e.target.value)}
      placeholder="Auto-extracted"
      required
    />
    <Input
      label="MV File Number"
      value={values.mvFileNumber}
      onChange={(e) => onChange("mvFileNumber", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Engine Number"
      value={values.engineNumber}
      onChange={(e) => onChange("engineNumber", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Chassis Number"
      value={values.chassisNumber}
      onChange={(e) => onChange("chassisNumber", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Make"
      value={values.make}
      onChange={(e) => onChange("make", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Series"
      value={values.series}
      onChange={(e) => onChange("series", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Year Model"
      value={values.yearModel}
      onChange={(e) => onChange("yearModel", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Color"
      value={values.color}
      onChange={(e) => onChange("color", e.target.value)}
      placeholder="Auto-extracted"
    />
    <Input
      label="Owner Name"
      value={values.ownerName}
      onChange={(e) => onChange("ownerName", e.target.value)}
      placeholder="Auto-extracted"
      required
    />
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        Owner Address
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
  numberLabel,
  numberValue,
  onNumberChange,
  numberPlaceholder,
  extraInputs,
  vehicleLabel,
  vehicleValues,
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
    />
    <div className="mt-4 space-y-3">
      <Input
        label={numberLabel}
        value={numberValue}
        onChange={onNumberChange}
        placeholder={numberPlaceholder}
      />
      {extraInputs}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {vehicleLabel}
        </p>
        <VehicleFields values={vehicleValues} onChange={onVehicleChange} />
      </div>
    </div>
  </Card>
);

export const MvcMecUploadCard = ({ title, uploadLabel, onFile, preview, fields }) => (
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
    />
    <div className="mt-4 space-y-3">
      {fields.map((field) => (
        <Input
          key={field.key}
          label={field.label}
          value={field.value}
          onChange={field.onChange}
          placeholder={field.placeholder}
        />
      ))}
    </div>
  </Card>
);
