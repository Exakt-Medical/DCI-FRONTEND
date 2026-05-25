import { Button } from "../../../components/Button";
import { StatusBadge } from "../../../components/StatusBadge";
import { X, Building, Calendar, Hash } from "lucide-react";

export const CompanyViewModal = ({ isOpen, onClose, company }) => {
  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Company Details</h2>
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
                {company.companyId?.charAt(0) || "C"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{company.companyName}</h3>
            <StatusBadge status={company.approvalStatus} />
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Company ID</p>
                <p className="text-sm font-mono font-bold text-gray-900">
                  {company.companyId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Short Name</p>
                <p className="text-sm text-gray-900">{company.companyShortname || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">{company.timestamp ? new Date(company.timestamp).toLocaleString() : "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
            <span className="text-sm text-gray-600">Active</span>
            <span className={`text-sm font-bold ${company.isactive ? "text-green-600" : "text-red-600"}`}>
              {company.isactive ? "Yes" : "No"}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
            <span className="text-sm text-gray-600">Updated By</span>
            <span className="text-sm font-bold text-gray-900">{company.userstamp || "-"}</span>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
