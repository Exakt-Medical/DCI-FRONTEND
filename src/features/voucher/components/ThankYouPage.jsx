import { useEffect, useState } from "react";

export function ThankYouPage({ selectedProduct, quantity, formatCurrency }) {
  const [copied, setCopied] = useState(false);

  // Static voucher code for CTPL insurance
  const voucherCode = "CTPL-VIP-2024-001";

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      // This will be handled by parent component
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center overflow-y-auto">
      <div className="text-center p-8 max-w-2xl">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-4">
            Your CTPL Insurance has been purchased successfully.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">{selectedProduct.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">x{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium text-[#1a3a6b]">
                {formatCurrency(selectedProduct.price * quantity)}
              </span>
            </div>
          </div>
        </div>

        {/* Static Voucher Code Section */}
        <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
              />
            </svg>
            Your Voucher Code
          </h3>
          <div className="bg-white rounded-lg p-4 flex justify-between items-center border border-blue-200">
            <div>
              <p className="text-xs text-gray-500">CTPL Insurance Voucher</p>
              <p className="font-mono text-lg font-bold text-gray-900">
                {voucherCode}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(voucherCode)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            ⚠️ Please save this voucher code. You'll need it for vehicle
            verification.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Redirecting to verification page...
        </p>
        <div className="mt-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1a3a6b] border-r-transparent"></div>
        </div>
      </div>
    </div>
  );
}
