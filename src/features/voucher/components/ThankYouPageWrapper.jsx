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

    // If TLPE redirected with a transactionId, pull payment status from backend
    const transactionId =
      searchParams.get("transaction_id") || searchParams.get("transactionId");
    if (transactionId) {
      let cancelled = false;

      const mapResult = (result) => {
        const data = result?.data || result || {};
        const statusCode = data.statusCode || "";
        const paymentFailed =
          result?.success === false ||
          (typeof statusCode === "string" && statusCode.startsWith("ER"));
        const failureMessage =
          data.voucherStatusLabel ||
          data.report?.result?.message ||
          "Payment was not completed. Please contact support.";
        return {
          selectedProduct: {
            name:
              data.voucherDescription ||
              data.merchantReference ||
              "CTPL Insurance",
            price: data.amountPaid ?? 0,
          },
          quantity: data.voucherCount || 1,
          paymentFailed,
          failureMessage,
        };
      };

      // Primary: pull strategy — call GET /summary/{transactionId} directly.
      // TLPE's /report API is available immediately after redirect, so no webhook needed.
      const fetchWithRetry = async (retries = 3, delayMs = 2000) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const result = await merchantService.fetchSummary(transactionId);
            if (cancelled) return;
            setOrderData(mapResult(result));
            setLoading(false);
            return;
          } catch (err) {
            console.warn(
              `fetchSummary attempt ${attempt} failed:`,
              err.message,
            );
            if (attempt < retries && !cancelled) {
              await new Promise((res) => setTimeout(res, delayMs));
            }
          }
        }

        if (cancelled) return;

        // Fallback: open SSE stream and wait for webhook-pushed result
        console.warn(
          "fetchSummary exhausted retries — falling back to SSE stream",
        );
        const stop = merchantService.streamPaymentResult(transactionId, {
          onMessage: (result) => {
            if (cancelled) return;
            setOrderData(mapResult(result));
            setLoading(false);
            setError(null);
          },
          onError: (err) => {
            if (cancelled) return;
            console.error("SSE fallback also failed:", err);
            setError("Unable to verify payment. Please contact support.");
            setLoading(false);
          },
        });
        // store stop so cleanup can call it
        stopRef = stop;
      };

      let stopRef = null;
      fetchWithRetry();

      return () => {
        cancelled = true;
        stopRef?.();
      };
    }

    // Fallback: Get order ID from URL
    const loadOrderById = async () => {
      try {
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

    loadOrderById();
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

  const pendingOrderId = sessionStorage.getItem("pendingOrderId");

  return (
    <ThankYouPage
      selectedProduct={orderData.selectedProduct}
      quantity={orderData.quantity}
      formatCurrency={formatCurrency}
      orderId={pendingOrderId ? Number(pendingOrderId) : null}
      paymentFailed={orderData.paymentFailed ?? false}
      failureMessage={orderData.failureMessage ?? ""}
    />
  );
}
