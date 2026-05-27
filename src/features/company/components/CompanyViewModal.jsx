import { Button } from "../../../components/Button";
import { X, MapPin, Building2, Hash, Calendar, Briefcase } from "lucide-react";
import { formatDateTime } from "../../../utils/formatDate";

export const CompanyViewModal = ({ isOpen, onClose, company }) => {
  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Company Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white">
                {company.companyName?.charAt(0) || "C"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{company.companyName}</h3>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Code</p>
                <p className="text-sm font-medium text-gray-900">{company.code || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Provider</p>
                <p className="text-sm text-gray-900">{company.provider || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-900">{company.address || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                  company.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : company.status === "INACTIVE"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {company.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <p className="text-sm text-gray-700">This company was created at <span className="font-medium text-gray-900">{formatDateTime(company.dateCreated)}</span></p>
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
