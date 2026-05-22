// PaymentModal.jsx
import { useState } from "react";

export function PaymentModal({
  selectedProduct,
  quantity,
  formatCurrency,
  onClose,
  onPaymentComplete,
}) {
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = selectedProduct.price * quantity;

  const generateReferenceNumber = () => {
    return `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const referenceNumber = generateReferenceNumber();
      setIsProcessing(false);
      onPaymentComplete(paymentMethod, referenceNumber);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{selectedProduct.name}</span>
                  <span className="text-gray-900">
                    {formatCurrency(selectedProduct.price)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <span className="text-gray-900">x{quantity}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span className="text-[#1a3a6b] text-lg">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Credit / Debit Card</div>
                      <div className="text-sm text-gray-500">
                        Visa, Mastercard, Amex
                      </div>
                    </div>
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6z" />
                    </svg>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="gcash"
                      checked={paymentMethod === "gcash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">GCash</div>
                      <div className="text-sm text-gray-500">
                        Pay via GCash wallet
                      </div>
                    </div>
                    <span className="text-blue-500 font-semibold">GCash</span>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value="paymaya"
                      checked={paymentMethod === "paymaya"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">PayMaya</div>
                      <div className="text-sm text-gray-500">
                        Pay via PayMaya wallet
                      </div>
                    </div>
                    <span className="text-blue-500 font-semibold">PayMaya</span>
                  </label>
                </div>
              </div>

              {/* Card Details (only show for credit_card) */}
              {paymentMethod === "credit_card" && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1a3a6b] focus:border-[#1a3a6b]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1a3a6b] focus:border-[#1a3a6b]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#1a3a6b] focus:border-[#1a3a6b]"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GCash/PayMaya details */}
              {(paymentMethod === "gcash" || paymentMethod === "paymaya") && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    You will be redirected to{" "}
                    {paymentMethod === "gcash" ? "GCash" : "PayMaya"} to
                    complete your payment.
                  </p>
                  <p className="text-xs text-gray-500">
                    Mobile number: 09123456789 (Demo)
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#1a3a6b] text-white py-3 rounded-lg font-semibold hover:bg-[#142d52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-0"
              >
                {isProcessing
                  ? "Processing Payment..."
                  : `Pay ${formatCurrency(totalAmount)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
