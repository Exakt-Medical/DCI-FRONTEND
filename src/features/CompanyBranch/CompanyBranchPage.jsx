import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import {
  Search,
  Filter,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  XSquare,
  AlertTriangle,
} from "lucide-react";
import { MOCK_BRANCHES } from "../../constants/branchMockData";
import { MOCK_COMPANIES } from "../../constants/companyMockData";
import { BranchStatCard } from "./components/BranchStatCard";
import { BranchTableRow } from "./components/BranchTableRow";
import { BranchFormModal } from "./components/BranchFormModal";
import { BranchViewModal } from "./components/BranchViewModal";
import { BranchDeleteModal } from "./components/BranchDeleteModal";

export const CompanyBranchPage = () => {
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const itemsPerPage = 10;

  // Calculate totals
  const totalBranches = branches.length;
  const totalActive = branches.filter((b) => b.status === "Active").length;
  const totalInactive = branches.filter((b) => b.status === "Inactive").length;
  const totalDeactivated = branches.filter(
    (b) => b.status === "Deactivated",
  ).length;

  // Filter branches based on search and filters
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      searchTerm === "" ||
      branch.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.manager.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || branch.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBranches = filteredBranches.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleViewBranch = (branch) => {
    setSelectedBranch(branch);
    setIsViewModalOpen(true);
  };

  const handleDeleteBranch = (branch) => {
    setSelectedBranch(branch);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setBranches(branches.filter((b) => b.id !== selectedBranch.id));
    setIsDeleteModalOpen(false);
    setSelectedBranch(null);
  };

  const saveBranch = (branchData) => {
    if (isEditing && selectedBranch) {
      // Update existing branch
      setBranches(
        branches.map((b) =>
          b.id === selectedBranch.id
            ? {
                ...b,
                ...branchData,
                dateCreated: b.dateCreated,
                id: b.id,
              }
            : b,
        ),
      );
    } else {
      // Create new branch
      const newBranch = {
        id: Math.max(...branches.map((b) => b.id), 0) + 1,
        ...branchData,
        dateCreated: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setBranches([newBranch, ...branches]);
    }
    setIsFormModalOpen(false);
    setSelectedBranch(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Company & Branch Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage insurance companies and their branches
          </p>
        </div>
        <Button onClick={handleAddBranch} className="flex items-center gap-2">
          <Plus size={16} /> Add Branch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <BranchStatCard
          title="Total Branches"
          value={totalBranches}
          icon={Building2}
          color="gray"
        />
        <BranchStatCard
          title="Active"
          value={totalActive}
          icon={CheckSquare}
          color="green"
        />
        <BranchStatCard
          title="Inactive"
          value={totalInactive}
          icon={XSquare}
          color="yellow"
        />
        <BranchStatCard
          title="Deactivated"
          value={totalDeactivated}
          icon={AlertTriangle}
          color="red"
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
              placeholder="Search by code, company, branch, or manager..."
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
            <Filter size={16} /> Filters
            {selectedStatus !== "all" && (
              <span className="ml-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
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
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>
            {selectedStatus !== "all" && (
              <button
                onClick={() => setSelectedStatus("all")}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Branches Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Branch / Address
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Manager
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
              {paginatedBranches.map((branch) => (
                <BranchTableRow
                  key={branch.id}
                  branch={branch}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                  onView={handleViewBranch}
                  onEdit={handleEditBranch}
                  onDelete={handleDeleteBranch}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredBranches.length)} of{" "}
              {filteredBranches.length} branches
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
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
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

      {/* Modals */}
      <BranchFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={saveBranch}
        branch={selectedBranch}
        isEditing={isEditing}
        companies={MOCK_COMPANIES}
      />

      <BranchViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        branch={selectedBranch}
      />

      <BranchDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        branchName={selectedBranch?.branch}
      />
    </div>
  );
};
