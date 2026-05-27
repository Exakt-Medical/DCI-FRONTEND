import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";

export const VehicleSearchSection = ({ onVerify, isFetching, fetchError }) => {
  const [method, setMethod] = useState("mvPlate"); // "mvPlate" | "engineChassis"
  const [mvFileNo, setMvFileNo] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [engineNo, setEngineNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");

  const isMvPlate = method === "mvPlate";
  const isEngineChassis = method === "engineChassis";

  const canSubmit = isMvPlate
    ? mvFileNo.trim() && plateNo.trim()
    : engineNo.trim() && chassisNo.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || isFetching) return;

    onVerify({
      mvFileNo: isMvPlate ? mvFileNo.trim() : "",
      plateNo: isMvPlate ? plateNo.trim() : "",
      engineNo: isEngineChassis ? engineNo.trim() : "",
      chassisNo: isEngineChassis ? chassisNo.trim() : "",
    });
  };

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    // Clear all fields when switching method
    setMvFileNo("");
    setPlateNo("");
    setEngineNo("");
    setChassisNo("");
  };

  return (
    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <Search size={18} className="text-primary-600" />
        <h3 className="text-base font-bold text-gray-900">Vehicle Search</h3>
      </div>

      {/* Method toggle */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => handleMethodChange("mvPlate")}
          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
            isMvPlate
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
          }`}
        >
          MV File No. + Plate No.
        </button>
        <button
          type="button"
          onClick={() => handleMethodChange("engineChassis")}
          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
            isEngineChassis
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
          }`}
        >
          Engine No. + Chassis No.
        </button>
      </div>

      {/* Input fields — only show the selected pair */}
      <form onSubmit={handleSubmit}>
        {isMvPlate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                MV File No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mvFileNo}
                onChange={(e) => setMvFileNo(e.target.value)}
                placeholder="e.g. 13242500000003A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Plate No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={plateNo}
                onChange={(e) => setPlateNo(e.target.value)}
                placeholder="e.g. CEC2503"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {isEngineChassis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Engine No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={engineNo}
                onChange={(e) => setEngineNo(e.target.value)}
                placeholder="e.g. ENG-PMVIC-2025-09030003"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Chassis No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={chassisNo}
                onChange={(e) => setChassisNo(e.target.value)}
                placeholder="e.g. CHA-PMVIC-2025-09030003"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {fetchError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{fetchError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!canSubmit || isFetching}
          className="w-full"
        >
          {isFetching ? "Verifying..." : "Verify Vehicle"}
        </Button>
      </form>
    </Card>
  );
};
