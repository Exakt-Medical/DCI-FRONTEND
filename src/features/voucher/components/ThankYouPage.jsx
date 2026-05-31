import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { voucherService } from "../../../services/voucherService";

export function ThankYouPage({
  selectedProduct,
  quantity,
  formatCurrency,
  orderId,
}) {
  const [copied, setCopied] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Temporarily disabled for debugging.
    // Start redirecting after 1 second to show the message and spinner
    // const redirectTimer = setTimeout(() => {
    //   setIsRedirecting(true);
    // }, 1000);

    // Redirect to verification page after 3 seconds
    // const navigationTimer = setTimeout(() => {
    //   navigate("/vvip-access/verification");
    // }, 3000);

    return () => {
      // clearTimeout(redirectTimer);
      // clearTimeout(navigationTimer);
    };
  }, [navigate]);

  const handleManualRedirect = async () => {
    setIsRedirecting(true);
    try {
      if (orderId != null) {
        await voucherService.process(orderId);
        sessionStorage.removeItem("pendingOrderId");
      }
    } catch (err) {
      console.error("Failed to process order:", err);
    }
    navigate("/vvip-access/verification");
  };

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

        <div className="bg-gray-50 rounded-lg p-6 max-w-xl mx-auto mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Merchant Ref Id:</span>
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

        {/* Redirect Message with Spinner */}
        <div className="text-center max-w-md mx-auto">
          <p className="text-sm text-gray-600 mb-3">
            Automatic redirection is paused for debugging.
          </p>
          <button
            type="button"
            onClick={handleManualRedirect}
            className="inline-flex items-center justify-center rounded-lg bg-[#1a3a6b] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#143055]"
          >
            Go to Verification
          </button>
          {isRedirecting && (
            <div className="mt-4 flex justify-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-[#1a3a6b] border-r-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
