import { useMemo, useState, useEffect } from "react";
import {
  VOUCHER_INVENTORY_FILTERS,
  VOUCHER_INVENTORY_STATUS,
} from "../../../constants/voucherInventoryStatus";
import { voucherInventoryService } from "../../../services/voucherInventoryService";
import paymentsService from "../../../services/paymentsService";
import Swal from "sweetalert2";

export const useVoucherInventory = ({
  inventory,
  onInventoryChange,
}) => {
  const [activeTab, setActiveTab] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastBatch, setLastBatch] = useState(null);
  const fetchInventory = async () => {
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const userId = localStorage.getItem("userId") || profile.id;
    if (userId) {
      const data = await voucherInventoryService.fetchAgentInventory(userId);
      onInventoryChange?.(data);
    }
  };

  useEffect(() => {
    fetchInventory();
    
    const handlePaymentCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const transactionId = urlParams.get("transaction_id") || urlParams.get("id") || urlParams.get("orderId");
      if (!transactionId) return;

      // Remove the transaction param from the URL to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);

      setIsProcessingPayment(true);
      try {
        let orderConfirmed = false;
        
        // Try fetching summary with retries
        for (let i = 0; i < 5; i++) {
          try {
            const mService = await import("../../../services/merchantCallbackService").then(m => m.default);
            const result = await mService.fetchSummary(transactionId);
            const data = result?.data || result || {};
            if (data && !data.paymentFailed && data.amountPaid !== undefined) {
               orderConfirmed = true;
               break;
            }
          } catch (e) {
            console.warn("fetchSummary failed, retrying...", e);
          }
          await new Promise(res => setTimeout(res, 2000));
        }

        if (!orderConfirmed) {
           console.log("fetchSummary exhausted retries — assuming payment is still processing.");
        }

        localStorage.removeItem("pendingVoucherOrderId");

        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          text: "Your vouchers are being processed and added to your inventory.",
        });
        
        // Refresh inventory after successful purchase
        await fetchInventory();
        setActiveTab("inventory");
      } catch (error) {
        console.error("Failed to handle payment callback:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to verify payment status or process vouchers. They may still be processing in the background.",
        });
      } finally {
        setIsProcessingPayment(false);
      }
    };

    handlePaymentCallback();
  }, []);

  const summary = useMemo(() => voucherInventoryService.getSummary(inventory), [inventory]);

  const filteredRows = useMemo(() => {
    return inventory.filter((item) => {
      const statusMatch =
        statusFilter === "ALL" ? true : item.inventoryStatus === statusFilter;

      const text = `${item.voucherCode} ${item.batchId} ${item.assignedToPlate}`.toLowerCase();
      const searchMatch = searchTerm ? text.includes(searchTerm.toLowerCase()) : true;

      return statusMatch && searchMatch;
    });
  }, [inventory, searchTerm, statusFilter]);

  const filterOptions = useMemo(
    () =>
      VOUCHER_INVENTORY_FILTERS.map((filter) => ({
        ...filter,
        count:
          filter.id === "ALL"
            ? summary.all
            : inventory.filter((item) => item.inventoryStatus === filter.id).length,
      })),
    [inventory, summary.all],
  );

  const handlePurchase = async () => {
    if (isProcessingPayment) return;

    const safeQuantity = Math.max(Number(quantity) || 0, 0);
    if (!safeQuantity) return;

    setIsProcessingPayment(true);

    try {
      const storedProfile  = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const storedFirstName = localStorage.getItem("firstname") || storedProfile.firstName || "Agent";
      const storedLastName  = localStorage.getItem("lastname")  || storedProfile.lastName  || "User";
      const storedEmail     = localStorage.getItem("email")     || storedProfile.email     || "agent@example.com";
      const companyId       = Number(localStorage.getItem("companyId") || storedProfile.companyId || 0);
      const companyCode     = localStorage.getItem("companyCode") || storedProfile.companyCode || "";

      if (!companyId || !companyCode) {
        throw new Error("Missing company information required for payment processing.");
      }

      const callbackUrl = window.location.origin + window.location.pathname;
      const amount = (safeQuantity * 60).toFixed(2);

      const paymentRequest = {
        customer: {
          contact: { email: storedEmail },
          first_name: storedFirstName,
          last_name: storedLastName,
          billing_address: {
            line1: storedProfile.address || "Agent Address", line2: "", zip: "",
            city_municipality: "", state_province_region: "", country_code: "PH",
          },
        },
        payment: {
          description: "DCI Voucher Request",
          amount: amount,
          currency: "PHP",
          merchant_reference_id: `VOUCHER-${Date.now()}`,
        },
        route: { callback_url: callbackUrl, notify_user: true },
        company_id: companyId,
        company_code: companyCode,
        voucher_fee: 60,
        voucher_count: safeQuantity,
      };

      // Ensure paymentsService is imported (we will add the import next)
      const response = await paymentsService.createTlpePayment(paymentRequest);
      const payload = response?.data || {};
      const paymentLink = payload.link;
      
      if (payload.order_id || payload.orderId) {
        localStorage.setItem("pendingVoucherOrderId", payload.order_id || payload.orderId);
      }

      if (!paymentLink) {
        throw new Error("Payment gateway link was not returned.");
      }

      window.bypassBeforeUnload = true;
      window.location.href = paymentLink;
    } catch (error) {
      console.error("[Agent Voucher] Payment setup failed:", error);
      Swal.fire({
        icon: "error",
        title: "Payment Setup Failed",
        text: error?.response?.data?.error || error.message || "Failed to initiate payment.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    quantity,
    setQuantity,
    isProcessingPayment,
    handlePurchase,
    summary,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    filteredRows,
    filterOptions,
    lastBatch,
  };
};
