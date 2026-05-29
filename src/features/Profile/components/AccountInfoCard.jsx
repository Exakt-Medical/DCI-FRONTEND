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
            label="User ID"
            name="userId"
            value={formData.userId}
            isEditing={false}
          />
          <InfoField
            label="Role"
            name="role"
            value={formData.role}
            isEditing={false}
          />
          <InfoField
            label="Status"
            name="status"
            value={formData.status}
            isEditing={false}
          />
          <InfoField
            label="Branch"
            name="branchName"
            value={formData.branchName}
            isEditing={false}
          />
          <InfoField
            label="Company"
            name="companyName"
            value={formData.companyName}
            isEditing={false}
          />
          <InfoField
            label="Join Date"
            name="dateCreated"
            value={formData.dateCreated}
            isEditing={false}
          />
        </div>
      </div>
    </Card>
  );
};
