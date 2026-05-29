import { X, Car, User, Shield, CheckCircle } from "lucide-react";
import { Button } from "../../../components/Button";

const ReviewRow = ({ label, value }) => (
  <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
    <span className="text-xs font-medium text-gray-900 text-right">
      {value || "—"}
    </span>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
    <Icon size={15} className="text-primary-600" />
    <h4 className="text-sm font-bold text-gray-900">{title}</h4>
  </div>
);

export const FinalReviewModal = ({
  vehicleData,
  ownerData,
  insuranceData,
  validatedVoucher,
  isConfirming,
  onConfirm,
  onClose,
}) => {
  const ownerFullName = [
    ownerData.firstName,
    ownerData.middleName,
    ownerData.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <h3 className="text-base font-bold text-gray-900">Final Review</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-4 space-y-5 flex-1">
          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-xs text-blue-700">
              Please review all details carefully before confirming. Once
              submitted, a certificate will be generated and your voucher will
              be marked as redeemed.
            </p>
          </div>

          {/* Vehicle */}
          <div>
            <SectionHeader icon={Car} title="Vehicle Information" />
            <ReviewRow label="MV File No." value={vehicleData.mv_file_number} />
            <ReviewRow label="Plate No." value={vehicleData.plate_number} />
            <ReviewRow label="Engine No." value={vehicleData.engine_number} />
            <ReviewRow label="Chassis No." value={vehicleData.chassis_number} />
            <ReviewRow label="Make" value={vehicleData.make} />
            <ReviewRow label="Series" value={vehicleData.series} />
            <ReviewRow label="Color" value={vehicleData.color} />
            <ReviewRow label="Year Model" value={vehicleData.year_model} />
            <ReviewRow
              label="Classification"
              value={vehicleData.classification}
            />
            <ReviewRow label="Body Type" value={vehicleData.body_type} />
            <ReviewRow
              label="Vehicle Type/Denomination"
              value={vehicleData.denomination}
            />
            <ReviewRow
              label="Last Registration Date"
              value={vehicleData.last_registration_date}
            />
          </div>

          {/* Owner */}
          <div>
            <SectionHeader icon={User} title="Owner Information" />
            <ReviewRow label="Full Name" value={ownerFullName} />
            <ReviewRow label="Address" value={ownerData.address} />
          </div>

          {/* Insurance / Voucher */}
          <div>
            <SectionHeader icon={Shield} title="Insurance & Voucher" />
            <ReviewRow
              label="Voucher Code"
              value={validatedVoucher?.voucherCode}
            />
            <ReviewRow label="Premium Type" value={insuranceData.premiumType} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isConfirming}
            className="min-w-[200px]"
          >
            {isConfirming ? "Submitting..." : "Confirm & Generate Certificate"}
          </Button>
        </div>
      </div>
    </div>
  );
};
