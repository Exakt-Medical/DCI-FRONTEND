// components/modals/ConcernTypeSelector.jsx
import {
  Car,
  Users,
  Ticket,
  Building2,
  AlertCircle,
  FileText,
  Lock,
} from "lucide-react";
import { Card } from "../../../../components/Card";

// Login-specific concern types
const loginConcernTypes = [
  {
    id: "login",
    label: "Can't Login",
    icon: Lock,
    description:
      "Unable to access your account, forgot password, or account locked",
  },
  {
    id: "account",
    label: "Account Issue",
    icon: Users,
    description:
      "Wrong role assigned, account not activated, or permission issues",
  },
  {
    id: "other",
    label: "Other Concern",
    icon: FileText,
    description: "Other login or access-related issues",
  },
];

// Full concern types for regular ticket creation
const fullConcernTypes = [
  {
    id: "vehicle",
    label: "Vehicle Issue",
    icon: Car,
    description:
      "Problems with vehicle registration, LTO data mismatch, or vehicle information",
  },
  {
    id: "account",
    label: "Account Problem",
    icon: Users,
    description: "Login issues, account access, role/permission problems",
  },
  {
    id: "voucher",
    label: "Voucher Problem",
    icon: Ticket,
    description:
      "Issues with voucher redemption, expiration, or missing vouchers",
  },
  {
    id: "company",
    label: "Company/Branch Issue",
    icon: Building2,
    description: "Problems with company or branch information",
  },
  {
    id: "system",
    label: "System Error",
    icon: AlertCircle,
    description: "Technical issues, bugs, or system errors",
  },
  {
    id: "other",
    label: "Other Concern",
    icon: FileText,
    description: "Other inquiries or concerns",
  },
];

export const ConcernTypeSelector = ({
  selectedType,
  onTypeChange,
  isLoginPageMode = false,
}) => {
  const concernTypes = isLoginPageMode ? loginConcernTypes : fullConcernTypes;

  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <AlertCircle size={18} className="text-primary-500" />
        Concern Type *
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {concernTypes.map((concern) => {
          const Icon = concern.icon;
          const isSelected = selectedType === concern.id;
          return (
            <button
              key={concern.id}
              type="button"
              onClick={() => onTypeChange(concern.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={18}
                  className={isSelected ? "text-primary-500" : "text-gray-400"}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${isSelected ? "text-primary-600" : "text-gray-900"}`}
                  >
                    {concern.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {concern.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
