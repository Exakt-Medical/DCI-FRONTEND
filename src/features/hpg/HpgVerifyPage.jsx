import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { Shield, Search, CheckCircle, Car, User, ScanLine } from "lucide-react";
import { QrScannerModal } from "../../components/QrScannerModal";
import api from "../../services/api";

export const HpgVerifyPage = () => {
  const [voucherCode, setVoucherCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [error, setError] = useState("");
  const [markedVerified, setMarkedVerified] = useState(false);

  const handleQrScan = (scannedVoucherCode) => {
    setVoucherCode(scannedVoucherCode);
    setError("");
    setVerified(false);
    setVehicleData(null);
    setMarkedVerified(false);
    setIsScannerOpen(false);
    handleVerify(scannedVoucherCode);
  };

  const handleVerify = (codeToVerify) => {
    const code = typeof codeToVerify === "string" ? codeToVerify : voucherCode;
    if (!code.trim()) {
      setError("Please enter a transaction code");
      return;
    }
    setIsVerifying(true);
    setError("");
    setVerified(false);
    setVehicleData(null);
    setMarkedVerified(false);

    setTimeout(() => {
      try {
        const savedRequests = JSON.parse(localStorage.getItem('dci_mock_requests') || '[]');
        const request = savedRequests.find(r => r.voucherCode === code.trim() || r.voucherReferenceNo === code.trim());
        
        if (request) {
          const vehicle = request.orCr || request.crCr || request.vvsVehicleDetails || {};
          const mockDetails = {
            plateNumber: request.plateNumber || vehicle.plateNumber || "ABC1234",
            mvFileNumber: vehicle.mvFileNo || vehicle.mvFileNumber || "1301-00000012345",
            engineNumber: vehicle.engineNumber || "ENG123456789",
            chassisNumber: vehicle.chassisNumber || "CHAS123456789",
            make: vehicle.make || "TOYOTA",
            series: vehicle.series || "VIOS",
            yearModel: vehicle.yearModel || "2020",
            color: vehicle.color || "RED",
            ownerName: request.vvsOwnerName || vehicle.ownerName || "JUAN M DELA CRUZ",
            verificationStatus: request.status
          };
          setVehicleData(mockDetails);
          setVerified(true);
          setError("");
          if (request.status === "HPG_VERIFIED" || request.status === "MVC_MEC_VALIDATED" || request.status === "CERTIFICATE_ISSUED") {
            setMarkedVerified(true);
          }
        } else {
          // If voucher lookup is performed but not in local storage yet, return mock data
          const mockDetails = {
            plateNumber: "ABC1234",
            mvFileNumber: "1301-00000012345",
            engineNumber: "ENG123456789",
            chassisNumber: "CHAS123456789",
            make: "TOYOTA",
            series: "VIOS",
            yearModel: "2020",
            color: "RED",
            ownerName: "JUAN M DELA CRUZ",
            verificationStatus: "DOCUMENTS_VERIFIED"
          };
          setVehicleData(mockDetails);
          setVerified(true);
          setError("");
        }
      } catch (err) {
        setError("Error looking up transaction code");
      } finally {
        setIsVerifying(false);
      }
    }, 800);
  };

  const handleMarkVerified = () => {
    setIsVerifying(true);
    setError("");
    setTimeout(() => {
      try {
        const savedRequests = JSON.parse(localStorage.getItem('dci_mock_requests') || '[]');
        const reqIndex = savedRequests.findIndex(r => r.voucherCode === voucherCode.trim() || r.voucherReferenceNo === voucherCode.trim());
        if (reqIndex >= 0) {
          savedRequests[reqIndex] = {
            ...savedRequests[reqIndex],
            status: "HPG_VERIFIED",
            hpgVerified: true,
          };
          localStorage.setItem('dci_mock_requests', JSON.stringify(savedRequests));
        }
        setMarkedVerified(true);
      } catch (err) {
        setError("Failed to mark as verified");
      } finally {
        setIsVerifying(false);
      }
    }, 1000);
  };

  const handleReset = () => {
    setVoucherCode("");
    setVerified(false);
    setVehicleData(null);
    setError("");
    setMarkedVerified(false);
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
            Transaction Code Lookup
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
          <p className="text-xs text-red-500 mt-2">{error}</p>
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

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQrScan}
      />
    </div>
  );
};
