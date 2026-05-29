import { Button } from "../../../components/Button";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "../TransferVoucherPage";

const SuccessModal = ({
  showSuccessModal,
  setShowSuccessModal,
  transferSuccess,
  setTransferSuccess,
}) => {
  if (!showSuccessModal || !transferSuccess) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Transfer Successful!
            </h2>
            <p className="text-xs text-gray-500">
              Vouchers have been assigned to agent
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Agent:</span>
                <span className="text-sm font-medium text-gray-900">
                  {transferSuccess.agent}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quantity:</span>
                <span className="text-sm font-medium text-gray-900">
                  {transferSuccess.quantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Value:</span>
                <span className="text-sm font-medium text-primary-600">
                  {formatCurrency(transferSuccess.totalValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Agent's Total Assigned:
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {transferSuccess.newAssignedCount} vouchers
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setShowSuccessModal(false);
              setTransferSuccess(null);
            }}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
