import { User } from "lucide-react";
import { Card } from "../../../../components/Card";

export const RequestorInfoSection = ({ formData, onChange }) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User size={18} className="text-primary-500" />
        Requestor Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">
            Full Name *
          </label>
          <input
            type="text"
            name="requestedBy.name"
            value={formData.requestedBy.name}
            onChange={onChange}
            placeholder="Enter full name"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">
            Email Address *
          </label>
          <input
            type="email"
            name="requestedBy.email"
            value={formData.requestedBy.email}
            onChange={onChange}
            placeholder="Enter email address"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
      </div>
    </Card>
  );
};
