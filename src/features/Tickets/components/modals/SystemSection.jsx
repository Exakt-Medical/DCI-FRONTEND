import { AlertCircle } from "lucide-react";
import { Card } from "../../../../components/Card";

export const SystemSection = ({ formData, onChange }) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <AlertCircle size={18} className="text-primary-500" />
        System Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Page/Module
          </label>
          <input
            type="text"
            name="systemInfo.page"
            value={formData.systemInfo.page}
            onChange={onChange}
            placeholder="e.g., Verification, Vouchers, Accounts"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Browser/Device
          </label>
          <input
            type="text"
            name="systemInfo.browser"
            value={formData.systemInfo.browser}
            onChange={onChange}
            placeholder="e.g., Chrome, Safari, Mobile"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </Card>
  );
};
