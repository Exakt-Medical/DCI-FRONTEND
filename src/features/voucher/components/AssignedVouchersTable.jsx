// features/voucher/components/AssignedVouchersTable.jsx
import { useState } from "react";
import { Card } from "../../../components/Card";
import { StatusBadge } from "../../../components/StatusBadge";
import { Search, Copy, CheckCircle, Eye } from "lucide-react";
import { MOCK_ASSIGNED_VOUCHERS } from "../../../constants/mockData";

export const AssignedVouchersTable = ({ 
  assignedVouchers = MOCK_ASSIGNED_VOUCHERS, 
  formatCurrency, 
  copyToClipboard 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (code, id) => {
    copyToClipboard(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredVouchers = assignedVouchers.filter(voucher =>
    voucher.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.assignedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (assignedVouchers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Eye size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Vouchers Assigned</h3>
          <p className="text-sm text-gray-500 max-w-md">
            You haven't received any vouchers yet. Your manager will assign vouchers to you for customer verification.
          </p>
        </div>
      </Card>
    );
  }

  const getStatusVariant = (status) => {
    if (status === "Active") return "success";
    if (status === "Used") return "info";
    if (status === "Expired") return "warning";
    return "default";
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by voucher code, product, or assigned by..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-600 font-medium">Active</p>
          <p className="text-xl font-bold text-green-700">
            {assignedVouchers.filter(v => v.status === "Active").length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Used</p>
          <p className="text-xl font-bold text-blue-700">
            {assignedVouchers.filter(v => v.status === "Used").length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-xs text-yellow-600 font-medium">Expired</p>
          <p className="text-xl font-bold text-yellow-700">
            {assignedVouchers.filter(v => v.status === "Expired").length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-600 font-medium">Total</p>
          <p className="text-xl font-bold text-gray-700">
            {assignedVouchers.length}
          </p>
        </div>
      </div>

      {/* Vouchers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Voucher Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Premium
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned By
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 rounded">
                      {voucher.voucherCode}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {voucher.productName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(voucher.premium)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {voucher.assignedBy}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {voucher.assignedDate}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {voucher.expiryDate}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge 
                      status={getStatusVariant(voucher.status)}
                    >
                      {voucher.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleCopy(voucher.voucherCode, voucher.id)}
                      disabled={voucher.status !== "Active"}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                        voucher.status === "Active"
                          ? "text-primary-600 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {copiedId === voucher.id ? (
                        <>
                          <CheckCircle size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy Code
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-xs text-gray-500 text-center">
        Showing {filteredVouchers.length} of {assignedVouchers.length} assigned vouchers
      </div>
    </div>
  );
};