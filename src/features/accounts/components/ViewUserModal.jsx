import { Button } from "../../../components/Button";
import { StatusBadge } from "../../../components/StatusBadge";
import { X, Mail, Building, MapPin, Calendar, User } from "lucide-react";

export const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white">
                {displayName.charAt(0)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.isactive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {user.isactive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{user.email || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm text-gray-900">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Branch</p>
                <p className="text-sm text-gray-900">{user.branchName || "-"}</p>
              </div>
            </div>

            {user.managerName && (
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Manager</p>
                  <p className="text-sm text-gray-900">{user.managerName}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">
                  {user.timestamp ? new Date(user.timestamp).toLocaleString() : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
            <span className="text-sm text-gray-600">User ID</span>
            <span className="text-sm font-bold text-gray-900">{user.userId || "-"}</span>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
