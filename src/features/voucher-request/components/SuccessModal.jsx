import { Button } from "../../../components/Button";
import { CheckCircle } from "lucide-react";

export const SuccessModal = ({ purchasedPolicy, copied, copyToClipboard, onViewPolicies }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Purchase Successful!</h2>
            <p className="text-xs text-gray-500">Your insurance policy has been issued</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Policy Number</p>
            <code className="text-sm font-mono font-bold text-gray-900 block mb-3">{purchasedPolicy.policyNumber}</code>
            
            <p className="text-xs text-gray-500 mb-1">Voucher Code</p>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-700">{purchasedPolicy.voucherCode}</code>
              <button 
                onClick={() => copyToClipboard(purchasedPolicy.voucherCode)} 
                className="text-primary-600 text-sm hover:text-primary-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <strong>How to redeem:</strong> Go to the Verification page and enter your voucher code.
            </p>
          </div>
          
          <Button onClick={onViewPolicies} className="w-full">
            View My Policies
          </Button>
        </div>
      </div>
    </div>
  );
};