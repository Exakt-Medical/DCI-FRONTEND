import { useState, useEffect } from "react";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Branch" : "Add New Branch"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Company
            </label>
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
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
              required
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.code}>
                  {company.code} - {company.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Branch Name"
            value={formData.branch}
            onChange={(e) =>
              setFormData({ ...formData, branch: e.target.value })
            }
            required
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            required
          />

          <Input
            label="Contact Number"
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
            required
          />

          <Input
            label="Branch Manager"
            value={formData.manager}
            onChange={(e) =>
              setFormData({ ...formData, manager: e.target.value })
            }
            required
          />

          <Input
            label="Initial Vouchers"
            type="number"
            value={formData.vouchers}
            onChange={(e) =>
              setFormData({
                ...formData,
                vouchers: parseInt(e.target.value) || 0,
              })
            }
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update" : "Create"} Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
