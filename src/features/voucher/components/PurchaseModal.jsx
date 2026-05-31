// PurchaseModal.jsx
import { useState } from "react";

export function PurchaseModal({
  selectedProduct,
  formatCurrency,
  isProcessing,
  onConfirm,
  onClose,
  selectedQuantity = 1,
  onQuantityChange,
}) {
  const [showRequestInvoice, setShowRequestInvoice] = useState(false);
  const MAX_VOUCHERS = 800;
  const REQUEST_INVOICE_THRESHOLD = 801;

  const handleQuantityChange = (e) => {
    let newQuantity = parseInt(e.target.value) || 1;
    // Allow any quantity, but track if it's above threshold for invoice request
    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  const handleIncrement = () => {
    if (onQuantityChange) {
      const newQuantity = selectedQuantity + 1;
      onQuantityChange(newQuantity);
    }
  };

  const handleDecrement = () => {
    if (onQuantityChange && selectedQuantity > 1) {
      onQuantityChange(selectedQuantity - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedQuantity >= REQUEST_INVOICE_THRESHOLD) {
      // Show invoice request modal or handle invoice request
      setShowRequestInvoice(true);
      // You can implement custom logic here for invoice request
      alert(
        `Please request an invoice for ${selectedQuantity} vouchers. Our sales team will contact you.`,
      );
    } else {
      onConfirm(selectedQuantity);
    }
  };

  const totalAmount = selectedProduct.price * selectedQuantity;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase {selectedProduct.productName}
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
          {/* Product Info */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Price per voucher:</span>
              <span className="text-lg font-semibold text-primary-600">
                {formatCurrency(selectedProduct.price)}
              </span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={selectedQuantity <= 1}
                className={`w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center transition-colors ${
                  selectedQuantity <= 1
                    ? "bg-gray-100 opacity-50 cursor-not-allowed"
                    : "bg-white hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <input
                type="number"
                value={selectedQuantity}
                onChange={handleQuantityChange}
                min="1"
                className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <button
                type="button"
                onClick={handleIncrement}
                className="w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            {/* Warning message for exceeding max */}
            {selectedQuantity > MAX_VOUCHERS && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ For bulk orders exceeding {MAX_VOUCHERS} vouchers, please
                request an invoice.
              </p>
            )}
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total Amount:</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(totalAmount)}
                </span>
                <p className="text-xs text-gray-500">
                  ({selectedQuantity} voucher{selectedQuantity !== 1 ? "s" : ""}{" "}
                  × {formatCurrency(selectedProduct.price)})
                </p>
              </div>
            </div>
          </div>

          {/* Conditional Button: Proceed to Payment OR Request Invoice */}
          {selectedQuantity >= REQUEST_INVOICE_THRESHOLD ? (
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Request Invoice"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing
                ? "Processing..."
                : `Proceed to Payment (${formatCurrency(totalAmount)})`}
            </button>
          )}

          <p className="text-xs text-gray-400 text-center mt-3">
            Max {MAX_VOUCHERS} vouchers for online payment. For{" "}
            {REQUEST_INVOICE_THRESHOLD}+ vouchers, please request an invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
