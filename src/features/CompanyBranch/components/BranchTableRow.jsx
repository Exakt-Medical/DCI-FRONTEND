import { Eye, Edit, Power } from "lucide-react";
import { formatDateTime } from "../../../utils/formatDate";

export const BranchTableRow = ({
  branch,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  isViewer,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
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
                    branch.status === "ACTIVE"
                      ? "text-gray-400 hover:text-red-600"
                      : "text-gray-400 hover:text-green-600"
                  }`}
                  title={branch.status === "ACTIVE" ? "Deactivate" : "Activate"}
                >
                  <Power size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">
          {branch.companyName} - {branch.branchName}
        </p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{branch.companyProvider || "—"}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          branch.status === "ACTIVE"
            ? "bg-green-100 text-green-800"
            : branch.status === "INACTIVE"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}>
          {branch.status}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {formatDateTime(branch.dateCreated)}
      </td>
    </tr>
  );
};
