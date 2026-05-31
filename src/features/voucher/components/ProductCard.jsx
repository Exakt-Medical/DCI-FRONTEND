import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Tag, Calendar, Shield, ShoppingCart } from "lucide-react";

export const ProductCard = ({ product, formatCurrency, onPurchase }) => {
  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">
          {product.productName}
        </h3>
        <div className="bg-primary-50 rounded-lg px-2 py-1">
          <p className="text-sm font-bold text-primary-600">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{product.description}</p>

      {/* <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Tag size={12} />
          <span>{product.insuranceCode}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={12} />
          <span>{product.validityDays} days coverage</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield size={12} />
          <span>{product.coverage}</span>
        </div>
      </div> */}

      <Button
        onClick={() => onPurchase(product)}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white"
        size="md"
      >
        <ShoppingCart size={14} className="mr-1" />
        Purchase
      </Button>
    </Card>
  );
};
