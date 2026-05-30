// components/dashboard/TransactionTable.jsx
export const TransactionTable = ({ transactions }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Agent
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            DCI Auth Code
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Plate No.
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            MV File No.
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Chassis No.
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Engine No.
          </th>
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Date Created
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <tr
            key={transaction.id}
            className="hover:bg-gray-50 transition-colors"
          >
            <td className="px-4 py-3">
              <span className="font-medium text-gray-900">
                {transaction.agent}
              </span>
            </td>
            <td className="px-4 py-3">
              <code className="text-xs font-mono font-bold text-primary-600">
                {transaction.dciAuthCode}
              </code>
            </td>
            <td className="px-4 py-3">
              <span className="font-mono text-sm text-gray-700">
                {transaction.plateNo}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="text-xs text-gray-500 font-mono">
                {transaction.mvFile}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="text-xs text-gray-500 font-mono">
                {transaction.chassisNo}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="text-xs text-gray-500 font-mono">
                {transaction.engineNo}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="text-xs text-gray-500">
                {transaction.dateCreated}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
