import { StatusBadge } from "../../../components/StatusBadge";
import { Copy, CheckCircle, Eye, Edit } from "lucide-react";

export const BranchTableRow = ({
  branch,
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
          {branch.code}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{branch.name}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{branch.branch}</p>
        <p className="text-xs text-gray-400 truncate max-w-[200px]">
          {branch.address}
        </p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{branch.manager}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">
          {branch.vouchers.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={branch.status} />
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{branch.dateCreated}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onCopy(branch.code, branch.id)}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="Copy Code"
          >
            {copiedId === branch.id ? (
              <CheckCircle size={14} />
            ) : (
              <Copy size={14} />
            )}
          </button>
          <button
            onClick={() => onView(branch)}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEdit(branch)}
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
