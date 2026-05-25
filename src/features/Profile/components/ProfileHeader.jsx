import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import {
  User,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Lock,
  LogOut,
  CheckCircle,
  Shield,
  Briefcase,
} from "lucide-react";

const getRoleBadgeColor = (role) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700";
    case "manager":
      return "bg-blue-100 text-blue-700";
    case "agent":
      return "bg-green-100 text-green-700";
    case "viewer":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getRoleIcon = (role) => {
  switch (role) {
    case "admin":
      return <Shield size={16} />;
    case "manager":
      return <Briefcase size={16} />;
    case "agent":
      return <User size={16} />;
    default:
      return <User size={16} />;
  }
};

export const ProfileHeader = ({
  formData,
  role,
  isEditing,
  avatarPreview,
  onAvatarChange,
  onEdit,
  onCancel,
  onSave,
  onChangePassword,
  onLogout,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative">
        <div className="absolute -bottom-12 left-6">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  <User size={40} className="text-primary-600" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50">
              <Camera size={14} className="text-gray-600" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onAvatarChange}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="pt-14 px-6 pb-6">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">
                {formData.fullName}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                  role,
                )}`}
              >
                {getRoleIcon(role)}
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle size={12} />
                {formData.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Joined: {formData.joinDate}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Last Login: {formData.lastLogin}
              </span>
            </div>
          </div>
          {!isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={onChangePassword}
                className="flex items-center gap-2"
              >
                <Lock size={16} /> Change Password
              </Button>
              <Button
                variant="secondary"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} /> Edit Profile
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <X size={16} /> Cancel
              </Button>
              <Button
                onClick={onSave}
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600"
              >
                <Save size={16} /> Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
