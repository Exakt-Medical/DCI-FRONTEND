import { Card } from "../../../components/Card";
import { User } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { InfoField } from "./InfoField";

export const PersonalInfoCard = ({ formData, isEditing, onChange }) => {
  return (
    <Card className="overflow-hidden">
      <SectionHeader icon={User} title="Personal Information" />
      <div className="p-6 space-y-4">
        <InfoField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Middle Initial"
          name="middleInitial"
          value={formData.middleInitial}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Extension Name"
          name="extName"
          value={formData.extName}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Email Address"
          name="email"
          value={formData.email}
          isEditing={isEditing}
          type="email"
          onChange={onChange}
        />
        <InfoField
          label="Mobile Number"
          name="mobile"
          value={formData.mobile}
          isEditing={isEditing}
          onChange={onChange}
        />
      </div>
    </Card>
  );
};
