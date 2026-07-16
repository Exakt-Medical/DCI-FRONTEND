const formatTimestamp = (ts) => {
  if (!ts) return "-";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
};

export const AccessLogsTable = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No access logs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.user}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {log.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    log.action === "LOGIN"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {log.action}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">{formatTimestamp(log.timestamp)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
