import { Eye, Edit, Power } from "lucide-react";
import { formatDateTime } from "../../../utils/formatDate";

export const UserTableRow = ({
  user,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  isViewer,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Actions */}
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
                    user.status === "ACTIVE"
                      ? "text-gray-400 hover:text-red-600"
                      : "text-gray-400 hover:text-green-600"
                  }`}
                  title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                >
                  <Power size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="font-medium text-gray-900">{user.username}</p>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {user.role}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : user.status === "INACTIVE"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {user.status}
        </span>
      </td>

      {/* Date Created */}
      <td className="px-4 py-3 text-gray-500 text-xs">
        {formatDateTime(user.dateCreated)}
      </td>
    </tr>
  );
};
