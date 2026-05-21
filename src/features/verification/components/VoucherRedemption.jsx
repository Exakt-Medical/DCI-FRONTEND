import { useState } from "react";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import { Ticket, CheckCircle, Copy, AlertCircle } from "lucide-react";

export const VoucherRedemption = ({ 
  onValidate, 
  validatedVoucher, 
  voucherError, 
  isValidating,
  onReset 
}) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = () => {
    onValidate(voucherCode);
  };

  const handleReset = () => {
    setVoucherCode("");
    onReset();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={16} className="text-blue-600" />
        <h4 className="text-sm font-bold text-blue-900">Redeem Voucher</h4>
      </div>
      
      {!validatedVoucher ? (
        <>
          <div className="flex gap-2">
            <input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              placeholder="Enter your voucher code (e.g., VCH-ABC123XYZ)"
              className="flex-1 bg-white border border-blue-300 rounded-lg px-4 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
            />
            <Button 
              onClick={handleValidate} 
              disabled={isValidating || !voucherCode.trim()}
              size="sm"
            >
              {isValidating ? <Spinner size="sm" /> : "Validate"}
            </Button>
          </div>
          {voucherError && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
              <AlertCircle size={12} /> {voucherError}
            </p>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Voucher Validated!</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Change Voucher
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-green-600">Policy Number</p>
              <p className="text-sm font-mono font-bold text-gray-900">{validatedVoucher.policyNumber}</p>
            </div>
            <div>
              <p className="text-xs text-green-600">Voucher Code</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-gray-700">{validatedVoucher.voucherCode}</p>
                <button 
                  onClick={() => copyToClipboard(validatedVoucher.voucherCode)} 
                  className="text-gray-400 hover:text-primary-600"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-green-600">Plan</p>
              <p className="text-sm text-gray-900">{validatedVoucher.productName}</p>
            </div>
            <div>
              <p className="text-xs text-green-600">Valid Until</p>
              <p className="text-sm text-gray-900">{validatedVoucher.expirationDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};