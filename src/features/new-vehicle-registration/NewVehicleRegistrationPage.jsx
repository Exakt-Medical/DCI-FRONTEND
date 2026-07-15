import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { FileText, Plus, Bike, Car } from "lucide-react";
import { VEHICLE_TYPE_LABELS } from "./utils/newVehicleRegistrationUtils";

const NEW_REG_STATUS_STYLES = {
  DOCUMENTS_UPLOADED: { bg: "bg-teal-100", text: "text-teal-700", label: "Documents Uploaded" },
  REGISTRATION_PAID: { bg: "bg-amber-100", text: "text-amber-700", label: "Paid" },
  VEHICLE_VERIFIED: { bg: "bg-sky-100", text: "text-sky-700", label: "Verified" },
  CERTIFICATE_ISSUED: { bg: "bg-green-100", text: "text-green-700", label: "Certificate Issued" },
};

export const NewVehicleRegistrationPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("dci_mock_requests") || "[]");
    setRequests(all.filter((r) => r.type === "NEW_REGISTRATION"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Vehicle Registrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage new motor vehicle registration requests.
          </p>
        </div>
        <Button onClick={() => navigate("/dci-access/new-vehicle-registration")}>
          <Plus size={16} className="mr-1" />
          New Registration
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">No Registration Requests</h3>
          <p className="text-sm text-gray-500 mb-6">
            Start by creating a new vehicle registration request.
          </p>
          <Button onClick={() => navigate("/dci-access/new-vehicle-registration")}>
            <Plus size={16} className="mr-1" />
            New Registration
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const statusStyle = NEW_REG_STATUS_STYLES[req.status] || { bg: "bg-gray-100", text: "text-gray-600", label: req.status };
            return (
              <Card key={req.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/dci-access/new-vehicle-registration?id=${req.id}&step=1`, { state: { request: req } })}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0059b5]/10 rounded-lg flex items-center justify-center">
                      {req.vehicleType === "MC" ? <Bike size={20} className="text-[#0059b5]" /> : <Car size={20} className="text-[#0059b5]" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {req.refNumber || req.id || "Unnamed"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ref: {req.refNumber} &middot; {VEHICLE_TYPE_LABELS[req.vehicleType] || req.vehicleType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                    {req.certificateNo && (
                      <span className="text-xs text-gray-500 font-mono">{req.certificateNo}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
