// Updated VerificationPage.jsx
import { useState } from "react";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { RefreshCw, Shield, AlertCircle, Ticket } from "lucide-react";
import { VehicleSearchSection } from "./components/VehicleSearchSection";
import { VehicleInfoCard } from "./components/VehicleInfoCard";
import { OwnerInfoCard } from "./components/OwnerInfoCard";

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

export const VerificationPage = ({ onCertificate }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isRecordFound, setIsRecordFound] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [ownerData, setOwnerData] = useState(initialOwnerData);
  const [isGenerating, setIsGenerating] = useState(false);

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
        setVoucherCode("");
        setPolicyNumber("");
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
    setVoucherCode("");
    setPolicyNumber("");
    setVehicleData(initialVehicleData);
    setOwnerData(initialOwnerData);
  };

  const isFormComplete = () => {
    return (
      isRecordFound && voucherCode.trim() !== "" && policyNumber.trim() !== ""
    );
  };

  const handleSubmitAndGenerate = async () => {
    if (!isFormComplete()) return;

    setIsGenerating(true);

    // Use voucher code as the authentication number
    const authNo = voucherCode;

    const insuranceData = {
      policyNumber: policyNumber,
      voucherCode: voucherCode,
    };

    // Generate the certificate directly
    await generateCertificatePDF({
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

    setIsGenerating(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          LTO Vehicle Verification
        </h1>
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
            {/* Voucher Code Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Voucher Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Ticket
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                />
              </div>
            </div>

            {/* Policy Number Input */}
            <Input
              label="Policy Number"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="Enter Policy Number"
              required
            />
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
          <Button
            onClick={handleSubmitAndGenerate}
            disabled={!isFormComplete() || isGenerating}
          >
            {isGenerating ? "Generating Certificate..." : "Submit"}
          </Button>
          {isRecordFound && !voucherCode && (
            <p className="text-xs text-orange-500 mt-1">
              ⚠️ Please enter the voucher code
            </p>
          )}
          {isRecordFound && voucherCode && !policyNumber && (
            <p className="text-xs text-orange-500 mt-1">
              ⚠️ Please enter the policy number
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
