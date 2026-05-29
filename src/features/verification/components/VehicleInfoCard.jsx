import { Card } from "../../../components/Card";
import { Car } from "lucide-react";

export const VehicleInfoCard = ({ vehicleData }) => {
  const fields = [
    { label: "MV File No.", key: "mv_file_number" },
    { label: "Plate No.", key: "plate_number" },
    { label: "Engine No.", key: "engine_number" },
    { label: "Chassis No.", key: "chassis_number" },
    { label: "Make", key: "make" },
    { label: "Series", key: "series" },
    { label: "Color", key: "color" },
    { label: "Year Model", key: "year_model" },
    { label: "Classification", key: "classification" },
    { label: "Body Type", key: "body_type" },
    { label: "Vehicle Type/Denomination", key: "denomination" },
    { label: "Last Registration Date", key: "last_registration_date" },
  ];

  return (
    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <Car size={18} className="text-primary-600" />
        <h3 className="text-base font-bold text-gray-900">
          Vehicle Information
        </h3>
        <span className="text-xs text-green-600 ml-auto">
          ✓ Verified from LTO Database
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="bg-gray-50 rounded-lg p-3">
            <label className="text-xs text-gray-500 block mb-1">
              {field.label}
            </label>
            <p className="text-sm font-medium text-gray-900">
              {vehicleData[field.key] || "—"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};
