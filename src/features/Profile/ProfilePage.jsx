import { useState } from "react";
import { Card } from "../../components/Card";
import { ProfileHeader } from "../Profile/components/ProfileHeader";
import { PersonalInfoCard } from "../Profile/components/PersonalInfoCard";
import { AddressInfoCard } from "../Profile/components/AddressInfoCard";
import { OrganizationInfoCard } from "../Profile/components/OrganizationInfoCard";
import { AccountInfoCard } from "../Profile/components/AccountInfoCard";
import { ChangePasswordModal } from "../Profile/components/ChangePasswordModal";

export const ProfilePage = ({
  user,
  role,
  onUpdateProfile,
  onChangePassword,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "Juan M. Dela Cruz",
    email: user?.email || "juan.delacruz@example.com",
    phone: user?.phone || "+63 912 345 6789",
    mobile: user?.mobile || "+63 912 345 6789",
    birthDate: user?.birthDate || "1985-06-15",
    gender: user?.gender || "Male",
    address: user?.address || "123 Rizal Street, Barangay San Antonio",
    city: user?.city || "Makati City",
    province: user?.province || "Metro Manila",
    zipCode: user?.zipCode || "1200",
    country: user?.country || "Philippines",
    companyName: user?.companyName || "VVIP CTPL Insurance Corp",
    position: user?.position || "Agent",
    department: user?.department || "Sales",
    employeeId: user?.employeeId || "EMP-2024-00123",
    username: user?.username || "juan.delacruz",
    role: user?.role || role,
    status: user?.status || "Active",
    joinDate: user?.joinDate || "2024-01-15",
    lastLogin: user?.lastLogin || "2024-12-10 09:30 AM",
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdateProfile?.(formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          VVIP CTPL Profile
        </h1>
        <p className="text-sm text-gray-500">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="space-y-6">
        <ProfileHeader
          formData={formData}
          role={role}
          isEditing={isEditing}
          avatarPreview={avatarPreview}
          onAvatarChange={handleAvatarChange}
          onEdit={() => setIsEditing(true)}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
          onChangePassword={() => setShowChangePassword(true)}
          onLogout={onLogout}
        />

        {/* Row 1: Personal Information & Address Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PersonalInfoCard
            formData={formData}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          <AddressInfoCard
            formData={formData}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
        </div>

        {/* Row 2: Organization Information & Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationInfoCard
            formData={formData}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          <AccountInfoCard formData={formData} />
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onChangePassword={onChangePassword}
      />
    </div>
  );
};
