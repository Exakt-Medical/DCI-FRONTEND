import { Card } from "../../../components/Card";
import { MapPin } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { InfoField } from "./InfoField";

export const AddressInfoCard = ({ formData, isEditing, onChange }) => {
  return (
    <Card className="overflow-hidden">
      <SectionHeader icon={MapPin} title="Address Information" />
      <div className="p-6 space-y-4">
        <InfoField
          label="Street Address"
          name="address"
          value={formData.address}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="Country"
          name="country"
          value={formData.country}
          isEditing={isEditing}
          options={[
            { value: "Philippines", label: "Philippines" },
            { value: "USA", label: "United States" },
            { value: "Singapore", label: "Singapore" },
            { value: "Japan", label: "Japan" },
          ]}
          onChange={onChange}
        />
        <InfoField
          label="Province"
          name="province"
          value={formData.province}
          isEditing={isEditing}
          options={[
            { value: "Metro Manila", label: "Metro Manila" },
            { value: "Cebu", label: "Cebu" },
            { value: "Davao", label: "Davao" },
            { value: "Laguna", label: "Laguna" },
            { value: "Cavite", label: "Cavite" },
            { value: "Bulacan", label: "Bulacan" },
            { value: "Pampanga", label: "Pampanga" },
          ]}
          onChange={onChange}
        />
        <InfoField
          label="City"
          name="city"
          value={formData.city}
          isEditing={isEditing}
          onChange={onChange}
        />
        <InfoField
          label="ZIP Code"
          name="zipCode"
          value={formData.zipCode}
          isEditing={isEditing}
          onChange={onChange}
        />
      </div>
    </Card>
  );
};
