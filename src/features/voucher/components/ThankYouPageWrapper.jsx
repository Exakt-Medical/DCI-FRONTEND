// src/features/voucher/components/ThankYouPageWrapper.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ThankYouPage } from "./ThankYouPage";
import orderService from "../../../services/orderService"; // Adjust path as needed
import merchantService from "../../../services/merchantCallbackService";

export function ThankYouPageWrapper() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        // Check for debug mode (for frontend testing)
        const debug = searchParams.get("debug");
        const mock = searchParams.get("mock");

        if (debug === "true" || mock === "true") {
          // Use mock data for frontend testing
          setOrderData({
            selectedProduct: {
              name: searchParams.get("product") || "CTPL Insurance (Test)",
              price: parseFloat(searchParams.get("price")) || 650,
            },
            quantity: parseInt(searchParams.get("quantity")) || 1,
          });
          setLoading(false);
          return;
        }

        // If merchant callback with transaction_id is present, call backend summary
        const transactionId = searchParams.get("transaction_id") || searchParams.get("transactionId");
        if (transactionId) {
          try {
            const resp = await merchantService.fetchSummary(transactionId);
            const data = resp?.data || {};

            // Map backend summary to the existing ThankYouPage props
            const selectedProduct = {
              name: data.voucherDescription || data.merchantReference || "Voucher",
              price: data.amountPaid ?? 0,
            };

            const quantity = data.voucherCount || 1;

            setOrderData({ selectedProduct, quantity });
            setLoading(false);
            return;
          } catch (err) {
            console.error("Merchant callback load failed:", err);
            setError("Unable to verify payment. Please contact support.");
            setLoading(false);
            return;
          }
        }

        // Get order ID from URL
        const orderId = orderService.getOrderIdFromUrl();

        if (!orderId) {
          setError("No order ID found");
          setLoading(false);
          return;
        }

        // Fetch order details from API service
        const data = await orderService.getOrderDetails(orderId);
        setOrderData(data);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Unable to load order details. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [searchParams]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1a3a6b] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Unable to Load Order
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Order information not found"}
          </p>
          <button
            onClick={() => (window.location.href = "/vvip-access/vouchers")}
            className="bg-[#1a3a6b] text-white px-6 py-2 rounded-lg"
          >
            Go to Vouchers
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThankYouPage
      selectedProduct={orderData.selectedProduct}
      quantity={orderData.quantity}
      formatCurrency={formatCurrency}
    />
  );
}
