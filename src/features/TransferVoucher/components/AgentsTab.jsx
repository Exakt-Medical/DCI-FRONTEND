import { useState } from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Users, RefreshCw, X } from "lucide-react";

const AgentsTab = ({ agents, transferHistory = [] }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleOpenModal = (agent) => {
    setSelectedAgent(agent);
  };

  const handleCloseModal = () => {
    setSelectedAgent(null);
  };

  const getAgentVouchers = () => {
    if (!selectedAgent) return [];

    const matchedVouchers = transferHistory.filter((voucher) => {
      return (
        String(voucher.toUserId) === String(selectedAgent.userId) ||
        String(voucher.agentUserId) === String(selectedAgent.userId) ||
        String(voucher.transferredToUserId) ===
          String(selectedAgent.userId) ||
        String(voucher.transferredTo) ===
          String(selectedAgent.userId) ||
        String(voucher.currentUserId) ===
          String(selectedAgent.userId) ||
        String(voucher.toAgentName) ===
          String(selectedAgent.name) ||
        String(voucher.agent) ===
          String(selectedAgent.name) ||
        String(voucher.transferredToName) ===
          String(selectedAgent.name)
      );
    });

    if (matchedVouchers.length > 0) {
      return matchedVouchers;
    }

    return Array.from({
      length: selectedAgent.assignedVouchers ?? 0,
    }).map((_, index) => ({
      voucherCodes: [`Voucher ${index + 1}`],
    }));
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary-600" />
            <h3 className="text-base font-bold text-gray-900">
              Agent List
            </h3>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={12} className="mr-1" /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Agent Name
                </th>

                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Email
                </th>

                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Branch
                </th>

                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">
                  Assigned Vouchers
                </th>
              </tr>
            </thead>

            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {agent.name}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {agent.email}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {agent.branch}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(agent)}
                      className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200 transition-all cursor-pointer"
                    >
                      {agent.assignedVouchers ?? 0} vouchers
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Voucher Details
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedAgent.name}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {(selectedAgent.assignedVouchers ?? 0) === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No vouchers available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {getAgentVouchers().flatMap(
                    (voucher, voucherIndex) =>
                      (voucher.voucherCodes || []).map(
                        (code, codeIndex) => (
                          <div
                            key={`${voucherIndex}-${codeIndex}`}
                            className="bg-primary-50 border border-primary-100 rounded-2xl p-5"
                          >
                            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                              Voucher Code
                            </p>

                            <p className="text-lg text-primary-700 font-bold break-all">
                              {code}
                            </p>
                          </div>
                        ),
                      ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentsTab;