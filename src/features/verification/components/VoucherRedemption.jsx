import { useState } from "react";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";
import { Ticket, CheckCircle, Copy, AlertCircle, Shield } from "lucide-react";
import { MOCK_ASSIGNED_VOUCHERS } from "../../../constants/mockData";

export const VoucherRedemption = ({
  onValidate,
  validatedVoucher,
  voucherError,
  isValidating,
  onReset,
  onRedeem,
  isRedeeming = false,
  assignedVouchers = MOCK_ASSIGNED_VOUCHERS,
}) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localValidatedVoucher, setLocalValidatedVoucher] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = () => {
    if (!voucherCode.trim()) {
      setLocalError("Please enter a voucher code");
      return;
    }

    // Find voucher in assigned vouchers
    const foundVoucher = assignedVouchers.find(
      (v) => v.voucherCode.toLowerCase() === voucherCode.trim().toLowerCase(),
    );

    if (!foundVoucher) {
      setLocalError("Invalid voucher code. Please check and try again.");
      setLocalValidatedVoucher(null);
      if (onValidate) onValidate(null, "Invalid voucher code");
      return;
    }

    if (foundVoucher.status !== "Active") {
      setLocalError(
        `This voucher is ${foundVoucher.status.toLowerCase()}. Cannot be redeemed.`,
      );
      setLocalValidatedVoucher(null);
      if (onValidate)
        onValidate(null, `Voucher is ${foundVoucher.status.toLowerCase()}`);
      return;
    }

    // Check if expired
    const expiryDate = new Date(foundVoucher.expiryDate);
    const today = new Date();
    if (expiryDate < today) {
      setLocalError("This voucher has expired.");
      setLocalValidatedVoucher(null);
      if (onValidate) onValidate(null, "Voucher has expired");
      return;
    }

    // Voucher is valid
    setLocalError("");
    const validatedData = {
      id: foundVoucher.id,
      policyNumber: `POL-${foundVoucher.voucherCode.slice(-8)}`,
      voucherCode: foundVoucher.voucherCode,
      productName: foundVoucher.productName,
      premium: foundVoucher.premium,
      expirationDate: foundVoucher.expiryDate,
      assignedBy: foundVoucher.assignedBy,
      assignedDate: foundVoucher.assignedDate,
      insuranceCode:
        foundVoucher.insuranceCode || "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
    };

    setLocalValidatedVoucher(validatedData);
    if (onValidate) onValidate(validatedData, null);
  };

  const handleRedeem = () => {
    const voucherToRedeem = validatedVoucher || localValidatedVoucher;
    if (voucherToRedeem) {
      if (onRedeem) onRedeem(voucherToRedeem);
      if (onValidate) onValidate(voucherToRedeem);
    }
  };

  const handleReset = () => {
    setVoucherCode("");
    setLocalError("");
    setLocalValidatedVoucher(null);
    if (onReset) onReset();
  };

  // Use either external or local state
  const displayVoucher = validatedVoucher || localValidatedVoucher;
  const displayError = voucherError || localError;
  const isRedeemingNow = isRedeeming;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ticket size={16} className="text-blue-600" />
        <h4 className="text-sm font-bold text-blue-900">Redeem Voucher</h4>
      </div>

      {!displayVoucher ? (
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
          {displayError && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-2">
              <AlertCircle size={12} /> {displayError}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            💡 Try these demo codes: VCH-ABC123XYZ, VCH-DEF456UVW, VCH-GHI789RST
          </p>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Voucher Validated!
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-green-200">
            <Button
              onClick={handleRedeem}
              disabled={isRedeemingNow}
              className="w-full"
              size="sm"
            >
              {isRedeemingNow ? (
                <Spinner size="sm" />
              ) : (
                "Redeem Voucher for this Vehicle"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
