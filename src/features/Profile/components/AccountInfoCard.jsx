import { Card } from "../../../components/Card";
import { Shield } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { InfoField } from "./InfoField";

export const AccountInfoCard = ({ formData }) => {
  return (
    <Card className="overflow-hidden">
      <SectionHeader icon={Shield} title="Account Information" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            label="Username"
            name="username"
            value={formData.username}
            isEditing={false}
          />
          <InfoField
            label="Account Type"
            name="role"
            value={formData.role}
            isEditing={false}
          />
        </div>
      </div>
    </Card>
  );
};
