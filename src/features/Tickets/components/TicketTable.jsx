import {
  Eye,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket,
  Copy,
} from "lucide-react";

// Normalise to Title Case for badge lookup: "OPEN" → "Open", "pending" → "Pending"
const normaliseStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "—";

const getStatusBadge = (status) => {
  const styles = {
    Open: "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Processing: "bg-blue-100 text-blue-700",
    Resolved: "bg-green-100 text-green-700",
    Declined: "bg-red-100 text-red-700",
    Cancelled: "bg-gray-100 text-gray-700",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Open":
      return <Ticket size={12} />;
    case "Pending":
      return <Clock size={12} />;
    case "Processing":
      return <RefreshCw size={12} />;
    case "Resolved":
      return <CheckCircle size={12} />;
    case "Declined":
      return <XCircle size={12} />;
    case "Cancelled":
      return <AlertCircle size={12} />;
    default:
      return <Ticket size={12} />;
  }
};

const getTypeBadge = (type) => {
  if (type === "Data Mismatch") return "bg-purple-100 text-purple-700";
  return "bg-orange-100 text-orange-700";
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleCopyTicketNumber = async (referenceNumber) => {
  try {
    await navigator.clipboard.writeText(referenceNumber);
    console.log("Copied:", referenceNumber);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

// Safely render requestedBy whether it's a string ("Lester") or an object ({ name, company })
const renderRequestedBy = (requestedBy) => {
  if (!requestedBy) return <span className="text-gray-400">—</span>;
  if (typeof requestedBy === "string") {
    return <p className="text-sm font-medium text-gray-900">{requestedBy}</p>;
  }
  return (
    <div>
      <p className="text-sm font-medium text-gray-900">{requestedBy.name}</p>
      {requestedBy.company && (
        <p className="text-xs text-gray-500">{requestedBy.company}</p>
      )}
    </div>
  );
};

export const TicketTable = ({ tickets, onViewDetails }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Reference Number
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Requested By
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Processed By
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Date Updated
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Date Requested
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-sm text-gray-400"
              >
                No tickets found.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => {
              const displayStatus = normaliseStatus(ticket.status);
              return (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {ticket.referenceNumber}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyTicketNumber(ticket.referenceNumber)
                        }
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                        title="Copy reference number"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(displayStatus)}`}
                    >
                      {getStatusIcon(displayStatus)}
                      {displayStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {renderRequestedBy(ticket.requestedBy)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(ticket.type)}`}
                    >
                      {ticket.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {ticket.processedBy || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(ticket.dateUpdated)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(ticket.dateRequested)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onViewDetails(ticket)}
                      className="p-1 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
