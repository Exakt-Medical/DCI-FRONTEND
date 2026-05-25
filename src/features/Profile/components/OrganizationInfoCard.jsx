import { Card } from "../../../components/Card";
import { Building2 } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { InfoField } from "./InfoField";

export const OrganizationInfoCard = ({ formData, isEditing, onChange }) => {
  return (
    <Card className="overflow-hidden">
      <SectionHeader icon={Building2} title="Organization Information" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InfoField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              isEditing={isEditing}
              onChange={onChange}
            />
          </div>
          <InfoField
            label="Position Role"
            name="position"
            value={formData.position}
            isEditing={isEditing}
            options={[
              { value: "Admin", label: "Admin" },
              { value: "Manager", label: "Manager" },
              { value: "Agent", label: "Agent" },
              { value: "Sub-Agent", label: "Sub-Agent" },
            ]}
            onChange={onChange}
          />
          <InfoField
            label="Department"
            name="department"
            value={formData.department}
            isEditing={isEditing}
            onChange={onChange}
          />
          <InfoField
            label="Employee ID"
            name="employeeId"
            value={formData.employeeId}
            isEditing={false}
            onChange={onChange}
          />
        </div>
      </div>
    </Card>
  );
};
