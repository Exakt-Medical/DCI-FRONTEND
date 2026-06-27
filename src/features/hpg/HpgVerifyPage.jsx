import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { Shield, Search, CheckCircle, Car, User, ScanLine, AlertTriangle, Paperclip } from "lucide-react";
import { HpgQrScannerModal } from "./HpgQrScannerModal";
import { ticketService } from "../../services/ticketService";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";

const MOCK_VEHICLE_DATA = {
  plateNumber: "ABC1234",
  ownerName: "Juan Dela Cruz",
  make: "TOYOTA",
  series: "VIOS",
  yearModel: "2020",
  color: "WHITE",
  mvFileNumber: "13242500000003A",
  engineNumber: "ENG-123456",
  chassisNumber: "CHA-789012",
  encumberedTo: "BDO Unibank, Inc.",
};

export const HpgVerifyPage = () => {
  const [voucherCode, setVoucherCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [error, setError] = useState("");
  const [markedVerified, setMarkedVerified] = useState(false);

  // Ticket Modal States
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketDetails, setTicketDetails] = useState("");
  const [ticketRequestor, setTicketRequestor] = useState("");

  const handleQrScan = (scannedVoucherCode) => {
    setVoucherCode(scannedVoucherCode);
    setError("");
    setVerified(false);
    setVehicleData(null);
    setMarkedVerified(false);
    setIsScannerOpen(false);
  };

  const handleVerify = () => {
    if (!voucherCode.trim()) {
      setError("Please enter a transaction code");
      return;
    }
    setIsVerifying(true);
    setError("");

    setTimeout(() => {
      setIsVerifying(false);
      if (voucherCode.toUpperCase().startsWith("VCH")) {
        setVehicleData(MOCK_VEHICLE_DATA);
        setVerified(true);
        setError("");
      } else {
        setError("Transaction Code not found or invalid");
        setVehicleData(null);
        setVerified(false);
      }
    }, 1500);
  };

  const handleMarkVerified = () => {
    setMarkedVerified(true);
  };

  const handleReset = () => {
    setVoucherCode("");
    setVerified(false);
    setVehicleData(null);
    setError("");
    setMarkedVerified(false);
  };

  const handleOpenTicketModal = () => {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const name = localStorage.getItem("username") || userObj?.username || "HPG Agent";
    setTicketRequestor(name);
    setTicketDetails(
      `Transaction Code "${voucherCode}" was verified but returned: HPG database record not found.`
    );
    setShowTicketModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          HPG Vehicle Verification
        </h1>
        <p className="text-sm text-gray-500">
          Verify vehicles using transaction codes for DCI clearance
        </p>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Shield size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">
            Transaction Lookup
          </h3>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Transaction Code"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Enter transaction code (e.g., VCH-XXXXXX)"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsScannerOpen(true)}
            disabled={isVerifying}
          >
            <ScanLine size={16} />
            Scan QR
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !voucherCode.trim()}
          >
            {isVerifying ? <Spinner size="sm" /> : <Search size={16} />}
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-500 mt-1">If this persists, you can file a support ticket to verify the records manually.</p>
            </div>
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleOpenTicketModal}>
              Submit Ticket
            </Button>
          </div>
        )}
      </Card>

      {verified && vehicleData && (
        <>
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <Car size={18} className="text-[#0059b5]" />
              <h3 className="text-base font-bold text-gray-900">
                Vehicle Details
              </h3>
              <span className="text-xs text-green-600 ml-auto">
                ✓ Found in system
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Plate Number
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.plateNumber}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  MV File Number
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.mvFileNumber}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Engine Number
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.engineNumber}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Chassis Number
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.chassisNumber}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Make
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.make}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Series
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.series}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Year Model
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.yearModel}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Color
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.color}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Encumbered To
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.encumberedTo || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <User size={18} className="text-[#0059b5]" />
              <h3 className="text-base font-bold text-gray-900">
                Owner Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Owner Name
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {vehicleData.ownerName}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={handleReset}>
              Clear
            </Button>
            {markedVerified ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                <CheckCircle size={16} />
                <span className="text-sm font-semibold">Marked as Verified</span>
              </div>
            ) : (
              <Button onClick={handleMarkVerified}>
                <CheckCircle size={16} />
                Mark as Verified
              </Button>
            )}
          </div>
        </>
      )}

      {/* Render shared CreateTicketModal */}
      <CreateTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSubmit={async (ticketOnlyData) => {
          const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
          const randPart = Math.floor(1000 + Math.random() * 9000);
          const referenceNumber = `REF-${datePart}-${randPart}`;
          
          const payload = {
            referenceNumber,
            type: "Transaction Code Not Found",
            status: "PENDING",
            requestedBy: `${ticketOnlyData.requestedBy?.name} (${ticketOnlyData.requestedBy?.email})`,
            escalated: "YES",
            roleBased: "HPG",
            dateRequested: new Date().toISOString(),
            dateUpdated: new Date().toISOString(),
            address: ticketOnlyData.description,
          };
          
          await ticketService.create(payload);
          alert(`Success! Support ticket ${referenceNumber} has been submitted.`);
          return { referenceNumber };
        }}
        initialRequestedByName={ticketRequestor}
        initialRequestedByEmail={
          JSON.parse(localStorage.getItem("user") || "{}")?.email || ""
        }
        initialConcernType="other"
        initialOtherCategory="voucher"
        initialDescription={ticketDetails}
        initialOtherDetails={ticketDetails}
      />

      <HpgQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQrScan}
      />
    </div>
  );
};
