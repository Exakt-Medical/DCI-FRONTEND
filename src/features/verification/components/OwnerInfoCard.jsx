import { Card } from "../../../components/Card";
import { User } from "lucide-react";

export const OwnerInfoCard = ({ ownerData }) => {
  const fields = [
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Middle Name", key: "middleName" },
    { label: "Address", key: "address" },
    { label: "Contact No.", key: "contactNo" },
    { label: "Email", key: "email" },
    { label: "TIN", key: "tin" }
  ];

  return (
    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <User size={18} className="text-primary-600" />
        <h3 className="text-base font-bold text-gray-900">Owner Information</h3>
        <span className="text-xs text-green-600 ml-auto">✓ Auto-populated from LTO</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.key} className="bg-gray-50 rounded-lg p-3">
            <label className="text-xs text-gray-500 block mb-1">{field.label}</label>
            <p className="text-sm font-medium text-gray-900">{ownerData[field.key] || "—"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};