import { StatusBadge } from "../../../components/StatusBadge";
import { Copy, CheckCircle, Eye, Edit, Power } from "lucide-react";

export const UserTableRow = ({
  user,
  copiedId,
  onCopy,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  isViewer,
}) => {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">@{user.username}</p>
          {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {user.role}
        </span>
      </td>
      {["AGENT", "SUBAGENT"].includes(user.role) && (
        <td className="px-4 py-3">
          <span className="text-sm text-gray-700">{user.managerName || "-"}</span>
        </td>
      )}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.isactive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}>
          {user.isactive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {user.timestamp ? new Date(user.timestamp).toLocaleDateString() : "-"}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          {isViewer ? (
            <button
              onClick={() => onView(user)}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              title="View Details"
            >
              <Eye size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => onCopy(user.email || user.username, user.id)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Copy Email"
              >
                {copiedId === user.id ? (
                  <CheckCircle size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <button
                onClick={() => onView(user)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="View Details"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => onEdit(user)}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              {onToggleActive && (
                <button
                  onClick={() => onToggleActive(user)}
                  className={`p-1 transition-colors ${
                    user.isactive
                      ? "text-gray-400 hover:text-red-600"
                      : "text-gray-400 hover:text-green-600"
                  }`}
                  title={user.isactive ? "Deactivate" : "Activate"}
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
