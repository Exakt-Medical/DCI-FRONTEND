import { useState, useEffect } from "react";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import Switch from "../../../components/Switch";
import { X, UserPlus, Edit2 } from "lucide-react";

export const UserFormModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  isEditing,
  branches = [],
  allUsers = [],
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "AGENT",
    branchId: "",
    managerId: "",
    isactive: true,
    allowedToBuyVoucher: false,
  });

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        username: user.username || "",
        password: "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "AGENT",
        branchId: user.branchId ? String(user.branchId) : "",
        managerId: user.managerId ? String(user.managerId) : "",
        isactive: user.isactive !== undefined ? user.isactive : true,
        allowedToBuyVoucher: user.allowedToBuyVoucher ?? false,
      });
    } else {
      setFormData({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "AGENT",
        branchId: "",
        managerId: "",
        isactive: true,
        allowedToBuyVoucher: false,
      });
    }
  }, [user, isEditing, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isAgentOrSubagent = formData.role === "AGENT" || formData.role === "SUBAGENT";

  const filteredManagers = allUsers.filter(
    (u) => u.role === "MANAGER" && u.isactive && String(u.branchId) === formData.branchId,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-2xl" />
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                {isEditing ? (
                  <Edit2 size={16} className="text-primary-600" />
                ) : (
                  <UserPlus size={16} className="text-primary-600" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? "Edit User" : "Add New User"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Enter username"
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter password"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Enter email address"
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="user-active"
                checked={formData.isactive}
                onChange={(e) =>
                  setFormData({ ...formData, isactive: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="user-active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Active — {formData.isactive ? "Account is active" : "Account is inactive"}
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Branch
              </label>
              <select
                value={formData.branchId}
                onChange={(e) =>
                  setFormData({ ...formData, branchId: e.target.value, managerId: "" })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>

            {isAgentOrSubagent && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Manager
                </label>
                <select
                  value={formData.managerId}
                  onChange={(e) =>
                    setFormData({ ...formData, managerId: e.target.value })
                  }
                  disabled={!formData.branchId}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.branchId ? "Select Manager" : "Select branch first"}
                  </option>
                  {filteredManagers.map((mgr) => {
                    const mgrName = [mgr.firstName, mgr.lastName].filter(Boolean).join(" ") || mgr.username;
                    return (
                      <option key={mgr.id} value={mgr.id}>
                        {mgrName}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value, managerId: "" });
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="MANAGER">Manager</option>
                <option value="AGENT">Agent</option>
                <option value="SUBAGENT">Sub Agent</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Allowed to Buy Voucher
              </label>
              <Switch
                checked={!!formData.allowedToBuyVoucher}
                onChange={(val) => setFormData({ ...formData, allowedToBuyVoucher: val })}
                ariaLabel="Allowed to buy voucher"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
            >
              {isEditing ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
