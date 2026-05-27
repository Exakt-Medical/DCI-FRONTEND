import { Button } from "../../../components/Button";
import { X, Mail, Building, User as UserIcon, Calendar, Smartphone, ShieldCheck } from "lucide-react";
import { formatDateTime } from "../../../utils/formatDate";

export const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const getFullName = () => {
    const parts = [user.firstName, user.middleInitial, user.lastName, user.extName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : user.username;
  };

  const getCompanyBranch = () => {
    if (user.role === "ADMIN" || user.role === "SUPPORT" || user.role === "VIEWER") {
      return "Not assigned";
    }
    if (user.role === "AGENT" || user.role === "SUBAGENT") {
      return user.managerBranchCompanyName && user.managerBranchName
        ? `${user.managerBranchCompanyName} / ${user.managerBranchName}`
        : "Not assigned";
    }
    return user.branchCompanyName && user.branchName
      ? `${user.branchCompanyName} / ${user.branchName}`
      : "Not assigned";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-500">{getFullName()}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : user.status === "INACTIVE"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {user.status}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{user.email || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Smartphone size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <p className="text-sm text-gray-900">{user.mobile || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserIcon size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm text-gray-900">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Company / Branch</p>
                <p className="text-sm text-gray-900">{getCompanyBranch()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserIcon size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Manager</p>
                <p className="text-sm text-gray-900">{user.managerName || "None"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Buy Voucher Allowed</p>
                <p className="text-sm text-gray-900">{user.isBuyVoucherAllowed ? "Yes" : "No"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-700">This account was created at <span className="font-medium text-gray-900">{user.dateCreated ? formatDateTime(user.dateCreated) : "-"}</span></p>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
