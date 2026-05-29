import { useState } from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Lock } from "lucide-react";
import { useAlert } from "../../../hooks/useAlert";

export const ChangePasswordModal = ({ isOpen, onClose, onChangePassword }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { error: showError, success: showSuccess } = useAlert();

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("Validation Error", "New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showError("Validation Error", "Password must be at least 6 characters!");
      return;
    }
    if (!passwordData.currentPassword) {
      showError("Validation Error", "Current password is required");
      return;
    }

    setLoading(true);

    const result = await onChangePassword(
      passwordData.currentPassword,
      passwordData.newPassword,
      passwordData.confirmPassword,
    );

    setLoading(false);

    if (result?.success) {
      showSuccess("Success", "Password changed successfully!");
      onClose();
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      showError("Error", result?.error || "Failed to change password");
    }
  };

  const handleClose = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
            <h3 className="font-semibold text-gray-900">Change Password</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
