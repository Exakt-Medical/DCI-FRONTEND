import { Ticket } from "lucide-react";
import { Card } from "../../../../components/Card";

export const VoucherSection = ({ formData, onChange }) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Ticket size={18} className="text-primary-500" />
        Voucher Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Transaction Code
          </label>
          <input
            type="text"
            name="voucherInfo.voucherCode"
            value={formData.voucherInfo.voucherCode}
            onChange={onChange}
            placeholder="Enter transaction code"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Policy Number
          </label>
          <input
            type="text"
            name="voucherInfo.policyNumber"
            value={formData.voucherInfo.policyNumber}
            onChange={onChange}
            placeholder="Enter policy number"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </Card>
  );
};
