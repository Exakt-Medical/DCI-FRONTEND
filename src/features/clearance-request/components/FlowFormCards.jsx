import { Upload } from "lucide-react";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { FileUpload } from "../../../components/FileUpload";

export const VehicleFields = ({ values, onChange, hideEngineAndChassis }) => {
  const handleMvFileChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15).toUpperCase();
    onChange("mvFileNumber", val);
  };

  const isInvalid = values.mvFileNumber && values.mvFileNumber.length !== 15;

  return (
    <div className="space-y-3">
      <Input
        label="MV File No."
        value={values.mvFileNumber || ""}
        onChange={handleMvFileChange}
        placeholder="Auto-extracted"
        required
        maxLength={15}
        error={isInvalid ? "MV number is 15 characters" : undefined}
      />
    <Input
      label="Plate No."
      value={values.plateNumber}
      onChange={(e) => onChange("plateNumber", e.target.value)}
      placeholder="Auto-extracted"
      required
    />
    {!hideEngineAndChassis && (
      <>
        <Input
          label="Engine No."
          value={values.engineNumber}
          onChange={(e) => onChange("engineNumber", e.target.value)}
          placeholder="Auto-extracted"
          required
        />
        <Input
          label="Chassis No."
          value={values.chassisNumber}
          onChange={(e) => onChange("chassisNumber", e.target.value)}
          placeholder="Auto-extracted"
          required
        />
      </>
    )}
  </div>
  );
};

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
  hideEngineAndChassis,
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
        <VehicleFields values={vehicleValues} onChange={onVehicleChange} hideEngineAndChassis={hideEngineAndChassis} />
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
          {...field}
        />
      ))}
    </div>
  </Card>
);
