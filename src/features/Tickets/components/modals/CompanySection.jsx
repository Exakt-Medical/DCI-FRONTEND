import { Building2 } from "lucide-react";
import { Card } from "../../../../components/Card";

export const CompanySection = ({ formData, onChange }) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 size={18} className="text-primary-500" />
        Company/Branch Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Company ID
          </label>
          <input
            type="text"
            name="companyInfo.companyId"
            value={formData.companyInfo.companyId}
            onChange={onChange}
            placeholder="Enter company ID"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Company Name
          </label>
          <input
            type="text"
            name="companyInfo.companyName"
            value={formData.companyInfo.companyName}
            onChange={onChange}
            placeholder="Enter company name"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Branch ID</label>
          <input
            type="text"
            name="companyInfo.branchId"
            value={formData.companyInfo.branchId}
            onChange={onChange}
            placeholder="Enter branch ID"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </Card>
  );
};
