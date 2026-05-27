import { Car } from "lucide-react";
import { Card } from "../../../../components/Card";

const vehicleSubTypes = [
  {
    id: "dataMismatch",
    label: "Data Mismatch",
    description: "Vehicle information doesn't match LTO records",
  },
  {
    id: "vehicleNotFound",
    label: "Vehicle Not Found",
    description: "Vehicle not found in LTO database",
  },
];

const mismatchedFieldOptions = [
  { value: "plateNo", label: "Plate Number" },
  { value: "mvFileNo", label: "MV File Number" },
  { value: "engineNo", label: "Engine Number" },
  { value: "chassisNo", label: "Chassis Number" },
  { value: "make", label: "Make" },
  { value: "model", label: "Model" },
  { value: "yearModel", label: "Year Model" },
  { value: "color", label: "Color" },
  { value: "multiple", label: "Multiple Fields" },
];

export const VehicleSection = ({
  formData,
  onChange,
  onVehicleSubTypeChange,
}) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Car size={18} className="text-primary-500" />
        Vehicle Information
      </h3>

      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 mb-2 block">
          Issue Type *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vehicleSubTypes.map((subType) => {
            const isSelected = formData.vehicleSubType === subType.id;
            return (
              <button
                key={subType.id}
                type="button"
                onClick={() => onVehicleSubTypeChange(subType.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${isSelected ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <p
                  className={`text-sm font-medium ${isSelected ? "text-primary-600" : "text-gray-900"}`}
                >
                  {subType.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {subType.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {formData.vehicleSubType === "dataMismatch" && (
        <div className="mb-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Which field has a mismatch? *
            </label>
            <select
              name="vehicleInfo.mismatchedField"
              value={formData.vehicleInfo.mismatchedField}
              onChange={onChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select field</option>
              {mismatchedFieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              What is the correct value?
            </label>
            <input
              type="text"
              name="vehicleInfo.correctValue"
              value={formData.vehicleInfo.correctValue}
              onChange={onChange}
              placeholder="Enter the correct value"
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {formData.vehicleSubType === "vehicleNotFound" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            The vehicle you're looking for was not found in the LTO database.
            Please provide the information you have below so we can investigate.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Plate No.</label>
          <input
            type="text"
            name="vehicleInfo.plateNo"
            value={formData.vehicleInfo.plateNo}
            onChange={onChange}
            placeholder="Enter plate number"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            MV File No.
          </label>
          <input
            type="text"
            name="vehicleInfo.mvFileNo"
            value={formData.vehicleInfo.mvFileNo}
            onChange={onChange}
            placeholder="Enter MV file number"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Make</label>
          <input
            type="text"
            name="vehicleInfo.make"
            value={formData.vehicleInfo.make}
            onChange={onChange}
            placeholder="Enter vehicle make"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Model</label>
          <input
            type="text"
            name="vehicleInfo.model"
            value={formData.vehicleInfo.model}
            onChange={onChange}
            placeholder="Enter vehicle model"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Engine No.
          </label>
          <input
            type="text"
            name="vehicleInfo.engineNo"
            value={formData.vehicleInfo.engineNo}
            onChange={onChange}
            placeholder="Enter engine number"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Chassis No.
          </label>
          <input
            type="text"
            name="vehicleInfo.chassisNo"
            value={formData.vehicleInfo.chassisNo}
            onChange={onChange}
            placeholder="Enter chassis number"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </Card>
  );
};
