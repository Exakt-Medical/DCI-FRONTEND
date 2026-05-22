import { StatusBadge } from "../../../components/StatusBadge";
import { Copy, CheckCircle, Eye, Edit } from "lucide-react";

export const CompanyTableRow = ({
  company,
  copiedId,
  onCopy,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono font-bold text-primary-600 text-sm">
          {company.code}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{company.name}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{company.provider}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">
          {company.vouchers.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={company.status} />
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{company.dateCreated}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onCopy(company.code, company.id)}
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
        </div>
      </td>
    </tr>
  );
};
