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
  const handleQuantityChange = (e) => {
    // Disabled for now - future bulk purchase feature
    // const newQuantity = parseInt(e.target.value) || 1;
    // if (onQuantityChange) {
    //   onQuantityChange(
    //     Math.max(1, Math.min(newQuantity, selectedProduct.stock || 999)),
    //   );
    // }
  };

  const handleIncrement = () => {
    // Disabled for now - future bulk purchase feature
    // if (onQuantityChange) {
    //   onQuantityChange(
    //     Math.min(selectedQuantity + 1, selectedProduct.stock || 999),
    //   );
    // }
  };

  const handleDecrement = () => {
    // Disabled for now - future bulk purchase feature
    // if (onQuantityChange) {
    //   onQuantityChange(Math.max(selectedQuantity - 1, 1));
    // }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(1); // Force quantity to 1 for now
  };

  const totalAmount = selectedProduct.price * 1; // Force quantity to 1 for now

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase {selectedProduct.name}
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
              <span className="text-gray-600">Price per ticket:</span>
              <span className="text-lg font-semibold text-primary-600">
                {formatCurrency(selectedProduct.price)}
              </span>
            </div>
          </div>

          {/* Quantity Selector - Disabled but visible for future bulk purchase */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity{" "}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={true} // Disabled for now
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100 opacity-50 cursor-not-allowed transition-colors"
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
                value={1} // Fixed value for now
                onChange={handleQuantityChange}
                min="1"
                max="1" // Max set to 1 for now
                disabled={true} // Disabled for now
                className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />

              <button
                type="button"
                onClick={handleIncrement}
                disabled={true} // Disabled for now
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-100 opacity-50 cursor-not-allowed transition-colors"
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

              <span className="text-sm text-gray-400">Max: 1</span>
            </div>
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
                  (1 ticket × {formatCurrency(selectedProduct.price)})
                </p>
              </div>
            </div>
          </div>

          {/* Proceed Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? "Processing..."
              : `Proceed to Payment (${formatCurrency(totalAmount)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
