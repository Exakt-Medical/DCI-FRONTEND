import { useState } from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import { Search, AlertCircle } from "lucide-react";

export const VehicleSearchSection = ({ onVerify, isFetching, fetchError }) => {
  const [mvFileNo, setMvFileNo] = useState("");
  const [plateNo, setPlateNo] = useState("");
  const [engineNo, setEngineNo] = useState("");
  const [chassisNo, setChassisNo] = useState("");

  const hasSearchValue =
    mvFileNo.trim() || plateNo.trim() || engineNo.trim() || chassisNo.trim();

  const handleVerify = () => {
    onVerify({ mvFileNo, plateNo, engineNo, chassisNo });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Vehicle Lookup</h3>
        <span className="text-xs text-red-500">*All fields are required</span>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            value={mvFileNo}
            onChange={(e) => setMvFileNo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="MV File No."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
            required
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">
            *
          </span>
        </div>

        <div className="flex-1 relative">
          <input
            value={plateNo}
            onChange={(e) => setPlateNo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="Plate No."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
            required
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">
            *
          </span>
        </div>

        <div className="flex-1 relative">
          <input
            value={engineNo}
            onChange={(e) => setEngineNo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="Engine No."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
            required
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">
            *
          </span>
        </div>

        <div className="flex-1 relative">
          <input
            value={chassisNo}
            onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="Chassis No."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
            required
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">
            *
          </span>
        </div>

        <Button
          onClick={handleVerify}
          disabled={isFetching || !hasSearchValue}
          size="sm"
          className="whitespace-nowrap"
        >
          {isFetching ? <Spinner size="sm" /> : <Search size={12} />}
          <span className="ml-1 text-xs">Verify</span>
        </Button>
      </div>

      {fetchError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {fetchError}
        </p>
      )}
    </Card>
  );
};
