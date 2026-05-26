import { useState } from "react";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { RefreshCw, Shield, AlertCircle } from "lucide-react";
import { FinalReviewModal } from "./components/Finalreviewmodal";
import { VehicleSearchSection } from "./components/VehicleSearchSection";
import { VehicleInfoCard } from "./components/VehicleInfoCard";
import { OwnerInfoCard } from "./components/OwnerInfoCard";
import { VoucherRedemption } from "./components/VoucherRedemption";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getPurchaseHistory = () => {
  const stored = localStorage.getItem("ctpl_purchase_history");
  return stored ? JSON.parse(stored) : [];
};

const insuranceFeeMap = {
  "PRIVATE CARS (INCLUDING JEEPS AND AUVS)": {
    prescribedPremiumFee: "449.40",
    dst: "56.18",
    vat: "53.93",
    lgt: "0.90",
    validationFee: "80.40",
  },
  MOTORCYCLES: {
    prescribedPremiumFee: "287.00",
    dst: "35.88",
    vat: "34.44",
    lgt: "0.57",
    validationFee: "80.40",
  },
  "COMMERCIAL VEHICLES": {
    prescribedPremiumFee: "825.00",
    dst: "103.13",
    vat: "99.00",
    lgt: "1.65",
    validationFee: "80.40",
  },
  "HEAVY EQUIPMENT": {
    prescribedPremiumFee: "1250.00",
    dst: "156.25",
    vat: "150.00",
    lgt: "2.50",
    validationFee: "80.40",
  },
  "TAXI/PUBLIC UTILITY VEHICLES": {
    prescribedPremiumFee: "975.00",
    dst: "121.88",
    vat: "117.00",
    lgt: "1.95",
    validationFee: "80.40",
  },
};

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialVehicleData = {
  mv_file_number: "",
  plate_number: "",
  engine_number: "",
  chassis_number: "",
  make: "",
  series: "",
  color: "",
  year_model: "",
  classification: "",
  body_type: "",
  denomination: "",
  last_registration_date: "",
};

const initialOwnerData = {
  firstName: "",
  lastName: "",
  middleName: "",
  address: "",
  contactNo: "",
  email: "",
  tin: "",
};

const initialInsuranceData = {
  selectedCode: "",
  policyNumber: "",
  premiumType: "",
  prescribedPremiumFee: "",
  dst: "",
  vat: "",
  lgt: "",
  validationFee: "",
  totalAmount: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VerificationPage = ({ onCertificate }) => {
  // --- Step 1: verify state ---
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isRecordFound, setIsRecordFound] = useState(false);

  // verificationId returned by /verify — needed to call /confirm later
  const [verificationId, setVerificationId] = useState(null);

  // --- Step 2: voucher state ---
  const [validatedVoucher, setValidatedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // --- Data state ---
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [ownerData, setOwnerData] = useState(initialOwnerData);
  const [insuranceData, setInsuranceData] = useState(initialInsuranceData);

  // --- Step 3: final review + confirm state ---
  const [showFinalReview, setShowFinalReview] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const { success, error, loading, close } = useAlert();

  // ---------------------------------------------------------------------------
  // Insurance helpers
  // ---------------------------------------------------------------------------

  const calculateTotal = (data) => {
    const prescribed = parseFloat(data.prescribedPremiumFee) || 0;
    const dstVal = parseFloat(data.dst) || 0;
    const vatVal = parseFloat(data.vat) || 0;
    const lgtVal = parseFloat(data.lgt) || 0;
    const validation = parseFloat(data.validationFee) || 0;
    return (prescribed + dstVal + vatVal + lgtVal + validation).toFixed(2);
  };

  const handleInsuranceCodeChange = (code) => {
    const fees = insuranceFeeMap[code] || {
      prescribedPremiumFee: "",
      dst: "",
      vat: "",
      lgt: "",
      validationFee: "",
    };
    const newData = {
      ...insuranceData,
      selectedCode: code,
      premiumType: code,
      ...fees,
    };
    setInsuranceData({ ...newData, totalAmount: calculateTotal(newData) });
  };

  const updatePolicyNumber = (value) => {
    setInsuranceData({ ...insuranceData, policyNumber: value });
  };

  // ---------------------------------------------------------------------------
  // STEP 1 — Verify: call POST /api/v1/vvip/verify
  // On success: save verificationId + populate vehicle/owner details
  // On failure: show fetchError
  // ---------------------------------------------------------------------------

  const handleVerify = async ({ mvFileNo, plateNo, engineNo, chassisNo }) => {
    setIsFetching(true);
    setFetchError(null);
    setIsRecordFound(false);
    setVerificationId(null);
    loading("Verifying vehicle...");

    try {
      const res = await verificationService.verify({
        mvFileNumber: mvFileNo,
        plateNumber: plateNo,
        engineNumber: engineNo,
        chassisNumber: chassisNo,
      });
      const data = res.data;
      close();

      // FAILED or ERROR from backend
      if (data.verificationStatus !== "VERIFIED") {
        setFetchError(
          data.failureReason || "No matching vehicle record found.",
        );
        setIsRecordFound(false);
        return;
      }

      // Save verificationId — required for confirm step
      setVerificationId(data.verificationId);

      // Populate vehicle details from VVS response
      setVehicleData({
        mv_file_number: data.mvFileNo || "",
        plate_number: data.plateNumber || "",
        engine_number: data.engineNumber || "",
        chassis_number: data.chassisNumber || "",
        make: data.make || "",
        series: data.series || "",
        color: data.color || "",
        year_model: data.yearModel || "",
        classification: data.classification || "",
        body_type: data.bodyType || "",
        denomination: data.denomination || "",
        last_registration_date: data.lastRegistrationDate || "",
      });

      // Populate owner details — now separate fields, not one full name
      setOwnerData({
        firstName: data.ownerFirstName || "",
        lastName: data.ownerLastName || "",
        middleName: data.ownerMiddleName || "",
        address: data.ownerAddress || "",
        contactNo: "",
        email: "",
        tin: "",
      });

      setIsRecordFound(true);
    } catch (err) {
      close();
      console.error(
        "Verify error:",
        err.response?.status,
        err.response?.data,
        err.message,
      );
      setFetchError("Error verifying vehicle. Please try again.");
      setIsRecordFound(false);
    } finally {
      setIsFetching(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 — Voucher validation (frontend only, no backend call)
  // Valid voucher → enables Final Review button
  // Invalid voucher → shows error, button stays disabled
  // ---------------------------------------------------------------------------

  const validateVoucher = (voucherCode) => {
    if (!voucherCode.trim()) {
      setVoucherError("Please enter a voucher code");
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    setTimeout(() => {
      const purchaseHistory = getPurchaseHistory();
      const voucher = purchaseHistory.find(
        (v) =>
          v.voucherCode === voucherCode.toUpperCase() &&
          v.status === "Active" &&
          new Date(v.expirationDate) > new Date(),
      );

      if (voucher) {
        setValidatedVoucher(voucher);
        // Auto-populate insurance fees from voucher's insurance code
        const fees =
          insuranceFeeMap[voucher.insuranceCode] ||
          insuranceFeeMap["PRIVATE CARS (INCLUDING JEEPS AND AUVS)"];
        const newData = {
          selectedCode: voucher.insuranceCode,
          policyNumber: voucher.policyNumber,
          premiumType: voucher.insuranceCode,
          ...fees,
        };
        setInsuranceData({ ...newData, totalAmount: calculateTotal(newData) });
        setVoucherError(null);
      } else {
        setValidatedVoucher(null);
        setVoucherError(
          "Invalid or expired voucher code. Please check and try again.",
        );
      }

      setIsValidatingVoucher(false);
    }, 800);
  };

  // ---------------------------------------------------------------------------
  // STEP 3 — Confirm: call POST /api/v1/vvip/{verificationId}/confirm
  // On COMPLETED: mark voucher redeemed, generate PDF, show certificate no.
  // On ERROR: show submission error
  // ---------------------------------------------------------------------------

  const handleGenerateCertificate = async () => {
    if (!verificationId) {
      await error(
        "Error",
        "Verification ID missing. Please verify the vehicle again.",
      );
      return;
    }

    setIsConfirming(true);
    loading("Submitting final review...");

    try {
      const res = await verificationService.confirm(verificationId);
      const data = res.data;
      close();

      // ConfirmRequest failed on VVS side
      if (data.verificationStatus !== "COMPLETED") {
        await error(
          "Submission Failed",
          data.failureReason || "ConfirmRequest failed. Please try again.",
        );
        return;
      }

      const { certificateNo } = data;

      // Mark voucher as redeemed in localStorage
      if (validatedVoucher) {
        const purchaseHistory = getPurchaseHistory();
        const updated = purchaseHistory.map((v) =>
          v.voucherCode === validatedVoucher.voucherCode
            ? {
                ...v,
                status: "Redeemed",
                redeemedOn: new Date().toLocaleDateString(),
              }
            : v,
        );
        localStorage.setItem("ctpl_purchase_history", JSON.stringify(updated));
      }

      setShowFinalReview(false);

      // Generate and auto-download the PDF certificate
      await generateCertificatePDF({
        vehicle: vehicleData,
        owner: ownerData,
        insurance: insuranceData,
        authNo: certificateNo,
      });

      // Notify parent with certificate data
      onCertificate({
        vehicle: vehicleData,
        owner: ownerData,
        insurance: insuranceData,
        authNo: certificateNo,
      });

      await success(
        "Certificate Issued!",
        `Certificate No: ${certificateNo} has been downloaded.`,
      );
    } catch (err) {
      close();
      console.error(
        "Confirm error:",
        err.response?.status,
        err.response?.data,
        err.message,
      );
      await error(
        "Submission Error",
        "Failed to submit final review. Please try again.",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const handleResetForm = () => {
    setFetchError(null);
    setIsRecordFound(false);
    setVerificationId(null);
    setValidatedVoucher(null);
    setVoucherError(null);
    setVehicleData(initialVehicleData);
    setOwnerData(initialOwnerData);
    setInsuranceData(initialInsuranceData);
    setShowFinalReview(false);
  };

  // Final Review button enabled only when vehicle is verified AND voucher is valid
  const isFormComplete = () => isRecordFound && validatedVoucher !== null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          LTO Vehicle Verification
        </h1>
        <p className="text-sm text-gray-500">
          Search LTO database using any vehicle identifier
        </p>
      </div>

      {/* STEP 1 — Search + verify */}
      <VehicleSearchSection
        onVerify={handleVerify}
        isFetching={isFetching}
        fetchError={fetchError}
      />

      {/* STEP 1 result — vehicle + owner details */}
      {isRecordFound && (
        <>
          <VehicleInfoCard vehicleData={vehicleData} />
          <OwnerInfoCard ownerData={ownerData} />
        </>
      )}

      {/* STEP 2 — Voucher / insurance validation */}
      <Card className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <Shield size={18} className="text-primary-600" />
          <h3 className="text-base font-bold text-gray-900">
            Insurance Information
          </h3>
          <span className="text-xs text-gray-400 ml-auto">Required fields</span>
        </div>

        {!isRecordFound ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <AlertCircle size={20} className="text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-700">
              Please verify a vehicle from LTO database first to enable
              insurance details
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <VoucherRedemption
              onValidate={validateVoucher}
              validatedVoucher={validatedVoucher}
              voucherError={voucherError}
              isValidating={isValidatingVoucher}
              onReset={() => {
                setValidatedVoucher(null);
                setInsuranceData(initialInsuranceData);
              }}
            />

            {validatedVoucher && (
              <InsuranceFormSection
                insuranceData={insuranceData}
                onInsuranceCodeChange={handleInsuranceCodeChange}
                onPolicyNumberChange={updatePolicyNumber}
                disabled={validatedVoucher !== null}
              />
            )}
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex justify-between gap-3">
        <Button
          variant="secondary"
          onClick={handleResetForm}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Reset Form
        </Button>
        <Button
          onClick={() => setShowFinalReview(true)}
          disabled={!isFormComplete()}
        >
          Submit for Final Review
        </Button>
      </div>

      {/* STEP 3 — Final review modal → confirm → certificate */}
      {showFinalReview && (
        <FinalReviewModal
          vehicleData={vehicleData}
          ownerData={ownerData}
          insuranceData={insuranceData}
          validatedVoucher={validatedVoucher}
          isConfirming={isConfirming}
          onConfirm={handleGenerateCertificate}
          onClose={() => setShowFinalReview(false)}
        />
      )}
    </div>
  );
};
