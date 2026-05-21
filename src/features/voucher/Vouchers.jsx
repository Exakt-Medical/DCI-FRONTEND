import { useState, useEffect } from "react";
import { ProductCard } from "./components/ProductCard";
import { PurchaseHistoryTable } from "./components/PurchaseHistoryTable";
import { AssignedVouchersTable } from "./components/AssignedVouchersTable";
import { PurchaseModal } from "./components/PurchaseModal";
import { SuccessModal } from "./components/SuccessModal";
import { voucherService } from "../../services/voucherService";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedPolicy, setPurchasedPolicy] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [assignedVouchers, setAssignedVouchers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(
    viewOnly ? "assigned" : "vouchers",
  );

  useEffect(() => {
    if (viewOnly) {
      loadAssignedVouchers();
    } else {
      loadProducts();
      loadPurchaseHistory();
    }
  }, [viewOnly]);

  const loadProducts = async () => {
    try {
      // Check if service method exists, otherwise use mock data
      if (voucherService.getProducts) {
        const res = await voucherService.getProducts();
        if (res?.data?.length > 0) {
          setProducts(res.data);
          return;
        }
      }
      // Use mock data as fallback
      setProducts(MOCK_PRODUCTS);
    } catch (e) {
      console.error("Failed to load products:", e);
      setProducts(MOCK_PRODUCTS);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      if (voucherService.getHistory) {
        const res = await voucherService.getHistory();
        if (res?.data?.length > 0) {
          setPurchaseHistory(res.data);
          return;
        }
      }
      setPurchaseHistory(MOCK_PURCHASE_HISTORY);
    } catch (e) {
      console.error("Failed to load history:", e);
      setPurchaseHistory(MOCK_PURCHASE_HISTORY);
    }
  };

  const loadAssignedVouchers = async () => {
    try {
      // Use mock data directly since the service method doesn't exist
      setAssignedVouchers(MOCK_ASSIGNED_VOUCHERS);
    } catch (e) {
      console.error("Failed to load assigned vouchers:", e);
      setAssignedVouchers(MOCK_ASSIGNED_VOUCHERS);
    }
  };

  const handlePurchase = (product) => {
    setSelectedProduct(product);
    setShowPurchaseModal(true);
  };

  const handleProceedToPayment = (formData) => {
    setShowPurchaseModal(false);
    if (onNavigate) {
      onNavigate("/payment", {
        state: {
          selectedProduct: selectedProduct,
          formData: formData,
        },
      });
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

  if (viewOnly) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Vouchers</h1>
          <p className="text-sm text-gray-500">
            Vouchers assigned to you by your manager
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            📌 These vouchers have been allocated to you. Use them for customer
            verification.
          </p>
        </div>

        <AssignedVouchersTable
          assignedVouchers={assignedVouchers}
          formatCurrency={formatCurrency}
          copyToClipboard={copyToClipboard}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          CTPL Insurance
        </h1>
        <p className="text-sm text-gray-500">
          Purchase Compulsory Third Party Liability insurance for LTO vehicle
          registration
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === "vouchers"
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Available Plans
          {activeTab === "vouchers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === "history"
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Purchase History
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {purchaseHistory.length}
          </span>
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
          )}
        </button>
      </div>

      {activeTab === "vouchers" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formatCurrency={formatCurrency}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      ) : (
        <PurchaseHistoryTable
          purchaseHistory={purchaseHistory}
          formatCurrency={formatCurrency}
          copyToClipboard={copyToClipboard}
        />
      )}

      {showPurchaseModal && selectedProduct && (
        <PurchaseModal
          selectedProduct={selectedProduct}
          formatCurrency={formatCurrency}
          isProcessing={isProcessing}
          onConfirm={handleProceedToPayment}
          onClose={() => setShowPurchaseModal(false)}
        />
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
        />
      )}
    </div>
  );
}
