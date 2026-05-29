import { useState, useEffect } from "react";
import { ProductCard } from "./components/ProductCard";
import { PurchaseHistoryTable } from "./components/PurchaseHistoryTable";
import { AssignedVouchersTable } from "./components/AssignedVouchersTable";
import { PurchaseModal } from "./components/PurchaseModal";
import { SuccessModal } from "./components/SuccessModal";
import { PaymentModal } from "./components/PaymentModal";
import { ThankYouPage } from "./components/ThankYouPage";
import { Portal } from "../../components/Portal";
import { voucherService } from "../../services/voucherService";
import { paymentsService } from "../../services/paymentsService";
import {
  MOCK_ASSIGNED_VOUCHERS,
  MOCK_PRODUCTS,
  MOCK_PURCHASE_HISTORY,
} from "../../constants/mockData";

export default function Vouchers({
  viewOnly = false,
  userRole = "agent",
  onNavigate,
}) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedPolicy, setPurchasedPolicy] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [assignedVouchers, setAssignedVouchers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("vouchers");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [paymentReference, setPaymentReference] = useState("");
  const [generatedVouchers, setGeneratedVouchers] = useState([]);
  const [paymentError, setPaymentError] = useState(null);

  const email = localStorage.getItem("email");
  const firstname = localStorage.getItem("firstname");
  const lastname = localStorage.getItem("lastname");

  // Primary color constant
  const primaryColor = "#1a3a6b";

  useEffect(() => {
    loadProducts();
    loadPurchaseHistory();
    loadAssignedVouchers();
  }, []);

  const loadProducts = async () => {
    try {
      if (voucherService.getProducts) {
        const res = await voucherService.getProducts();
        // Ensure we're setting an array
        if (res?.data && Array.isArray(res.data)) {
          setProducts(res.data);
          return;
        }
      }
      // Fallback to mock data
      setProducts(Array.isArray(MOCK_PRODUCTS) ? MOCK_PRODUCTS : []);
    } catch (e) {
      console.error("Failed to load products:", e);
      setProducts(Array.isArray(MOCK_PRODUCTS) ? MOCK_PRODUCTS : []);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      if (voucherService.getHistory) {
        const res = await voucherService.getHistory();
        if (res?.data && Array.isArray(res.data)) {
          setPurchaseHistory(res.data);
          return;
        }
      }
      setPurchaseHistory(
        Array.isArray(MOCK_PURCHASE_HISTORY) ? MOCK_PURCHASE_HISTORY : [],
      );
    } catch (e) {
      console.error("Failed to load history:", e);
      setPurchaseHistory(
        Array.isArray(MOCK_PURCHASE_HISTORY) ? MOCK_PURCHASE_HISTORY : [],
      );
    }
  };

  const loadAssignedVouchers = async () => {
    try {
      setAssignedVouchers(
        Array.isArray(MOCK_ASSIGNED_VOUCHERS) ? MOCK_ASSIGNED_VOUCHERS : [],
      );
    } catch (e) {
      console.error("Failed to load assigned vouchers:", e);
      setAssignedVouchers([]);
    }
  };

  const handlePurchase = (product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setShowPurchaseModal(true);
  };

  const handleProceedToPayment = async (quantity) => {
    setSelectedQuantity(quantity);
    setShowPurchaseModal(false);
    setPaymentError(null);
    setIsProcessing(true);

    try {
      const callbackUrl = `${window.location.origin}/thankyoupage`;

      const paymentRequest = {
        customer: {
          contact: {
            email: email ?? "",
            mobile: "",
          },
          first_name: firstname ?? "",
          last_name: lastname ?? "",
          billing_address: {
            line1: "",
            line2: "",
            zip: "",
            city_municipality: "",
            state_province_region: "",
            country_code: "PH",
          },
        },
        payment: {
          description: selectedProduct
            ? `Payment for ${selectedProduct.productName}`
            : "Payment for a product",
          amount: selectedProduct
            ? String(selectedProduct.price * quantity)
            : "100",
          currency: "PHP",
          merchant_reference_id: `AAZ-INV-${Date.now()}`,
        },
        route: {
          callback_url: callbackUrl,
          notify_user: true,
        },
      };

      const response = await paymentsService.createTlpePayment(paymentRequest);
      const paymentLink = response?.data?.link;

      if (!paymentLink) {
        throw new Error("No payment link returned from the server.");
      }

      // Redirect in the same tab
      window.location.href = paymentLink;
    } catch (error) {
      console.error("Payment failed:", error);
      setPaymentError(
        error?.response?.data?.message ||
          error?.message ||
          "Payment initiation failed. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Add a safety check before rendering products
  const safeProducts = Array.isArray(products) ? products : [];
  const safePurchaseHistory = Array.isArray(purchaseHistory)
    ? purchaseHistory
    : [];
  const safeAssignedVouchers = Array.isArray(assignedVouchers)
    ? assignedVouchers
    : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">CTPL Insurance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Purchase Compulsory Third Party Liability insurance for LTO vehicle
          registration
        </p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "vouchers"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Available Plans
            {activeTab === "vouchers" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "history"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Purchase History
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {safePurchaseHistory.length}
            </span>
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("assigned")}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === "assigned"
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Vouchers
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {safeAssignedVouchers.length}
            </span>
            {activeTab === "assigned" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {activeTab === "vouchers" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formatCurrency={formatCurrency}
              onPurchase={handlePurchase}
              primaryColor={primaryColor}
            />
          ))}
          {safeProducts.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No products available at the moment.
            </div>
          )}
        </div>
      ) : activeTab === "assigned" ? (
        <AssignedVouchersTable
          assignedVouchers={safeAssignedVouchers}
          formatCurrency={formatCurrency}
          copyToClipboard={copyToClipboard}
        />
      ) : (
        <PurchaseHistoryTable
          purchaseHistory={safePurchaseHistory}
          formatCurrency={formatCurrency}
          copyToClipboard={copyToClipboard}
        />
      )}

      {showPurchaseModal && selectedProduct && (
        <Portal>
          <PurchaseModal
            selectedProduct={selectedProduct}
            formatCurrency={formatCurrency}
            isProcessing={isProcessing}
            paymentError={paymentError}
            onConfirm={handleProceedToPayment}
            onClose={() => {
              setShowPurchaseModal(false);
              setPaymentError(null);
            }}
            selectedQuantity={selectedQuantity}
            onQuantityChange={setSelectedQuantity}
            primaryColor={primaryColor}
          />
        </Portal>
      )}

      {showThankYou && (
        <Portal>
          <ThankYouPage
            selectedProduct={selectedProduct}
            quantity={selectedQuantity}
            formatCurrency={formatCurrency}
            primaryColor={primaryColor}
          />
        </Portal>
      )}

      {showSuccessModal && purchasedPolicy && (
        <SuccessModal
          purchasedPolicy={purchasedPolicy}
          copied={copied}
          copyToClipboard={copyToClipboard}
          onViewPolicies={() => {
            setShowSuccessModal(false);
            setPurchasedPolicy(null);
            setActiveTab("history");
            setPurchaseHistory([purchasedPolicy, ...safePurchaseHistory]);
          }}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}
