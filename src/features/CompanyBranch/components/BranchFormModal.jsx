import { useState, useEffect } from "react";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { X, MapPin, Edit2, Building2 } from "lucide-react";

export const BranchFormModal = ({
  isOpen,
  onClose,
  onSave,
  branch,
  isEditing,
  companies,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    branch: "",
    address: "",
    contact: "",
    manager: "",
    status: "Active",
    vouchers: 0,
  });

  useEffect(() => {
    if (branch && isEditing) {
      setFormData({
        code: branch.code || "",
        name: branch.name || "",
        branch: branch.branch || "",
        address: branch.address || "",
        contact: branch.contact || "",
        manager: branch.manager || "",
        status: branch.status || "Active",
        vouchers: branch.vouchers || 0,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        branch: "",
        address: "",
        contact: "",
        manager: "",
        status: "Active",
        vouchers: 0,
      });
    }
  }, [branch, isEditing, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header with gradient accent */}
        <div className="sticky top-0 bg-white z-10">
          {" "}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-2xl" />
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                {isEditing ? (
                  <Edit2 size={16} className="text-primary-600" />
                ) : (
                  <MapPin size={16} className="text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? "Edit Branch" : "Add New Branch"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in the branch details below
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company Selection - Full Width */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Company <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <select
                  value={formData.code}
                  onChange={(e) => {
                    const selectedCompany = companies.find(
                      (c) => c.code === e.target.value,
                    );
                    setFormData({
                      ...formData,
                      code: e.target.value,
                      name: selectedCompany?.name || "",
                    });
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.code}>
                      {company.code} - {company.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {formData.name && (
                <p className="text-xs text-primary-600">
                  Selected: <span className="font-medium">{formData.name}</span>
                </p>
              )}
            </div>

            {/* Branch Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter branch name"
              />
            </div>

            {/* Branch Manager */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Branch Manager <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) =>
                  setFormData({ ...formData, manager: e.target.value })
                }
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter branch manager name"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="02-8123-4567"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>

            {/* Initial Vouchers */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Initial Vouchers
              </label>
              <input
                type="number"
                value={formData.vouchers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vouchers: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Address - Full Width */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                placeholder="Enter complete address"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
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
              {isEditing ? "Update Branch" : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
