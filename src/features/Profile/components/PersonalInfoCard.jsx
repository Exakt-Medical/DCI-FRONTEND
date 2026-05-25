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
          label="Full Name"
          name="fullName"
          value={formData.fullName}
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
          label="Phone Number"
          name="phone"
          value={formData.phone}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Mobile Number"
          name="mobile"
          value={formData.mobile}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Birth Date"
          name="birthDate"
          value={formData.birthDate}
          isEditing={isEditing}
          type="date"
          onChange={onChange}
        />
        <InfoField
          label="Gender"
          name="gender"
          value={formData.gender}
          isEditing={isEditing}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other", label: "Other" },
          ]}
          onChange={onChange}
        />
      </div>
    </Card>
  );
};
