import { useState, useEffect, useCallback } from "react";
import { useAlert } from "../../hooks/useAlert";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import {
  Search,
  Users,
  Plus,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { userService } from "../../services/userService";
import { branchService } from "../../services/branchService";
import { StatCard } from "./components/StatCard";
import { UserTableRow } from "./components/UserTableRow";
import { UserFormModal } from "./components/UserFormModal";
import { ViewUserModal } from "./components/ViewUserModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { AccountPagination } from "./components/AccountPagination";
import { UploadBulkModal } from "../../components/UploadBulkModal";

const ROLE_TABS = ["All", "Managers", "Agents", "Sub-agents", "Admin"];

export const AccountPage = () => {
  const role = localStorage.getItem("role");
  const isViewer = role === "VIEWER";
  const alert = useAlert();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("username");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    setSortDirection((prev) =>
      sortField === field && prev === "asc" ? "desc" : "asc",
    );
    setSortField(field);
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ArrowUpDown size={12} className="inline ml-1 text-gray-300" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="inline ml-1 text-primary-600" />
    ) : (
      <ArrowDown size={12} className="inline ml-1 text-primary-600" />
    );
  };

  const roleFilterMap = {
    All: "all",
    Managers: "MANAGER",
    Agents: "AGENT",
    "Sub-agents": "SUBAGENT",
    Admin: "ADMIN",
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
  const totalActive = users.filter((u) => u.status === "ACTIVE").length;
  const totalInactive = users.filter((u) => u.status !== "ACTIVE").length;

  const filteredUsers = users.filter((user) => {
    const combinedDisplay = [
      user.username,
      user.branchCompanyName,
      user.branchName,
      user.managerBranchCompanyName,
      user.managerBranchName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      searchTerm === "" ||
      combinedDisplay.includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      activeTab === "All" || user.role === roleFilterMap[activeTab];

    const matchesStatus =
      activeStatusTab === "all" ||
      (activeStatusTab === "active" && user.status === "ACTIVE") ||
      (activeStatusTab === "inactive" && user.status !== "ACTIVE");

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getSortValue = (user, field) => {
    if (field === "voucherCount")
      return 0; /* ← replace with real count when wired up */
    if (field === "branchName") {
      if (user.role === "ADMIN") return "head company, head branch";
      if (["AGENT", "SUBAGENT"].includes(user.role))
        return (
          (user.managerBranchCompanyName
            ? user.managerBranchCompanyName + " / "
            : "") + (user.managerBranchName || "") || "N/A"
        ).toLowerCase();
      return (
        (user.branchCompanyName ? user.branchCompanyName + " / " : "") +
          (user.branchName || "") || "N/A"
      ).toLowerCase();
    }
    return (user[field] ?? "").toString().toLowerCase();
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const cmp = getSortValue(a, sortField).localeCompare(
      getSortValue(b, sortField),
    );
    return sortDirection === "asc" ? cmp : -cmp;
  });
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
      await alert.success("Deleted", "Account has been deleted successfully.");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await userService.update(user.id, {
        ...user,
        status: newStatus,
      });
      await alert.success(
        "Status Updated",
        `Account has been set to ${newStatus}.`,
      );
      await fetchData();
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
        middleInitial: userData.middleInitial || "",
        extName: userData.extName || "",
        email: userData.email || null,
        mobile: userData.mobile || "",
        role: userData.role,
        branchId: userData.branchId ? parseInt(userData.branchId) : null,
        managerId: userData.managerId ? parseInt(userData.managerId) : null,
        status: userData.status,
        allowedToBuyVoucher: userData.allowedToBuyVoucher,
      };

      if (!isEditing) {
        payload.password = userData.password || "password123";
      }

      if (isEditing && selectedUser) {
        await userService.update(selectedUser.id, payload);
        await alert.success(
          "Updated",
          "Account has been updated successfully.",
        );
      } else {
        await userService.create(payload);
        await alert.success(
          "Created",
          "Account has been created successfully.",
        );
      }
      setIsFormModalOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleBulkUpload = async (records) => {
    const payload = records.map((r) => ({
      firstName: r.first_name,
      lastName: r.last_name,
      middleInitial: r.middle_initial || "",
      extName: r.ext_name || "",
      username: r.username,
      password: r.password || "password123",
      email: r.email || "",
      mobile: r.mobile || "",
      role: r.role,
      status: "ACTIVE",
    }));
    return userService.bulkCreate(payload);
  };

  const userTemplateHeaders = [
    "first_name",
    "last_name",
    "middle_initial",
    "ext_name",
    "username",
    "password",
    "email",
    "mobile",
    "role",
  ];

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="gray"
          onClick={() => {
            setActiveStatusTab("all");
            setCurrentPage(1);
          }}
          active={activeStatusTab === "all"}
        />
        <StatCard
          title="Active"
          value={totalActive}
          icon={Users}
          color="green"
          onClick={() => {
            setActiveStatusTab("active");
            setCurrentPage(1);
          }}
          active={activeStatusTab === "active"}
        />
        <StatCard
          title="Inactive"
          value={totalInactive}
          icon={Users}
          color="red"
          onClick={() => {
            setActiveStatusTab("inactive");
            setCurrentPage(1);
          }}
          active={activeStatusTab === "inactive"}
        />
      </div>

      {/* Role Tabs */}
      <div className="mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <Card className="p-4 mb-5">
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
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("username")}
                >
                  Name <SortIcon field="username" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("role")}
                >
                  Role <SortIcon field="role" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("managerName")}
                >
                  Manager <SortIcon field="managerName" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("branchName")}
                >
                  Branch <SortIcon field="branchName" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("voucherCount")}
                >
                  Vouchers <SortIcon field="voucherCount" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                  onClick={() => handleSort("dateCreated")}
                >
                  Date Created <SortIcon field="dateCreated" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    onView={handleViewUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onToggleActive={handleToggleActive}
                    isViewer={isViewer}
                    voucherCount={
                      0
                    } /* ← replace with real count when service is ready */
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AccountPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredUsers.length}
          currentItems={paginatedUsers.length}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
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
        userName={selectedUser ? selectedUser.username : ""}
      />

      <UploadBulkModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          fetchData();
        }}
        onUpload={handleBulkUpload}
        templateHeaders={userTemplateHeaders}
        moduleName="Users"
      />
    </div>
  );
};
