import { useState } from "react";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { RefreshCw, Shield, AlertCircle } from "lucide-react";
import { VehicleSearchSection } from "./components/VehicleSearchSection";
import { VehicleInfoCard } from "./components/VehicleInfoCard";
import { OwnerInfoCard } from "./components/OwnerInfoCard";
import { VoucherRedemption } from "./components/VoucherRedemption";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";

// Helper to load from localStorage
const getPurchaseHistory = () => {
  const stored = localStorage.getItem("ctpl_purchase_history");
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

// Insurance fee mapping
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

// Initial state objects
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
  vehicle_category: "",
  vehicle_type: "",
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

export const VerificationPage = ({ onCertificate }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isRecordFound, setIsRecordFound] = useState(false);
  const [validatedVoucher, setValidatedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [ownerData, setOwnerData] = useState(initialOwnerData);
  const [insuranceData, setInsuranceData] = useState(initialInsuranceData);
  const [showFinalReview, setShowFinalReview] = useState(false);
  const { success, error, loading, close } = useAlert();

  // Auto-calculate total amount when any fee changes
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
      prescribedPremiumFee: fees.prescribedPremiumFee,
      dst: fees.dst,
      vat: fees.vat,
      lgt: fees.lgt,
      validationFee: fees.validationFee,
    };
    const total = calculateTotal(newData);
    setInsuranceData({ ...newData, totalAmount: total });
  };

  const updatePolicyNumber = (value) => {
    setInsuranceData({ ...insuranceData, policyNumber: value });
  };

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
        // Auto-populate insurance data from voucher
        const fees =
          insuranceFeeMap[voucher.insuranceCode] ||
          insuranceFeeMap["PRIVATE CARS (INCLUDING JEEPS AND AUVS)"];
        setInsuranceData({
          selectedCode: voucher.insuranceCode,
          policyNumber: voucher.policyNumber,
          premiumType: voucher.insuranceCode,
          prescribedPremiumFee: fees.prescribedPremiumFee,
          dst: fees.dst,
          vat: fees.vat,
          lgt: fees.lgt,
          validationFee: fees.validationFee,
          totalAmount: (
            parseFloat(fees.prescribedPremiumFee) +
            parseFloat(fees.dst) +
            parseFloat(fees.vat) +
            parseFloat(fees.lgt) +
            parseFloat(fees.validationFee)
          ).toFixed(2),
        });
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

  const handleVerify = async ({ mvFileNo, plateNo, engineNo, chassisNo }) => {
    setIsFetching(true);
    setFetchError(null);
    loading("Looking up vehicle...");

    try {
      const res = await verificationService.lookup({
        mvFileNo,
        plateNo,
        engineNo,
        chassisNo,
      });
      const data = res.data;
      close();

      if (!data.found) {
        setFetchError("No records found in VVS database.");
        setIsRecordFound(false);
        return;
      }

      setVehicleData({
        mv_file_number: data.mvFileNumber || "",
        plate_number: data.plateNumber || "",
        engine_number: data.engineNumber || "",
        chassis_number: data.chassisNumber || "",
        make: data.make || "",
        series: data.series || "",
        color: data.color || "",
        year_model: data.yearModel || "",
        body_type: data.bodyType || "",
      });

      setOwnerData({
        firstName: data.ownerFullName || "",
        lastName: "",
        middleName: "",
        address: "",
        contactNo: "",
        email: "",
        tin: "",
      });

      setIsRecordFound(true);
    } catch (err) {
      close();
      console.error(
        "Lookup error:",
        err.response?.status,
        err.response?.data,
        err.message,
      );

      setFetchError("Error fetching vehicle data. Please try again.");
      setIsRecordFound(false);
    } finally {
      setIsFetching(false);
    }
  };

  const handleResetForm = () => {
    setFetchError(null);
    setIsRecordFound(false);
    setValidatedVoucher(null);
    setVoucherError(null);
    setVehicleData(initialVehicleData);
    setOwnerData(initialOwnerData);
    setInsuranceData(initialInsuranceData);
  };

  const isFormComplete = () => {
    return isRecordFound && validatedVoucher !== null;
  };

  const handleSubmitForReview = () => {
    setShowFinalReview(true);
  };

  const handleGenerateCertificate = async () => {
    loading("Processing verification...");

    try {
      const res = await verificationService.verify({
        mvFileNumber: vehicleData.mv_file_number,
        plateNumber: vehicleData.plate_number,
        engineNumber: vehicleData.engine_number,
        chassisNumber: vehicleData.chassis_number,
        premiumType: insuranceData.premiumType,
      });

      const { certificateNo, verificationStatus, failureReason } = res.data;
      close();

      if (verificationStatus !== "VERIFIED") {
        await error(
          "Verification Failed",
          failureReason || "Vehicle details did not match.",
        );
        return;
      }

      // Mark voucher redeemed
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

      // Generate PDF in browser using jsPDF (auto-downloads)
      await generateCertificatePDF({
        vehicle: vehicleData,
        owner: ownerData,
        insurance: insuranceData,
        authNo: certificateNo, // use real certNo from backend as the auth code
      });

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
      await error("Error", "Verification failed. Please try again.");
    }
  };

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

      <VehicleSearchSection
        onVerify={handleVerify}
        isFetching={isFetching}
        fetchError={fetchError}
      />

      {isRecordFound && (
        <>
          <VehicleInfoCard vehicleData={vehicleData} />
          <OwnerInfoCard ownerData={ownerData} />
        </>
      )}

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

      <div className="flex justify-between gap-3">
        <Button
          variant="secondary"
          onClick={handleResetForm}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Reset Form
        </Button>
        <Button onClick={handleSubmitForReview} disabled={!isFormComplete()}>
          Submit for Final Review
        </Button>
      </div>

      {showFinalReview && (
        <FinalReviewModal
          vehicleData={vehicleData}
          ownerData={ownerData}
          insuranceData={insuranceData}
          validatedVoucher={validatedVoucher}
          onConfirm={handleGenerateCertificate}
          onClose={() => setShowFinalReview(false)}
        />
      )}
    </div>
  );
};
