import DCI_LOGO from "../../assets/DCI-LOGO.png";
import { VoucherTabs } from "./components/VoucherTabs";
import { BuyProcessTab } from "./components/BuyProcessTab";
import { InventoryTab } from "./components/InventoryTab";
import { useVoucherInventory } from "./hooks/useVoucherInventory";
import { useRequest } from "../../context/RequestContext";

export const AgentBuyVoucherPage = () => {
  const { voucherInventory, setVoucherInventory } = useRequest();

  const {
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
  } = useVoucherInventory({
    inventory: voucherInventory,
    onInventoryChange: setVoucherInventory,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 border border-gray-100">
        <img src={DCI_LOGO} alt="DCI" className="h-10" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Voucher</h1>
          <p className="text-sm text-gray-500">Purchase vouchers in bulk and manage their inventory status.</p>
        </div>
      </div>

      <VoucherTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "buy" ? (
        <BuyProcessTab
          quantity={quantity}
          onQuantityChange={setQuantity}
          onPurchase={handlePurchase}
          isProcessingPayment={isProcessingPayment}
          lastBatch={lastBatch}
        />
      ) : (
        <InventoryTab
          summary={summary}
          filterOptions={filterOptions}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          rows={filteredRows}
        />
      )}
    </div>
  );
};
