// features/accounts/AccountPage.jsx
import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Search,
  Filter,
  Copy,
  CheckCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
} from "lucide-react";
import { MOCK_USERS } from "../../constants/mockData";

export const AccountPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  // Calculate totals
  const totalUsers = MOCK_USERS.length;
  const totalManagers = MOCK_USERS.filter((u) => u.role === "Manager").length;
  const totalAgents = MOCK_USERS.filter((u) => u.role === "Agent").length;
  const totalSubAgents = MOCK_USERS.filter(
    (u) => u.role === "Sub Agent",
  ).length;

  // Filter users based on search and filters
  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center`}
        >
          <Icon size={20} className={`text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Account Management
        </h1>
        <p className="text-sm text-gray-500">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="gray"
        />
        <StatCard
          title="Managers"
          value={totalManagers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Agents"
          value={totalAgents}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Sub Agents"
          value={totalSubAgents}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {(selectedRole !== "all" || selectedStatus !== "all") && (
              <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </Button>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Roles</option>
                <option value="Manager">Manager</option>
                <option value="Agent">Agent</option>
                <option value="Sub Agent">Sub Agent</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {(selectedRole !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSelectedRole("all");
                  setSelectedStatus("all");
                }}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Vouchers
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date Created
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.company} - {user.branch}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {user.vouchers}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {user.dateCreated}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyToClipboard(user.email, user.id)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Copy Email"
                      >
                        {copiedId === user.id ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
