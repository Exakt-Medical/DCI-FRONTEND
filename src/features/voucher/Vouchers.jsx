import { useState, useEffect } from "react";
import { ProductCard } from "./components/ProductCard";
import { PurchaseHistoryTable } from "./components/PurchaseHistoryTable";
import { PurchaseModal } from "./components/PurchaseModal";
import { SuccessModal } from "./components/SuccessModal";
import { voucherService } from "../../services/voucherService";

export default function Vouchers() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedPolicy, setPurchasedPolicy] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("vouchers");

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await voucherService.getProducts();
      setProducts(res.data);
    } catch (e) { console.error("Failed to load products:", e); }
  };

  const loadHistory = async () => {
    try {
      const res = await voucherService.getHistory();
      setPurchaseHistory(res.data);
    } catch (e) { console.error("Failed to load history:", e); }
  };

  const handlePurchase = (product) => {
    setSelectedProduct(product);
    setShowPurchaseModal(true);
  };

  const processPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await voucherService.purchase(selectedProduct.id);
      setPurchasedPolicy(res.data);
      setShowPurchaseModal(false);
      setShowSuccessModal(true);
      loadHistory();
    } catch (e) {
      console.error("Purchase failed:", e);
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
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CTPL Insurance</h1>
        <p className="text-sm text-gray-500">Purchase Compulsory Third Party Liability insurance for LTO vehicle registration</p>
      </div>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${activeTab === "vouchers" ? "text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Available Plans
          {activeTab === "vouchers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${activeTab === "history" ? "text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Purchase History
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{purchaseHistory.length}</span>
          {activeTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>}
        </button>
      </div>
      {activeTab === "vouchers" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} formatCurrency={formatCurrency} onPurchase={handlePurchase} />
          ))}
        </div>
      ) : (
        <PurchaseHistoryTable purchaseHistory={purchaseHistory} formatCurrency={formatCurrency} copyToClipboard={copyToClipboard} />
      )}
      {showPurchaseModal && selectedProduct && (
        <PurchaseModal
          selectedProduct={selectedProduct} formatCurrency={formatCurrency}
          isProcessing={isProcessing} onConfirm={processPayment} onClose={() => setShowPurchaseModal(false)}
        />
      )}
      {showSuccessModal && purchasedPolicy && (
        <SuccessModal
          purchasedPolicy={purchasedPolicy} copied={copied} copyToClipboard={copyToClipboard}
          onViewPolicies={() => { setShowSuccessModal(false); setPurchasedPolicy(null); setActiveTab("history"); }}
        />
      )}
    </div>
  );
}