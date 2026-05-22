import { Button } from "../../../components/Button";
import { StatusBadge } from "../../../components/StatusBadge";
import { X, Building, Phone, MapPin, User, Calendar, Hash } from "lucide-react";

export const BranchViewModal = ({ isOpen, onClose, branch }) => {
  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Branch Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Branch Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {branch.branch.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                {branch.branch}
              </h3>
              <p className="text-sm text-gray-500">{branch.name}</p>
              <div className="mt-1">
                <StatusBadge status={branch.status} />
              </div>
            </div>
          </div>

          {/* Branch Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Hash size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Branch Code</p>
                <p className="text-sm font-mono font-medium text-gray-900">
                  {branch.code}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Company Name</p>
                <p className="text-sm text-gray-900">{branch.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900">{branch.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Contact Number</p>
                <p className="text-sm text-gray-900">{branch.contact}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Branch Manager</p>
                <p className="text-sm text-gray-900">{branch.manager}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Date Created</p>
                <p className="text-sm text-gray-900">{branch.dateCreated}</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {branch.vouchers?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">Total Vouchers</p>
            </div>
          </div>
        </div>

        {/* Footer */}
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
