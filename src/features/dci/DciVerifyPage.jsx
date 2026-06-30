import { useState, useRef } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { Shield, Search, CheckCircle, Car, User, ScanLine, AlertTriangle, Paperclip, Upload, FileText } from "lucide-react";
import { HpgQrScannerModal } from "../hpg/HpgQrScannerModal";
import { ticketService } from "../../services/ticketService";
import { CreateTicketModal } from "../Tickets/CreateTicketModal";
import { MvcMecUploadCard } from "../clearance-request/components/FlowFormCards";

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

export const DciVerifyPage = () => {
  const [voucherCode, setVoucherCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [error, setError] = useState("");
  const [markedVerified, setMarkedVerified] = useState(false);


  // File Upload States
  const [mvccFile, setMvccFile] = useState(null);
  const [mecFile, setMecFile] = useState(null);
  const [mvccPreview, setMvccPreview] = useState(null);
  const [mecPreview, setMecPreview] = useState(null);

  const emptyMvc = {
    mvcNo: "",
    mvcIssueDate: "",
    engineNo: "",
    chassisNo: "",
    plateNo: "",
    mvFileNo: "",
    color: "",
  };

  const emptyMec = {
    engineNoStencilled: "",
    chassisNoStencilled: "",
    plateNo: "",
    color: "",
  };

  const [mvccData, setMvccData] = useState(emptyMvc);
  const [mecData, setMecData] = useState(emptyMec);

  const handleMvccUpload = (file) => {
    setMvccFile(file);
    if (!file) {
      setMvccPreview(null);
      setMvccData(emptyMvc);
      return;
    }
    
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setMvccPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setMvccPreview("PDF_PLACEHOLDER");
    }

    setMvccData((prev) => ({
      ...prev,
      mvcNo: "Extracting...",
      mvcIssueDate: "Extracting...",
      engineNo: "Extracting...",
      chassisNo: "Extracting...",
      plateNo: "Extracting...",
      mvFileNo: "Extracting...",
      color: "Extracting...",
    }));

    setTimeout(() => {
      setMvccData({
        mvcNo: "MVC-" + String(Date.now()).slice(-8),
        mvcIssueDate: new Date().toISOString().split("T")[0],
        engineNo: "ENG-987654",
        chassisNo: "CHA-123456",
        plateNo: vehicleData?.plateNumber || "ABC1234",
        mvFileNo: vehicleData?.mvFileNumber || "13242500000003A",
        color: vehicleData?.color || "WHITE",
      });
    }, 1500);
  };

  const handleMecUpload = (file) => {
    setMecFile(file);
    if (!file) {
      setMecPreview(null);
      setMecData(emptyMec);
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setMecPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setMecPreview("PDF_PLACEHOLDER");
    }

    setMecData((prev) => ({
      ...prev,
      engineNoStencilled: "Extracting...",
      chassisNoStencilled: "Extracting...",
      plateNo: "Extracting...",
      color: "Extracting...",
    }));

    setTimeout(() => {
      setMecData({
        engineNoStencilled: "ENG-987654",
        chassisNoStencilled: "CHA-123456",
        plateNo: vehicleData?.plateNumber || "ABC1234",
        color: vehicleData?.color || "WHITE",
      });
    }, 1500);
  };

  // Ticket Modal States
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketDetails, setTicketDetails] = useState("");
  const [ticketRequestor, setTicketRequestor] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // "details" | "upload"

  const handleQrScan = (scannedVoucherCode) => {
    setVoucherCode(scannedVoucherCode);
    setError("");
    setVerified(false);
    setVehicleData(null);
    setMarkedVerified(false);
    setIsScannerOpen(false);
    setActiveTab("details");
    setMvccFile(null);
    setMecFile(null);
    setMvccPreview(null);
    setMecPreview(null);
    setMvccData(emptyMvc);
    setMecData(emptyMec);
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
    setActiveTab("details");
    setMvccFile(null);
    setMecFile(null);
    setMvccPreview(null);
    setMecPreview(null);
    setMvccData(emptyMvc);
    setMecData(emptyMec);
  };

  const handleOpenTicketModal = () => {
    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const name = localStorage.getItem("username") || userObj?.username || "DCI Agent";
    setTicketRequestor(name);
    setTicketDetails(
      `Transaction Code "${voucherCode}" was verified but returned: database record not found.`
    );
    setShowTicketModal(true);
  };



  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          DCI Vehicle Verification
        </h1>
        <p className="text-sm text-gray-500">
          Verify vehicles and upload MVCC/MEC for clearance
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
          <div className="flex border-b border-gray-200 mb-5">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-[#0059b5] text-[#0059b5]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Vehicle Details
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "documents"
                  ? "border-[#0059b5] text-[#0059b5]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Document Upload
              {(!mvccFile || !mecFile) && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </button>
          </div>

          {activeTab === "details" && (
            <Card className="p-5 mb-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Car size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Vehicle Details
                </h3>
                <span className="text-xs text-green-600 ml-auto">
                  ? Found in system
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
          )}

          {activeTab === "documents" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <MvcMecUploadCard
                title="MVCC"
                uploadLabel="Upload Motor Vehicle Clearance"
                onFile={handleMvccUpload}
                preview={mvccPreview}
                disabled={markedVerified}
                fields={[
                  {
                    key: "dci-mvc-number",
                    label: "MVCC Number",
                    value: mvccData.mvcNo,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, mvcNo: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mvc-issue-date",
                    label: "Issue Date",
                    value: mvccData.mvcIssueDate,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, mvcIssueDate: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mvc-engine-number",
                    label: "Engine Number",
                    value: mvccData.engineNo,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, engineNo: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mvc-chassis-number",
                    label: "Chassis Number",
                    value: mvccData.chassisNo,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, chassisNo: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mvc-plate-number",
                    label: "Plate Number",
                    value: mvccData.plateNo,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, plateNo: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mvc-mvfile-number",
                    label: "MV File Number",
                    value: mvccData.mvFileNo,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, mvFileNo: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mvc-color",
                    label: "Color",
                    value: mvccData.color,
                    onChange: (e) => setMvccData((prev) => ({ ...prev, color: e.target.value })),
                    placeholder: "Auto-extracted from MVCC", readOnly: markedVerified,
                  },
                ]}
              />
              <MvcMecUploadCard
                title="MEC"
                uploadLabel="Upload Motor Vehicle Emission"
                onFile={handleMecUpload}
                preview={mecPreview}
                disabled={markedVerified}
                fields={[
                  {
                    key: "dci-mec-engine-stencilled",
                    label: "engine Number Stencilled",
                    value: mecData.engineNoStencilled,
                    onChange: (e) => setMecData((prev) => ({ ...prev, engineNoStencilled: e.target.value })),
                    placeholder: "Auto-extracted from MEC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mec-chassis-stencilled",
                    label: "chassis Number Stencilled",
                    value: mecData.chassisNoStencilled,
                    onChange: (e) => setMecData((prev) => ({ ...prev, chassisNoStencilled: e.target.value })),
                    placeholder: "Auto-extracted from MEC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mec-plate-number",
                    label: "Plate Number",
                    value: mecData.plateNo,
                    onChange: (e) => setMecData((prev) => ({ ...prev, plateNo: e.target.value })),
                    placeholder: "Auto-extracted from MEC", readOnly: markedVerified,
                  },
                  {
                    key: "dci-mec-color",
                    label: "color",
                    value: mecData.color,
                    onChange: (e) => setMecData((prev) => ({ ...prev, color: e.target.value })),
                    placeholder: "Auto-extracted from MEC", readOnly: markedVerified,
                  },
                ]}
              />
            </div>
          )}

          <div className="flex justify-between gap-3">
            <Button variant="secondary" onClick={handleReset}>
              Clear
            </Button>
            {markedVerified ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
                <CheckCircle size={16} />
                <span className="text-sm font-semibold">Marked as Verified</span>
              </div>
            ) : (
              <Button onClick={handleMarkVerified} disabled={!mvccFile || !mecFile || mvccData.mvcNo === "Extracting..." || mecData.engineNoStencilled === "Extracting..."}>
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
            roleBased: "DCI_USER",
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
          JSON.parse(localStorage.getItem("user") || "{}")?.email || "dci@dci.gov.ph"
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





