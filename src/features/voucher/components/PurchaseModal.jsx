import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import { Shield } from "lucide-react";

export const PurchaseModal = ({ selectedProduct, formatCurrency, isProcessing, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Confirm Purchase</h2>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Plan:</span>
              <span className="text-sm font-medium text-gray-900">{selectedProduct.productName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Coverage:</span>
              <span className="text-sm text-gray-900">{selectedProduct.coverage}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Total Premium:</span>
              <span className="text-lg font-bold text-primary-600">{formatCurrency(selectedProduct.price)}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isProcessing} className="flex-1">
              {isProcessing ? <Spinner size="sm" /> : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};