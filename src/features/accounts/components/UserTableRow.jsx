import { StatusBadge } from "../../../components/StatusBadge";
import { Copy, CheckCircle, Eye, Edit } from "lucide-react";

export const UserTableRow = ({
  user,
  copiedId,
  onCopy,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">
            {user.company} - {user.branch}
          </p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{user.role}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">
          {user.vouchers}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{user.dateCreated}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onCopy(user.email, user.id)}
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
        </div>
      </td>
    </tr>
  );
};
