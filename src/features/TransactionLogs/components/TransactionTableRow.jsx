// features/transactions/components/TransactionTableRow.jsx
import { StatusBadge } from "../../../components/StatusBadge";

export const TransactionTableRow = ({ transaction }) => {
  const getStatusBadge = (status) => {
    if (status === "Authenticated") return "Authenticated";
    if (status === "Verified") return "Verified";
    if (status === "Failed") return "Failed";
    return "default";
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">{transaction.account}</p>
          <p className="text-xs text-gray-500">{transaction.company}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs font-mono font-bold text-primary-600">
          {transaction.referenceNo}{" "}
          {/* ✅ CHANGE THIS - was transaction.refNo */}
        </code>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700 whitespace-pre-line max-w-md">
          {transaction.description}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600 whitespace-pre-line max-w-md">
          {transaction.response}
        </p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          WEB
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={getStatusBadge(transaction.status)}>
          {transaction.status}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
        {transaction.dateCreated}
      </td>
    </tr>
  );
};
