import { StatusBadge } from "../../../components/StatusBadge";
import { Copy, CheckCircle, Eye, Edit, Power } from "lucide-react";

export const BranchTableRow = ({
  branch,
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
          {branch.branchId}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{branch.companyName}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{branch.branchName}</p>
        {branch.branchShortname && (
          <p className="text-xs text-gray-400">{branch.branchShortname}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          branch.isactive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}>
          {branch.isactive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {branch.timestamp ? new Date(branch.timestamp).toLocaleDateString() : "-"}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          {isViewer ? (
            <button
              onClick={() => onView(branch)}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              title="View Details"
            >
              <Eye size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => onCopy(branch.branchId, branch.id)}
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
              {onToggleActive && (
                <button
                  onClick={() => onToggleActive(branch)}
                  className={`p-1 transition-colors ${
                    branch.isactive
                      ? "text-gray-400 hover:text-red-600"
                      : "text-gray-400 hover:text-green-600"
                  }`}
                  title={branch.isactive ? "Deactivate" : "Activate"}
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
