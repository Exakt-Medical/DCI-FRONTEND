import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Search, Filter, Users, Plus, Upload } from "lucide-react";
import { userService } from "../../services/userService";
import { branchService } from "../../services/branchService";
import { StatCard } from "./components/StatCard";
import { UserTableRow } from "./components/UserTableRow";
import { UserFormModal } from "./components/UserFormModal";
import { ViewUserModal } from "./components/ViewUserModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { AccountPagination } from "./components/AccountPagination";
import { UploadBulkModal } from "../../components/UploadBulkModal";
import { Dropdown } from "../../components/Dropdown";

const ROLE_TABS = ["All", "Managers", "Agents", "Sub-agents", "Admin"];

export const AccountPage = () => {
  const role = localStorage.getItem("role");
  const isViewer = role === "VIEWER";
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const itemsPerPage = 5;

  const roleFilterMap = {
    "All": "all",
    "Managers": "MANAGER",
    "Agents": "AGENT",
    "Sub-agents": "SUBAGENT",
    "Admin": "ADMIN",
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, branchesRes] = await Promise.all([
        userService.getAll(),
        branchService.getAll(),
      ]);
      setUsers(usersRes.data);
      setBranches(branchesRes.data);
      setError(null);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalUsers = users.length;
  const totalManagers = users.filter((u) => u.role === "MANAGER").length;
  const totalAgents = users.filter((u) => u.role === "AGENT").length;
  const totalSubAgents = users.filter((u) => u.role === "SUBAGENT").length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      activeTab === "All" || user.role === roleFilterMap[activeTab];

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "Active" && user.isactive) ||
      (selectedStatus === "Inactive" && !user.isactive);

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await userService.delete(selectedUser.id);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const response = await userService.update(user.id, {
        ...user,
        isactive: !user.isactive,
      });
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, ...response.data } : u,
        ),
      );
    } catch (err) {
      console.error("Toggle active failed", err);
    }
  };

  const saveUser = async (userData) => {
    try {
      const payload = {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || null,
        role: userData.role,
        branchId: userData.branchId ? parseInt(userData.branchId) : null,
        managerId: userData.managerId ? parseInt(userData.managerId) : null,
        isactive: userData.isactive,
      };

      if (!isEditing) {
        payload.password = userData.password || "password123";
      }

      if (isEditing && selectedUser) {
        const response = await userService.update(selectedUser.id, payload);
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id ? { ...u, ...response.data } : u,
          ),
        );
      } else {
        const response = await userService.create(payload);
        setUsers([response.data, ...users]);
      }
      setIsFormModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleBulkUpload = async (records) => {
    const payload = records.map((r) => ({
      ...r,
      isactive: true,
      password: r.password || "password123",
    }));
    return userService.bulkCreate(payload);
  };

  const userTemplateHeaders = ["username", "password", "firstName", "lastName", "email", "role"];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const isAgentOrSubagent = (user) => ["AGENT", "SUBAGENT"].includes(user.role);
  const showManagerColumn = paginatedUsers.some(isAgentOrSubagent);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Account Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        {!isViewer && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white border border-primary-300 text-primary-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-50 transition-colors"
            >
              <Upload size={16} />
            </button>
            <button
              onClick={handleAddUser}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add User
            </button>
          </div>
        )}
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

      {/* Role Tabs */}
      <div className="mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl inline-flex">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
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
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
            {selectedStatus !== "all" && (
              <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Status:</span>
              <Dropdown
                options={statusOptions}
                value={selectedStatus}
                onChange={(value) => {
                  setSelectedStatus(value);
                  setCurrentPage(1);
                }}
              />
            </div>
            {selectedStatus !== "all" && (
              <button
                onClick={() => {
                  setSelectedStatus("all");
                  setCurrentPage(1);
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
                {showManagerColumn && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={showManagerColumn ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={showManagerColumn ? 6 : 5} className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={showManagerColumn ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    copiedId={copiedId}
                    onCopy={copyToClipboard}
                    onView={handleViewUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onToggleActive={handleToggleActive}
                    isViewer={isViewer}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > itemsPerPage && (
          <AccountPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers.length}
            currentItems={paginatedUsers.length}
            startIndex={startIndex}
          />
        )}
      </Card>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={saveUser}
        user={selectedUser}
        isEditing={isEditing}
        branches={branches}
        allUsers={users}
      />

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        userName={selectedUser ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || selectedUser.username : ""}
      />

      <UploadBulkModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        templateHeaders={userTemplateHeaders}
        moduleName="Users"
      />
    </div>
  );
};
