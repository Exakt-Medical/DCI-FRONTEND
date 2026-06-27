import { useState } from "react";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import { Ticket, CheckCircle, AlertCircle } from "lucide-react";

export const VoucherRedemption = ({
  onValidate,
  validatedVoucher,
  voucherError,
  isValidating,
  onReset,
}) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [localError, setLocalError] = useState("");

  const handleValidate = () => {
    if (!voucherCode.trim()) {
      setLocalError("Please enter a transaction code");
      return;
    }
    setLocalError("");
    if (onValidate) onValidate(voucherCode.trim());
  };

  const handleReset = () => {
    setVoucherCode("");
    setLocalError("");
    if (onReset) onReset();
  };

  const displayError = voucherError || localError;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={16} className="text-blue-600" />
        <h4 className="text-sm font-bold text-blue-900">Redeem Transaction</h4>
      </div>

      {!validatedVoucher ? (
        <>
          <div className="flex gap-2">
            <input
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleValidate()}
              placeholder="Enter your transaction code (e.g., BLR-000-XXXX-XXXXX)"
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
          {displayError && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
              <AlertCircle size={12} /> {displayError}
            </p>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Voucher Validated!
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Remove
            </button>
          </div>
          <p className="text-xs text-green-600 mt-1 font-mono">
            {validatedVoucher.voucherCode}
          </p>
          {validatedVoucher.remainingVouchers !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Remaining vouchers after this:{" "}
              {validatedVoucher.remainingVouchers - 1}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
