import { useState, useEffect } from "react";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { X } from "lucide-react";

export const UserFormModal = ({ isOpen, onClose, onSave, user, isEditing }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    branch: "",
    role: "Agent",
    status: "Active",
    vouchers: 0,
  });

  useEffect(() => {
    if (user && isEditing) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        branch: user.branch || "",
        role: user.role || "Agent",
        status: user.status || "Active",
        vouchers: user.vouchers || 0,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        branch: "",
        role: "Agent",
        status: "Active",
        vouchers: 0,
      });
    }
  }, [user, isEditing, isOpen]);

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
            {isEditing ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
          <Input
            label="Company"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            required
          />
          <Input
            label="Branch"
            value={formData.branch}
            onChange={(e) =>
              setFormData({ ...formData, branch: e.target.value })
            }
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
            >
              <option value="Manager">Manager</option>
              <option value="Agent">Agent</option>
              <option value="Sub Agent">Sub Agent</option>
            </select>
          </div>

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
            </select>
          </div>

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

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update" : "Create"} User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
