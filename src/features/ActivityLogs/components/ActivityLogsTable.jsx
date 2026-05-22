export const ActivityLogsTable = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No activity logs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Action
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
