import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { Shield, Search, CheckCircle, Car, User, ScanLine, FileText, Upload } from "lucide-react";
import { QrScannerModal } from "../../components/QrScannerModal";
import { FileUpload } from "../../components/FileUpload";
import api from "../../services/api";
import { useOcrForm, formatOcrHint, OCR_STATUS } from "../../hooks/useOcrForm";
import { MvcMecUploadCard } from "../clearance-request/components/FlowFormCards";
import { evaluateMvcMecValidation } from "../clearance-request/utils/clearanceRequestUtils";
import { useAlert } from "../../hooks/useAlert";

export const DciVerifyPage = () => {
  const [voucherCode, setVoucherCode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [vehicleData, setVehicleData] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [markedVerified, setMarkedVerified] = useState(false);
  
  
  const { error: showErrorAlert, success: showSuccessAlert } = useAlert();

  const {
    formData,
    ocrError,
    doc1File: mvccFile,
    doc2File: mecFile,
    handleMvccUpload,
    handleMecUpload,
    handleInputChange,
    doc1State,
    doc2State,
    resetForm,
    doc1Uploaded,
    doc2Uploaded,
  } = useOcrForm("mvcc");

  const isDocumentsComplete = !!(mvccFile && mecFile);

  const handleQrScan = (scannedVoucherCode) => {
    setVoucherCode(scannedVoucherCode);
    setError("");
    setVerified(false);
    setVehicleData(null);
    setMarkedVerified(false);
    setValidationErrors({});
    resetForm();
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
    setValidationErrors({});
    resetForm();

    api.get(`/certificate-requests/by-voucher/${code.trim()}`)
      .then((res) => {
        const data = res.data;
        setVehicleData({ ...(data.vehicleData || {}), verificationStatus: data.status });
        setVerified(true);
        setError("");
        
        if (data.status === "MVC_MEC_VALIDATED" || data.status === "CERTIFICATE_ISSUED") {
          setMarkedVerified(true);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "Transaction code not found or invalid";
        setError(msg);
        setVehicleData(null);
        setVerified(false);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  };

  const handleMarkVerified = () => {
    setIsVerifying(true);
    setValidationErrors({});
    const mvcPayload = {
      mvcNo: formData.mvccControlNo,
      issueDate: formData.mvccDateIssued,
      mvFileNo: formData.mvFileNo,
      engineNo: formData.engineNo,
      chassisNo: formData.chassisNo,
      plateNo: formData.plateNo,
      color: formData.color,
    };
    
    const mecPayload = {
      engineNoStencilled: formData.mecEngineNo,
      chassisNoStencilled: formData.mecChassisNo,
      plateNo: formData.mecPlateNo,
      color: formData.mecColor,
    };

    const validation = evaluateMvcMecValidation(mvcPayload, mecPayload, vehicleData);
    if (!validation.valid) {
      showErrorAlert("Error", "Data Mismatch Found");
      const errors = {};
      if (validation.mismatchedFields) {
        validation.mismatchedFields.forEach(f => {
          errors[f] = true;
        });
      }
      setValidationErrors(errors);
      setIsVerifying(false);
      return;
    }

    const payload = new FormData();
    if (mvccFile) payload.append("mvcc", mvccFile);
    if (mecFile) payload.append("mec", mecFile);
    payload.append("mvcData", JSON.stringify(mvcPayload));
    payload.append("mecData", JSON.stringify(mecPayload));
    const headers = { "Content-Type": "multipart/form-data" };

    api.post(`/certificate-requests/by-voucher/${voucherCode.trim()}/verify`, payload, { headers })
      .then(() => {
        setMarkedVerified(true);
        showSuccessAlert("Verification Complete", "Vehicle successfully verified by DCI.");
      })
      .catch((err) => {
        const msg = err.response?.data?.error || "Failed to mark as verified";
        setError(msg);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  };

  const handleReset = () => {
    setVoucherCode("");
    setVerified(false);
    setVehicleData(null);
    setError("");
    setMarkedVerified(false);
    resetForm();
    setActiveTab("vehicle");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          DCI Verification
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
          <Card className="p-5 mb-5 space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car size={18} className="text-primary-600" /> Vehicle Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Plate Number</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.plateNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">MV File Number</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.mvFileNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Engine Number</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.engineNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Chassis Number</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.chassisNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Make</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.make}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Series</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.series}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Year Model</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.yearModel}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Color</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.color}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 block mb-1">Owner Name</label>
                  <p className="text-sm font-medium text-gray-900">{vehicleData.ownerName}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Upload size={18} className="text-primary-600" /> Document Upload
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MvcMecUploadCard
                  title="MVCC (Motor Vehicle Clearance Certificate)"
                  uploadLabel="Upload MVCC"
                  onFile={handleMvccUpload}
                  preview={doc1Uploaded ? URL.createObjectURL(mvccFile) : null}
                  vehicleLabel="Vehicle Details (from MVCC)"
                  fields={[
                    { key: "mvccControlNo", label: "MVCC Number", value: formData.mvccControlNo || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mvccControlNo"], onChange: (e) => handleInputChange({ target: { name: "mvccControlNo", value: e.target.value } }) },
                    { key: "mvccDateIssued", label: "Issue Date", value: formData.mvccDateIssued || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mvccDateIssued"], onChange: (e) => handleInputChange({ target: { name: "mvccDateIssued", value: e.target.value } }) },
                    { key: "mvFileNo", label: "MV File Number", value: formData.mvFileNo || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mvFileNo"], onChange: (e) => handleInputChange({ target: { name: "mvFileNo", value: e.target.value } }) },
                    { key: "engineNo", label: "Engine Number", value: formData.engineNo || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["engineNo"], onChange: (e) => handleInputChange({ target: { name: "engineNo", value: e.target.value } }) },
                    { key: "chassisNo", label: "Chassis Number", value: formData.chassisNo || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["chassisNo"], onChange: (e) => handleInputChange({ target: { name: "chassisNo", value: e.target.value } }) },
                    { key: "plateNo", label: "Plate Number", value: formData.plateNo || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["plateNo"], onChange: (e) => handleInputChange({ target: { name: "plateNo", value: e.target.value } }) },
                    { key: "color", label: "Color", value: formData.color || (doc1State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["color"], onChange: (e) => handleInputChange({ target: { name: "color", value: e.target.value } }) },
                  ]}
                  uploadHint={formatOcrHint(doc1State)}
                />
                <MvcMecUploadCard
                  title="MEC (Macro Etching Certificate)"
                  uploadLabel="Upload MEC"
                  onFile={handleMecUpload}
                  preview={doc2Uploaded ? URL.createObjectURL(mecFile) : null}
                  vehicleLabel="Vehicle Details (from MEC)"
                  fields={[
                    { key: "mecEngineNo", label: "Engine Number", value: formData.mecEngineNo || (doc2State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mecEngineNo"], onChange: (e) => handleInputChange({ target: { name: "mecEngineNo", value: e.target.value } }) },
                    { key: "mecChassisNo", label: "Chassis Number", value: formData.mecChassisNo || (doc2State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mecChassisNo"], onChange: (e) => handleInputChange({ target: { name: "mecChassisNo", value: e.target.value } }) },
                    { key: "mecPlateNo", label: "Plate Number", value: formData.mecPlateNo || (doc2State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mecPlateNo"], onChange: (e) => handleInputChange({ target: { name: "mecPlateNo", value: e.target.value } }) },
                    { key: "mecColor", label: "Color", value: formData.mecColor || (doc2State.status === "extracting" ? "Extracting..." : ""), error: validationErrors["mecColor"], onChange: (e) => handleInputChange({ target: { name: "mecColor", value: e.target.value } }) },
                  ]}
                  uploadHint={formatOcrHint(doc2State)}
                />
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
              <div className="flex flex-col items-end">
                <Button onClick={handleMarkVerified} disabled={!isDocumentsComplete}>
                  <CheckCircle size={16} />
                  Mark as Verified
                </Button>
                {!isDocumentsComplete && (
                  <p className="text-xs text-red-500 mt-2 text-right">
                    Please upload MVCC and MEC and fill all fields.
                  </p>
                )}
              </div>
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
