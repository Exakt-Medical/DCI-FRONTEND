import { useState } from "react";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { RefreshCw, Shield, AlertCircle } from "lucide-react";
import { VehicleSearchSection } from "./components/VehicleSearchSection";
import { VehicleInfoCard } from "./components/VehicleInfoCard";
import { OwnerInfoCard } from "./components/OwnerInfoCard";
import { VoucherRedemption } from "./components/VoucherRedemption";
import { InsuranceFormSection } from "./components/InsuranceFormSection";
import { FinalReviewModal } from "./components/FinalReviewModal";
import { MOCK_ASSIGNED_VOUCHERS } from "../../constants/mockData";

const fetchFromLTO = async (searchField, searchValue) => {
  await new Promise((r) => setTimeout(r, 1500));

  const mockData = {
    mv_file_number: "MV-2019-00456789",
    plate_number: "ABC 1234",
    engine_number: "4K-E123456",
    chassis_number: "JTDBE33K7Y0123456",
    make: "Toyota",
    series: "Vios 1.3 E",
    color: "Pearl White",
    year_model: "2019",
    classification: "Private",
    body_type: "Sedan",
    vehicle_category: "Passenger Car",
    vehicle_type: "Sedan",
    last_registration_date: "December 31, 2024",
    owner_firstName: "Juan",
    owner_lastName: "Dela Cruz",
    owner_middleName: "Santos",
    owner_address: "123 Rizal St, San Juan, Metro Manila",
    owner_contactNo: "09171234567",
    owner_email: "juan.delacruz@email.com",
    owner_tin: "123-456-789-000",
  };

  if (searchValue.toUpperCase().includes("NOTFOUND")) {
    return null;
  }

  return mockData;
};

// Helper to load from localStorage
const getPurchaseHistory = () => {
  const stored = localStorage.getItem("ctpl_purchase_history");
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

// Helper to save to localStorage
const savePurchaseHistory = (history) => {
  localStorage.setItem("ctpl_purchase_history", JSON.stringify(history));
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
  const [isRedeeming, setIsRedeeming] = useState(false); // ADDED
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [ownerData, setOwnerData] = useState(initialOwnerData);
  const [insuranceData, setInsuranceData] = useState(initialInsuranceData);
  const [showFinalReview, setShowFinalReview] = useState(false);

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

        const totalAmount = (
          parseFloat(fees.prescribedPremiumFee) +
          parseFloat(fees.dst) +
          parseFloat(fees.vat) +
          parseFloat(fees.lgt) +
          parseFloat(fees.validationFee)
        ).toFixed(2);

        setInsuranceData({
          selectedCode:
            voucher.insuranceCode || "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
          policyNumber: voucher.policyNumber,
          premiumType:
            voucher.insuranceCode || "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
          prescribedPremiumFee: fees.prescribedPremiumFee,
          dst: fees.dst,
          vat: fees.vat,
          lgt: fees.lgt,
          validationFee: fees.validationFee,
          totalAmount: totalAmount,
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

  const handleRedeemVoucher = async (voucher) => {
    setIsRedeeming(true);

    // Simulate API call for redemption
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const redeemedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Get the insurance code from the voucher
    const insuranceCode =
      voucher.insuranceCode || "PRIVATE CARS (INCLUDING JEEPS AND AUVS)";

    // Get the fees for this insurance code
    const fees =
      insuranceFeeMap[insuranceCode] ||
      insuranceFeeMap["PRIVATE CARS (INCLUDING JEEPS AND AUVS)"];

    // Calculate total amount
    const totalAmount = (
      parseFloat(fees.prescribedPremiumFee) +
      parseFloat(fees.dst) +
      parseFloat(fees.vat) +
      parseFloat(fees.lgt) +
      parseFloat(fees.validationFee)
    ).toFixed(2);

    // UPDATE INSURANCE DATA with the voucher information
    setInsuranceData({
      selectedCode: insuranceCode,
      policyNumber:
        voucher.policyNumber || `POL-${voucher.voucherCode.slice(-8)}`,
      premiumType: insuranceCode,
      prescribedPremiumFee: fees.prescribedPremiumFee,
      dst: fees.dst,
      vat: fees.vat,
      lgt: fees.lgt,
      validationFee: fees.validationFee,
      totalAmount: totalAmount,
    });

    // Mark voucher as redeemed in localStorage
    const purchaseHistory = getPurchaseHistory();
    const updatedHistory = purchaseHistory.map((v) =>
      v.voucherCode === voucher.voucherCode
        ? {
            ...v,
            status: "Redeemed",
            redeemedOn: redeemedDate,
            redeemedVehicle: {
              plateNumber: vehicleData.plate_number,
              mvFileNo: vehicleData.mv_file_number,
              owner: `${ownerData.firstName} ${ownerData.lastName}`,
            },
          }
        : v,
    );
    savePurchaseHistory(updatedHistory);

    // Update the validated voucher status
    setValidatedVoucher({
      ...voucher,
      status: "Redeemed",
      redeemedOn: redeemedDate,
    });

    setIsRedeeming(false);
    alert(
      `Voucher ${voucher.voucherCode} has been successfully redeemed for vehicle ${vehicleData.plate_number}!`,
    );
  };

  const handleVerify = async ({ mvFileNo, plateNo, engineNo, chassisNo }) => {
    let searchField = null;
    let searchValue = null;

    if (mvFileNo.trim()) {
      searchField = "mv_file_number";
      searchValue = mvFileNo;
    } else if (plateNo.trim()) {
      searchField = "plate_number";
      searchValue = plateNo;
    } else if (engineNo.trim()) {
      searchField = "engine_number";
      searchValue = engineNo;
    } else if (chassisNo.trim()) {
      searchField = "chassis_number";
      searchValue = chassisNo;
    } else {
      setFetchError("Please enter at least one vehicle identifier to search");
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      const data = await fetchFromLTO(searchField, searchValue);

      if (data) {
        setVehicleData({
          mv_file_number: data.mv_file_number || "",
          plate_number: data.plate_number || "",
          engine_number: data.engine_number || "",
          chassis_number: data.chassis_number || "",
          make: data.make || "",
          series: data.series || "",
          color: data.color || "",
          year_model: data.year_model || "",
          classification: data.classification || "",
          body_type: data.body_type || "",
          vehicle_category: data.vehicle_category || "",
          vehicle_type: data.vehicle_type || "",
          last_registration_date: data.last_registration_date || "",
        });

        setOwnerData({
          firstName: data.owner_firstName || "",
          lastName: data.owner_lastName || "",
          middleName: data.owner_middleName || "",
          address: data.owner_address || "",
          contactNo: data.owner_contactNo || "",
          email: data.owner_email || "",
          tin: data.owner_tin || "",
        });

        setIsRecordFound(true);
        setFetchError(null);
      } else {
        setIsRecordFound(false);
        setFetchError(
          "No records found in LTO database. Vehicle does not exist or is invalid.",
        );
        setVehicleData(initialVehicleData);
        setOwnerData(initialOwnerData);
        setInsuranceData(initialInsuranceData);
      }
    } catch (error) {
      setFetchError("Error fetching data from LTO. Please try again.");
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

  // UPDATED: Require voucher to be redeemed
  const isFormComplete = () => {
    return (
      isRecordFound &&
      validatedVoucher !== null &&
      validatedVoucher.status === "Redeemed"
    );
  };

  const handleSubmitForReview = () => {
    setShowFinalReview(true);
  };

  const handleGenerateCertificate = (authNo) => {
    setShowFinalReview(false);
    generateCertificatePDF({
      vehicle: vehicleData,
      owner: ownerData,
      insurance: insuranceData,
      authNo,
    });
    onCertificate({
      vehicle: vehicleData,
      owner: ownerData,
      insurance: insuranceData,
      authNo,
    });
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
              onRedeem={handleRedeemVoucher}
              validatedVoucher={validatedVoucher}
              voucherError={voucherError}
              isValidating={isValidatingVoucher}
              isRedeeming={isRedeeming}
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
                isRedeemed={validatedVoucher?.status === "Redeemed"}
                redeemedDate={validatedVoucher?.redeemedOn}
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
        <div className="flex flex-col items-end">
          <Button onClick={handleSubmitForReview} disabled={!isFormComplete()}>
            Submit for Final Review
          </Button>
          {validatedVoucher && validatedVoucher.status !== "Redeemed" && (
            <p className="text-xs text-orange-500 mt-1">
              ⚠️ Please redeem the voucher first before submitting
            </p>
          )}
        </div>
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
