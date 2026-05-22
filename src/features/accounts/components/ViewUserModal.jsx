import { Button } from "../../../components/Button";
import { StatusBadge } from "../../../components/StatusBadge";
import { X, Mail, Phone, Building, MapPin, Calendar } from "lucide-react";

export const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>

        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
              <StatusBadge status={user.status} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="text-sm text-gray-900">{user.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm text-gray-900">{user.company}</p>
                <p className="text-xs text-gray-500 mt-1">Branch</p>
                <p className="text-sm text-gray-900">{user.branch}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm text-gray-900">{user.dateCreated}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {user.vouchers}
              </p>
              <p className="text-xs text-gray-500">Total Vouchers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{user.role}</p>
              <p className="text-xs text-gray-500">User Role</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 bg-gray-50 border-t border-gray-100">
          <Button
            onClick={onClose}
            className="bg-primary-500 hover:bg-primary-600"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
