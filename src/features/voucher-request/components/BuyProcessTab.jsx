import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { CreditCard, ShoppingCart } from "lucide-react";

const UNIT_PRICE = 500;

export const BuyProcessTab = ({
  quantity,
  onQuantityChange,
  onPurchase,
  isProcessingPayment,
  lastBatch,
}) => {
  const safeQuantity = Math.max(Number(quantity) || 0, 0);
  const total = safeQuantity * UNIT_PRICE;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <ShoppingCart size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">Buy Voucher</h3>
        </div>

        <Input
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          placeholder="Enter number of vouchers"
        />

        <Button onClick={onPurchase} disabled={isProcessingPayment || safeQuantity <= 0} className="w-full">
          <CreditCard size={16} /> {isProcessingPayment ? "Processing Payment..." : "Proceed Payment"}
        </Button>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Purchase Summary</p>
        <p className="text-sm text-blue-900 mt-3">Unit Price: PHP {UNIT_PRICE.toFixed(2)}</p>
        <p className="text-sm text-blue-900">Quantity: {safeQuantity}</p>
        <p className="text-3xl font-black text-blue-900 mt-4">PHP {total.toFixed(2)}</p>
        <p className="text-xs text-blue-700 mt-2">Purchased vouchers are added to Inventory as AVAILABLE.</p>
      </Card>

      {lastBatch && (
        <Card className="xl:col-span-3 p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-700">Purchase successful</p>
          <p className="text-xs text-emerald-700 mt-1">
            Batch {lastBatch.batchId} created with {lastBatch.quantity} voucher{lastBatch.quantity > 1 ? "s" : ""}.
          </p>
        </Card>
      )}
    </div>
  );
};
