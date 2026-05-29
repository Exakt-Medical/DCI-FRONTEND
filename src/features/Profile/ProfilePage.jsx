import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { ProfileHeader } from "../Profile/components/ProfileHeader";
import { PersonalInfoCard } from "../Profile/components/PersonalInfoCard";
import { AccountInfoCard } from "../Profile/components/AccountInfoCard";
import { ChangePasswordModal } from "../Profile/components/ChangePasswordModal";
import { useProfile } from "../../hooks/useProfile";
import { useAlert } from "../../hooks/useAlert"; // ADD THIS

export const ProfilePage = ({ onLogout }) => {
  const {
    profile,
    loading,
    error,
    updateProfile,
    changePassword,
    uploadAvatar,
  } = useProfile();

  const { success: showSuccess, error: showError } = useAlert(); // ADD THIS

  const userRole = localStorage.getItem("role") || "";

  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleInitial: "",
    extName: "",
    email: "",
    mobile: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        middleInitial: profile.middleInitial || "",
        extName: profile.extName || "",
        email: profile.email || "",
        mobile: profile.mobile || "",
      });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      const result = await uploadAvatar(file);
      if (!result.success) {
        showError("Upload Failed", result.error || "Failed to upload avatar");
      } else {
        showSuccess("Success", "Avatar uploaded successfully!");
      }
    }
  };

  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
      showSuccess("Success", "Profile updated successfully!");
    } else {
      showError("Error", "Error updating profile: " + result.error);
    }
  };

  const handleChangePassword = async (
    currentPassword,
    newPassword,
    confirmPassword,
  ) => {
    const result = await changePassword(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const fullName =
    `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
  const role = profile?.role || userRole;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="space-y-6">
        <ProfileHeader
          formData={{ ...formData, fullName }}
          role={role}
          isEditing={isEditing}
          avatarPreview={avatarPreview || profile?.avatarUrl}
          onAvatarChange={handleAvatarChange}
          onEdit={() => setIsEditing(true)}
          onCancel={() => {
            setIsEditing(false);
            if (profile) {
              setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                middleInitial: profile.middleInitial || "",
                extName: profile.extName || "",
                email: profile.email || "",
                mobile: profile.mobile || "",
              });
            }
          }}
          onSave={handleSave}
          onChangePassword={() => setShowChangePassword(true)}
          onLogout={onLogout}
          joinDate={profile?.dateCreated}
        />

        {/* Row 1: Personal Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PersonalInfoCard
            formData={formData}
            isEditing={isEditing}
            onChange={handleInputChange}
          />
          <AccountInfoCard
            formData={{
              username: profile?.username,
              role: profile?.role,
              userId: profile?.userId,
              status: profile?.status,
              branchName: profile?.branchName,
              companyName: profile?.branchCompanyName,
              dateCreated: profile?.dateCreated,
            }}
          />
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};
