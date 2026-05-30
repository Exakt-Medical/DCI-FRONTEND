import { useState } from "react";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import {
  RefreshCw,
  Shield,
  AlertCircle,
  Ticket,
  Paperclip,
  Send,
} from "lucide-react";
import { FinalReviewModal } from "./components/Finalreviewmodal";
import { DataMismatchModal } from "./components/Datamismatchmodal";
import { VehicleSearchSection } from "./components/VehicleSearchSection";
import { VehicleInfoCard } from "./components/VehicleInfoCard";
import { OwnerInfoCard } from "./components/OwnerInfoCard";
import { VoucherRedemption } from "./components/VoucherRedemption";
import { verificationService } from "../../services/verificationService";
import { ticketService } from "../../services/ticketService";
import { useAlert } from "../../hooks/useAlert";
import { attachmentService } from "../../services/attachmentService";

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
// Initial States
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
  // ── Verification state ────────────────────────────────────────────────────
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isRecordFound, setIsRecordFound] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [ticketMode, setTicketMode] = useState(null); // "ERROR" | "MISMATCH"
  const [searchValues, setSearchValues] = useState({
    mvFileNo: "",
    plateNo: "",
    engineNo: "",
    chassisNo: "",
  });
  const [mismatchedFields, setMismatchedFields] = useState([]);

  // ── Voucher state ─────────────────────────────────────────────────────────
  const [validatedVoucher, setValidatedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [ownerData, setOwnerData] = useState(initialOwnerData);
  const [insuranceData, setInsuranceData] = useState(initialInsuranceData);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showFinalReview, setShowFinalReview] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [showTicketAttachmentModal, setShowTicketAttachmentModal] =
    useState(false);
  const [ticketAttachmentFile, setTicketAttachmentFile] = useState({
    crAttachment: null,
    plateCertificationAttachment: null,
    actualPlateAttachment: null,
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const { success, error, loading, close } = useAlert();

  // ---------------------------------------------------------------------------
  // Insurance helpers
  // ---------------------------------------------------------------------------

  const calculateTotal = (data) => {
    const p = (k) => parseFloat(data[k]) || 0;
    return (
      p("prescribedPremiumFee") +
      p("dst") +
      p("vat") +
      p("lgt") +
      p("validationFee")
    ).toFixed(2);
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

  const updatePolicyNumber = (value) =>
    setInsuranceData({ ...insuranceData, policyNumber: value });

  // ---------------------------------------------------------------------------
  // STEP 1 — Verify
  // ---------------------------------------------------------------------------

  const handleVerify = async ({ mvFileNo, plateNo, engineNo, chassisNo }) => {
    setIsFetching(true);
    setFetchError(null);
    setIsRecordFound(false);
    setVerificationId(null);
    setMismatchedFields([]);
    setSearchValues({ mvFileNo, plateNo, engineNo, chassisNo });
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

      // ── Vehicle Not Found ──────────────────────────────────────────────────
      if (data.verificationStatus !== "VERIFIED") {
        setFetchError(
          data.failureReason || "No matching vehicle record found.",
        );
        setIsRecordFound(false);
        setTicketMode("ERROR");
        return;
      }

      // ── Mismatch detection ─────────────────────────────────────────────────
      const mismatches = [];
      if (
        mvFileNo &&
        data.mvFileNo &&
        mvFileNo.toUpperCase() !== data.mvFileNo.toUpperCase()
      )
        mismatches.push({
          field: "mv_file_number",
          entered: mvFileNo,
          actual: data.mvFileNo,
        });
      if (
        plateNo &&
        data.plateNumber &&
        plateNo.toUpperCase() !== data.plateNumber.toUpperCase()
      )
        mismatches.push({
          field: "plate_number",
          entered: plateNo,
          actual: data.plateNumber,
        });
      if (
        engineNo &&
        data.engineNumber &&
        engineNo.toUpperCase() !== data.engineNumber.toUpperCase()
      )
        mismatches.push({
          field: "engine_number",
          entered: engineNo,
          actual: data.engineNumber,
        });
      if (
        chassisNo &&
        data.chassisNumber &&
        chassisNo.toUpperCase() !== data.chassisNumber.toUpperCase()
      )
        mismatches.push({
          field: "chassis_number",
          entered: chassisNo,
          actual: data.chassisNumber,
        });

      setMismatchedFields(mismatches);
      setVerificationId(data.verificationId);

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
      setTicketMode("MISMATCH");

      if (mismatches.length > 0) {
        await error(
          "Mismatch Detected",
          "Some entered fields do not match LTO records.",
        );
      }
    } catch (err) {
      close();
      setFetchError("Error verifying vehicle. Please try again.");
      setIsRecordFound(false);
      setTicketMode("ERROR");
    } finally {
      setIsFetching(false);
    }
  };

  // ---------------------------------------------------------------------------
  // SUBMIT SUPPORT TICKET
  // ---------------------------------------------------------------------------

  const handleSubmitTicket = async (selectedMismatches = null) => {
    try {
      loading("Submitting ticket...");

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `REF-${datePart}-${randPart}`;

      const isVehicleNotFound = ticketMode === "ERROR";

      // Vehicle Not Found → use what the user searched
      // Data Mismatch → use the LTO record values
      const plateNo = isVehicleNotFound
        ? searchValues.plateNo || null
        : vehicleData.plate_number || null;
      const mvFileNo = isVehicleNotFound
        ? searchValues.mvFileNo || null
        : vehicleData.mv_file_number || null;
      const engineNo = isVehicleNotFound
        ? searchValues.engineNo || null
        : vehicleData.engine_number || null;
      const chassisNo = isVehicleNotFound
        ? searchValues.chassisNo || null
        : vehicleData.chassis_number || null;

      // Encode mismatch detail into address field so support team can see it
      let description = "";
      if (!isVehicleNotFound && selectedMismatches?.length > 0) {
        description =
          "Mismatched fields: " +
          selectedMismatches
            .map(
              (m) =>
                `${m.field} (entered: ${m.entered}, LTO record: ${m.actual})`,
            )
            .join("; ");
      }

      // const ticketPayload = {
      //   referenceNumber,
      //   type: isVehicleNotFound ? "Vehicle Not Found" : "Data Mismatch",
      //   status: "PENDING",
      //   requestedBy:
      //     localStorage.getItem("username") ||
      //     JSON.parse(localStorage.getItem("user") || "{}")?.username ||
      //     "Unknown User",
      //   escalated: "YES",
      //   roleBased: "LTO",
      //   dateRequested: new Date().toISOString(),
      //   dateUpdated: new Date().toISOString(),
      //   mvFileNo,
      //   plateNo,
      //   engineNo,
      //   chassisNo,
      //   make: vehicleData.make || null,
      //   series: vehicleData.series || null,
      //   vehicleColor: vehicleData.color || null,
      //   vehicleTypeDenomination: vehicleData.denomination || null,
      //   yearModel: vehicleData.year_model || null,
      //   classification: vehicleData.classification || null,
      //   name:
      //     `${ownerData.firstName || ""} ${ownerData.lastName || ""}`.trim() ||
      //     null,
      //   address: description || ownerData.address || null,
      // };

      const ticketPayload = {
        referenceNumber,
        type: isVehicleNotFound ? "Vehicle Not Found" : "Data Mismatch",
        status: "PENDING",
        requestedBy:
          localStorage.getItem("username") ||
          JSON.parse(localStorage.getItem("user") || "{}")?.username ||
          "Unknown User",
        escalated: "YES",
        roleBased: "LTO",
        dateRequested: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),

        mvFileNo,
        plateNo,
        engineNo,
        chassisNo,
        make: vehicleData.make || null,
        series: vehicleData.series || null,
        vehicleColor: vehicleData.color || null,
        vehicleTypeDenomination: vehicleData.denomination || null,
        yearModel: vehicleData.year_model || null,
        classification: vehicleData.classification || null,
        name:
          `${ownerData.firstName || ""} ${ownerData.lastName || ""}`.trim() ||
          null,
        address: description || ownerData.address || null,

        crAttachment: selectedMismatches?.crAttachment || null,
      };

      // Save mismatch fields to localStorage so TicketDetailModal can display them
      // keyed by referenceNumber — matches what TicketDetailModal reads
      if (!isVehicleNotFound && selectedMismatches?.length > 0) {
        const stored = JSON.parse(
          localStorage.getItem("ctpl_mismatch_fields") || "{}",
        );
        stored[referenceNumber] = selectedMismatches;
        localStorage.setItem("ctpl_mismatch_fields", JSON.stringify(stored));
      }

      if (!isVehicleNotFound && selectedMismatches?.length > 0) {
        const stored = JSON.parse(
          localStorage.getItem("ctpl_mismatch_fields") || "{}",
        );

        stored[referenceNumber] = selectedMismatches;

        localStorage.setItem("ctpl_mismatch_fields", JSON.stringify(stored));
      }

      const createdTicket = await ticketService.create(ticketPayload);

      const mismatchAttachmentFile = selectedMismatches?.attachmentFile;

      const filesToUpload = {
        crAttachment:
          ticketAttachmentFile?.crAttachment ||
          mismatchAttachmentFile?.crAttachment ||
          null,

        plateCertificationAttachment:
          ticketAttachmentFile?.plateCertificationAttachment ||
          mismatchAttachmentFile?.plateCertificationAttachment ||
          null,

        actualPlateAttachment:
          ticketAttachmentFile?.actualPlateAttachment ||
          mismatchAttachmentFile?.actualPlateAttachment ||
          null,
      };

      if (
        filesToUpload.crAttachment ||
        filesToUpload.plateCertificationAttachment ||
        filesToUpload.actualPlateAttachment
      ) {
        const formData = new FormData();

        formData.append("referenceNumber", referenceNumber);

        formData.append("requestedBy", ticketPayload.requestedBy);

        if (filesToUpload.crAttachment) {
          formData.append("crAttachment", filesToUpload.crAttachment);
        }

        if (filesToUpload.plateCertificationAttachment) {
          formData.append(
            "plateCertificationAttachment",
            filesToUpload.plateCertificationAttachment,
          );
        }

        if (filesToUpload.actualPlateAttachment) {
          formData.append(
            "actualPlateAttachment",
            filesToUpload.actualPlateAttachment,
          );
        }

        await attachmentService.upload(formData);
      }

      setTicketAttachmentFile({
        crAttachment: null,
        plateCertificationAttachment: null,
        actualPlateAttachment: null,
      });

      setShowTicketAttachmentModal(false);

      close();
      setShowMismatchModal(false);

      await success("Ticket Submitted", "Support ticket successfully created.");
    } catch (err) {
      close();
      console.error("TICKET ERROR:", err);

      await error("Ticket Error", "Failed to create support ticket.");
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2 — Voucher validation
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
        setVoucherError("Invalid or expired voucher code.");
      }
      setIsValidatingVoucher(false);
    }, 800);
  };

  // ---------------------------------------------------------------------------
  // STEP 3 — Generate certificate
  // ---------------------------------------------------------------------------

  const handleGenerateCertificate = async () => {
    if (!verificationId) {
      await error("Error", "Verification ID missing.");
      return;
    }
    setIsConfirming(true);
    loading("Submitting final review...");
    try {
      const res = await verificationService.confirm(verificationId, {
        insuranceData,
        voucherCode: validatedVoucher?.voucherCode,
      });
      const data = res.data;
      close();
      if (data.verificationStatus !== "COMPLETED") {
        await error(
          "Submission Failed",
          data.failureReason || "ConfirmRequest failed.",
        );
        return;
      }
      const { certificateNo } = data;
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
      await generateCertificatePDF({
        vehicle: vehicleData,
        owner: ownerData,
        insurance: insuranceData,
        authNo: certificateNo,
      });
      onCertificate({
        vehicle: vehicleData,
        owner: ownerData,
        insurance: insuranceData,
        authNo: certificateNo,
      });
      await success(
        "Certificate Issued!",
        `Certificate No: ${certificateNo} downloaded.`,
      );
    } catch (err) {
      close();
      await error("Submission Error", "Failed to submit final review.");
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
    setMismatchedFields([]);
    setTicketMode(null);
    setVehicleData(initialVehicleData);
    setOwnerData(initialOwnerData);
    setInsuranceData(initialInsuranceData);
  };

  const isFormComplete = () => isRecordFound && validatedVoucher !== null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          LTO Vehicle Verification
        </h1>
        <p className="text-sm text-gray-500">
          Search LTO database using any vehicle identifier
        </p>
      </div>

      {/* Search */}
      <VehicleSearchSection
        onVerify={handleVerify}
        isFetching={isFetching}
        fetchError={fetchError}
      />

      {/* Vehicle Not Found — error + Submit Ticket button */}
      {fetchError && (
        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setShowTicketAttachmentModal(true)}
          >
            <Ticket size={16} />
            Submit Ticket
          </Button>
        </div>
      )}

      {/* Vehicle found — info cards + Report Data Mismatch */}
      {isRecordFound && (
        <>
          <div className="flex justify-end mt-4">
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => setShowMismatchModal(true)}
            >
              <Ticket size={16} />
              Report Data Mismatch
            </Button>
          </div>
          <VehicleInfoCard
            vehicleData={vehicleData}
            mismatchedFields={mismatchedFields}
          />

          <OwnerInfoCard ownerData={ownerData} />

          {/* Auto-detected mismatch banner */}
          {mismatchedFields.length > 0 && (
            <Card className="p-5 mb-5 border border-red-300 bg-red-50">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-red-600" />
                <h3 className="font-bold text-red-700">Mismatch Detected</h3>
              </div>
              <div className="space-y-3">
                {mismatchedFields.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-red-200 rounded-lg p-3"
                  >
                    <p className="text-sm font-semibold text-gray-700">
                      {item.field}
                    </p>
                    <p className="text-sm text-red-600">
                      Entered: {item.entered}
                    </p>
                    <p className="text-sm text-green-700">
                      LTO Record: {item.actual}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => setShowMismatchModal(true)}
                >
                  <Ticket size={16} />
                  Submit Ticket
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Insurance */}
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
              Please verify a vehicle first.
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
              onRedeem={(voucher) => {
                setValidatedVoucher(voucher);
                const fees =
                  insuranceFeeMap[voucher.insuranceCode] ||
                  insuranceFeeMap["PRIVATE CARS (INCLUDING JEEPS AND AUVS)"];
                const newData = {
                  selectedCode: voucher.insuranceCode,
                  policyNumber: voucher.policyNumber,
                  premiumType: voucher.insuranceCode,
                  ...fees,
                };
                setInsuranceData({
                  ...newData,
                  totalAmount: calculateTotal(newData),
                });
              }}
            />
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

      {/* Data Mismatch Modal — lets user select which fields to report */}
      {showMismatchModal && (
        <DataMismatchModal
          vehicleData={vehicleData}
          ownerData={ownerData}
          onSubmit={(selectedMismatches) =>
            handleSubmitTicket(selectedMismatches)
          }
          onClose={() => setShowMismatchModal(false)}
          isSubmitting={isConfirming}
        />
      )}

      {showTicketAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Paperclip size={20} className="text-primary-600" />
                Vehicle Attachments
              </h3>

              <button
                onClick={() => setShowTicketAttachmentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="space-y-6">
                {/* CR Attachment */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    CR Attachment (Optional)
                  </label>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-5 py-3 rounded-lg">
                      Choose File
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) =>
                          setTicketAttachmentFile((prev) => ({
                            ...prev,
                            crAttachment: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    <span className="text-sm text-gray-500">
                      {ticketAttachmentFile?.crAttachment
                        ? ticketAttachmentFile.crAttachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>

                {/* Plate Certification */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Plate Certification Attachment (Optional)
                  </label>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-5 py-3 rounded-lg">
                      Choose File
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) =>
                          setTicketAttachmentFile((prev) => ({
                            ...prev,
                            plateCertificationAttachment:
                              e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    <span className="text-sm text-gray-500">
                      {ticketAttachmentFile?.plateCertificationAttachment
                        ? ticketAttachmentFile.plateCertificationAttachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>

                {/* Actual Plate */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Actual Plate Attachment (Optional)
                  </label>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-primary-700 font-semibold px-5 py-3 rounded-lg">
                      Choose File
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) =>
                          setTicketAttachmentFile((prev) => ({
                            ...prev,
                            actualPlateAttachment: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </label>

                    <span className="text-sm text-gray-500">
                      {ticketAttachmentFile?.actualPlateAttachment
                        ? ticketAttachmentFile.actualPlateAttachment.name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Supported formats: JPG, PNG, PDF, DOC (Max 5MB)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setTicketAttachmentFile({
                    crAttachment: null,
                    plateCertificationAttachment: null,
                    actualPlateAttachment: null,
                  });

                  setShowTicketAttachmentModal(false);
                }}
              >
                Cancel
              </Button>

              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  setShowTicketAttachmentModal(false);
                  handleSubmitTicket();
                }}
              >
                <Send size={16} />
                Create Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Final Review Modal */}
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
