import { StatusBadge } from "../../../components/StatusBadge";
import { Copy, CheckCircle, Eye, Edit, Power } from "lucide-react";

export const CompanyTableRow = ({
  company,
  copiedId,
  onCopy,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  isViewer,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-primary-600 text-sm">
          {company.companyId}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{company.companyName}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{company.companyShortname || "-"}</span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={company.approvalStatus} />
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          company.isactive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}>
          {company.isactive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          {isViewer ? (
            <button
              onClick={() => onView(company)}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              title="View Details"
            >
              <Eye size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => onCopy(company.companyId, company.id)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Copy Code"
              >
                {copiedId === company.id ? (
                  <CheckCircle size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <button
                onClick={() => onView(company)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="View Details"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => onEdit(company)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              {onToggleActive && (
                <button
                  onClick={() => onToggleActive(company)}
                  className={`p-1 transition-colors ${
                    company.isactive
                      ? "text-gray-400 hover:text-red-600"
                      : "text-gray-400 hover:text-green-600"
                  }`}
                  title={company.isactive ? "Deactivate" : "Activate"}
                >
                  <Power size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
