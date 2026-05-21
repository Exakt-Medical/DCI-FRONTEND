// features/transactions/components/TransactionTableRow.jsx
import { StatusBadge } from "../../../components/StatusBadge";

export const TransactionTableRow = ({ transaction }) => {
  const getStatusBadge = (status) => {
    if (status === "Authenticated" || status === "Authenticated")
      return "Authenticated";
    if (status === "Verified") return "Verified";
    if (status === "Failed" || status === "Failed") return "Failed";
    return "default";
  };

  const getOriginBadge = (origin) => {
    if (origin === "web") return "WEB";
    if (origin === "mobile") return "MOBILE";
    if (origin === "api") return "API";
    return "default";
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">{transaction.agent}</p>
          <p className="text-xs text-gray-500">{transaction.company}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs font-mono font-bold text-primary-600">
          {transaction.authNo}
        </code>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">
          Vehicle verification for {transaction.assuredName}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600">
          {transaction.status === "Authenticated"
            ? "Vehicle has been verified successfully"
            : transaction.status === "Verified"
              ? "Documents verified and approved"
              : "Verification failed - Invalid details"}
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={getOriginBadge("web")}>WEB</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={getStatusBadge(transaction.status)}>
          {transaction.status}
        </StatusBadge>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {transaction.dateCreated}
      </td>
    </tr>
  );
};
