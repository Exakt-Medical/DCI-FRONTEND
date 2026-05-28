import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export const ActivityLogsTable = ({ logs, onSort, sortConfig }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No activity logs found</p>
      </div>
    );
  }

  const renderSortIcon = (key) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown size={14} className="text-gray-300" />;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              onClick={() => onSort("timestamp")}
              className="cursor-pointer select-none text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center gap-1">
                Timestamp {renderSortIcon("timestamp")}
              </div>
            </th>

            <th
              onClick={() => onSort("user")}
              className="cursor-pointer select-none text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center gap-1">
                User {renderSortIcon("user")}
              </div>
            </th>

            <th
              onClick={() => onSort("action")}
              className="cursor-pointer select-none text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              <div className="flex items-center gap-1">
                Action {renderSortIcon("action")}
              </div>
            </th>

            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">{log.timestamp}</span>
              </td>

              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {log.user}
                  </p>
                  <p className="text-xs text-gray-500">{log.role}</p>
                </div>
              </td>

              <td className="px-6 py-4">
                <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
                  {log.action}
                </span>
              </td>

              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{log.details}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
