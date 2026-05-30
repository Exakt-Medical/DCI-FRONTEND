// features/voucher/Vouchers.jsx (UPDATED - Only Basic CTPL)
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

  // Only Basic CTPL product
  const BASIC_CTPL_PRODUCT = {
    id: "prod_001",
    productName: "Basic CTPL",
    description: "Basic coverage for third party liability as required by LTO",
    price: 60,
    insuranceCode: "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
    validityDays: 365,
    coverage: "Third Party Liability",
    stock: 999999,
  };

  // Check for payment success callback on mount
  useEffect(() => {
    // Check if coming from payment success
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment_status");
    const transactionId = urlParams.get("transaction_id");

    if (paymentStatus === "success" && transactionId) {
      createPolicyFromPayment(transactionId);
      // Remove query params from URL
      window.location.href = window.location.pathname;
    }

    loadProducts();
    loadPurchaseHistory();
    loadAssignedVouchers();
  }, []);

  const createPolicyFromPayment = (transactionId) => {
    const newPolicy = {
      id: `hist_${Date.now()}`,
      policyNumber: `POL-${new Date().getFullYear()}${Math.floor(Math.random() * 1000000)}`,
      productName: "Basic CTPL",
      premium: 60 * selectedQuantity,
      expirationDate: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      )
        .toISOString()
        .split("T")[0],
      status: "Available",
      voucherCode: `VCH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      purchaseDate: new Date().toISOString().split("T")[0],
      transactionId: transactionId,
      quantity: selectedQuantity,
    };

    const newAssignedVoucher = {
      id: `vch_${Date.now()}`,
      voucherCode: newPolicy.voucherCode,
      productName: "Basic CTPL",
      premium: 60,
      status: "Available",
      assignedBy: "Self Purchase",
      assignedDate: new Date().toISOString().split("T")[0],
      expiryDate: newPolicy.expirationDate,
      assignedTo: email || "user@example.com",
    };

    setPurchaseHistory((prev) => [newPolicy, ...prev]);
    setAssignedVouchers((prev) => [newAssignedVoucher, ...prev]);

    // Save to localStorage
    localStorage.setItem(
      "purchaseHistory",
      JSON.stringify([newPolicy, ...purchaseHistory]),
    );
    localStorage.setItem(
      "assignedVouchers",
      JSON.stringify([newAssignedVoucher, ...assignedVouchers]),
    );

    setPurchasedPolicy(newPolicy);
    setShowSuccessModal(true);
  };

  const loadProducts = async () => {
    // Always use Basic CTPL product only
    setProducts([BASIC_CTPL_PRODUCT]);
  };

  const loadPurchaseHistory = async () => {
    try {
      // Check localStorage for persistence
      const storedHistory = localStorage.getItem("purchaseHistory");
      if (storedHistory) {
        setPurchaseHistory(JSON.parse(storedHistory));
        return;
      }

      // Fallback to mock data
      const mockData = Array.isArray(MOCK_PURCHASE_HISTORY)
        ? MOCK_PURCHASE_HISTORY
        : [];
      setPurchaseHistory(mockData);
      localStorage.setItem("purchaseHistory", JSON.stringify(mockData));
    } catch (e) {
      console.error("Failed to load history:", e);
      setPurchaseHistory([]);
    }
  };

  const loadAssignedVouchers = async () => {
    try {
      // Check localStorage for persistence
      const storedVouchers = localStorage.getItem("assignedVouchers");
      if (storedVouchers) {
        setAssignedVouchers(JSON.parse(storedVouchers));
        return;
      }

      // Fallback to mock data
      const mockData = Array.isArray(MOCK_ASSIGNED_VOUCHERS)
        ? MOCK_ASSIGNED_VOUCHERS
        : [];
      setAssignedVouchers(mockData);
      localStorage.setItem("assignedVouchers", JSON.stringify(mockData));
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

    // For demo purposes, simulate payment success
    setTimeout(() => {
      const newPolicy = {
        id: `hist_${Date.now()}`,
        policyNumber: `POL-${new Date().getFullYear()}${Math.floor(Math.random() * 1000000)}`,
        productName: "Basic CTPL",
        premium: 60 * quantity,
        expirationDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        )
          .toISOString()
          .split("T")[0],
        status: "Available",
        voucherCode: `VCH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        purchaseDate: new Date().toISOString().split("T")[0],
        transactionId: `TXN-${Date.now()}`,
        quantity: quantity,
      };

      // Create multiple voucher codes if quantity > 1
      const newVouchers = [];
      for (let i = 0; i < quantity; i++) {
        newVouchers.push({
          id: `vch_${Date.now()}_${i}`,
          voucherCode: `VCH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          productName: "Basic CTPL",
          premium: 60,
          status: "Available",
          assignedBy: "Self Purchase",
          assignedDate: new Date().toISOString().split("T")[0],
          expiryDate: newPolicy.expirationDate,
          assignedTo: email || "user@example.com",
        });
      }

      setPurchaseHistory((prev) => [newPolicy, ...prev]);
      setAssignedVouchers((prev) => [...newVouchers, ...prev]);

      // Save to localStorage
      const updatedHistory = [newPolicy, ...purchaseHistory];
      const updatedVouchers = [...newVouchers, ...assignedVouchers];
      localStorage.setItem("purchaseHistory", JSON.stringify(updatedHistory));
      localStorage.setItem("assignedVouchers", JSON.stringify(updatedVouchers));

      setPurchasedPolicy(newPolicy);
      setShowSuccessModal(true);
      setIsProcessing(false);
    }, 2000);
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
            Purchase Vouchers
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
          }}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}
