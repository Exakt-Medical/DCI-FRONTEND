// LedgerModal.jsx - Wrapped with Portal
import { X } from "lucide-react";
import { Portal } from "../../components/Portal";

export const LedgerModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen) return null;

  const renderWalletInfo = () => {
    const getTransactionType = () => {
      if (transaction?.modalType === "cashin") return "CASHIN";
      if (transaction?.modalType === "transaction") return "TRANSACTION";
      if (transaction?.modalType === "addload") return "ADD_LOAD";
      return transaction?.transactionType || "ADD_LOAD";
    };

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/3">
                Status
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {transaction?.status || "APPROVED"}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                Type
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-900">
                  {getTransactionType()}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                Account
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {transaction?.account.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ({transaction?.account.role})
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                Voucher
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-sm font-semibold ${
                    transaction?.voucher?.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction?.voucher}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                Old Balance
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-900">
                  {transaction?.oldTotalVouchers}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                New Balance
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-900">
                  {transaction?.newTotalVouchers}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                Transaction Date
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-500">
                  {transaction?.dateCreated}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderDetails = () => {
    if (transaction?.modalType !== "transaction") return null;

    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/3">
                  Status
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {transaction?.details?.status}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Company
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">
                    {transaction?.details?.company}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Account
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transaction?.details?.account}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({transaction?.details?.accountRole})
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Authentication Code
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono font-bold text-primary-600">
                    {transaction?.details?.authenticationCode}
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTransfer = () => {
    if (
      transaction?.modalType !== "addload" &&
      transaction?.modalType !== "adjustment"
    )
      return null;

    const transferData = transaction?.transfer || {
      company:
        transaction?.account.companyBranch?.split(" - ")[0] ||
        "Sterling Insurance Company Inc",
      referenceNumber: transaction?.referenceNumber,
      receiver: transaction?.account.name,
      receiverRole: transaction?.account.role,
      from: "JUAN DELA CRUZ",
      fromRole: "Manager",
      processedBy: "JUAN DELA CRUZ",
      processedByRole: "Manager",
      balance: transaction?.voucher,
    };

    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Transfer</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/3">
                  Company
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">
                    {transferData.company}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Reference Number
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono font-bold text-primary-600">
                    {transferData.referenceNumber}
                  </code>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Receiver
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transferData.receiver}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({transferData.receiverRole})
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  From
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transferData.from}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({transferData.fromRole})
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Processed By
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transferData.processedBy}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({transferData.processedByRole})
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  Balance
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-green-600">
                    {transferData.balance}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">LEDGER</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Wallet Information Table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Wallet Information
                </h3>
                {renderWalletInfo()}
              </div>

              {/* Details Table - Only for Transaction type */}
              {renderDetails()}

              {/* Transfer Table - Only for Adjustment/Add Load type */}
              {renderTransfer()}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return <Portal>{modalContent}</Portal>;
};
