import { Car } from "lucide-react";
import { Card } from "../../../../components/Card";

const vehicleSubTypes = [
  {
    id: "vehicleNotFound",
    label: "Vehicle Not Found",
    description: "Vehicle not found in LTO database",
  },
];

export const VehicleSection = ({
  formData,
  onChange,
}) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Car size={18} className="text-primary-500" />
        Vehicle Information
      </h3>

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
