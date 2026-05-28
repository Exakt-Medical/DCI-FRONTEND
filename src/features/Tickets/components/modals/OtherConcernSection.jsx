// components/modals/OtherConcernSection.jsx
import { HelpCircle } from "lucide-react";
import { Card } from "../../../../components/Card";

export const OtherConcernSection = ({ formData, onChange }) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <HelpCircle size={18} className="text-primary-500" />
        Concern Details
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Category *
          </label>
          <select
            name="otherInfo.category"
            value={formData.otherInfo.category}
            onChange={onChange}
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Select category</option>
            <option value="account">Account Problem</option>
            <option value="voucher">Voucher Problem</option>
            <option value="company">Company/Branch Issue</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Additional Details
          </label>
          <textarea
            name="otherInfo.details"
            value={formData.otherInfo.details}
            onChange={onChange}
            placeholder="Please provide more details about your issue..."
            rows={3}
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>
      </div>
    </Card>
  );
};
