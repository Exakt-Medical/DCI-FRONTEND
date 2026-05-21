import { useState } from "react";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import { Car, User, Shield, AlertCircle } from "lucide-react";

export const FinalReviewModal = ({ vehicleData, ownerData, insuranceData, validatedVoucher, onConfirm, onClose }) => {
  const [confirming, setConfirming] = useState(false);
  const authNo = `AUTH-${Date.now().toString().slice(-8)}`;

  const handleConfirm = async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1000));
    setConfirming(false);
    onConfirm(authNo);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Final Review & Confirmation</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="p-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-5">
            <p className="text-sm font-semibold text-primary-700">Authentication Number: <span className="font-mono">{authNo}</span></p>
            <p className="text-xs text-primary-600 mt-1">Voucher Code: <span className="font-mono">{validatedVoucher?.voucherCode}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <Car size={16} className="text-primary-600" />
                <h3 className="text-sm font-bold text-gray-900">Vehicle Information</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex"><span className="text-gray-500 w-32">Plate No.:</span><span className="text-gray-900 font-medium">{vehicleData.plate_number || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">MV File No.:</span><span className="text-gray-900">{vehicleData.mv_file_number || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Make:</span><span className="text-gray-900">{vehicleData.make || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Series:</span><span className="text-gray-900">{vehicleData.series || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Year Model:</span><span className="text-gray-900">{vehicleData.year_model || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Body Type:</span><span className="text-gray-900">{vehicleData.body_type || "—"}</span></div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <User size={16} className="text-primary-600" />
                <h3 className="text-sm font-bold text-gray-900">Owner Information</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex"><span className="text-gray-500 w-32">Full Name:</span><span className="text-gray-900 font-medium">{ownerData.firstName} {ownerData.middleName} {ownerData.lastName}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Address:</span><span className="text-gray-900">{ownerData.address || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Contact:</span><span className="text-gray-900">{ownerData.contactNo || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Email:</span><span className="text-gray-900">{ownerData.email || "—"}</span></div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <Shield size={16} className="text-primary-600" />
                <h3 className="text-sm font-bold text-gray-900">Insurance Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex"><span className="text-gray-500 w-32">Policy Number:</span><span className="text-gray-900 font-mono font-bold text-primary-600">{insuranceData.policyNumber || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Voucher Code:</span><span className="text-gray-900 font-mono">{validatedVoucher?.voucherCode || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Premium Type:</span><span className="text-gray-900">{insuranceData.premiumType || "—"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Redeemed On:</span><span className="text-gray-900 font-medium text-green-600">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Prescribed Premium:</span><span className="text-gray-900">₱ {insuranceData.prescribedPremiumFee || "0.00"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">DST:</span><span className="text-gray-900">₱ {insuranceData.dst || "0.00"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">VAT:</span><span className="text-gray-900">₱ {insuranceData.vat || "0.00"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">LGT:</span><span className="text-gray-900">₱ {insuranceData.lgt || "0.00"}</span></div>
                <div className="flex"><span className="text-gray-500 w-32">Validation Fee:</span><span className="text-gray-900">₱ {insuranceData.validationFee || "0.00"}</span></div>
                <div className="flex col-span-2"><span className="text-gray-500 w-32">Total Amount:</span><span className="text-gray-900 font-bold text-primary-600">₱ {insuranceData.totalAmount || "0.00"}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Please review all information carefully. This will generate an official Certificate of Validation.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={handleConfirm} disabled={confirming} size="sm">
            {confirming ? <><Spinner size="sm" /> Generating...</> : <>Confirm & Generate Certificate</>}
          </Button>
        </div>
      </div>
    </div>
  );
};