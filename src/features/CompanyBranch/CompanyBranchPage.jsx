import { useState, useEffect, useCallback } from "react";
import { useAlert } from "../../hooks/useAlert";
import { Card } from "../../components/Card";
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Upload,
  CheckSquare,
  XSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { branchService } from "../../services/branchService";
import { companyService } from "../../services/companyService";
import { BranchStatCard } from "./components/BranchStatCard";
import { BranchTableRow } from "./components/BranchTableRow";
import { BranchFormModal } from "./components/BranchFormModal";
import { BranchViewModal } from "./components/BranchViewModal";
import { BranchDeleteModal } from "./components/BranchDeleteModal";
import { UploadBulkModal } from "../../components/UploadBulkModal";
import { formatDateTime } from "../../utils/formatDate";

export const CompanyBranchPage = () => {
  const role = localStorage.getItem("role");
  const isViewer = role === "VIEWER";
  const alert = useAlert();
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    setSortDirection((prev) => (sortField === field && prev === "asc" ? "desc" : "asc"));
    setSortField(field);
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="inline ml-1 text-gray-300" />;
    return sortDirection === "asc"
      ? <ArrowUp size={12} className="inline ml-1 text-primary-600" />
      : <ArrowDown size={12} className="inline ml-1 text-primary-600" />;
  };

  const getCombinedName = (branch) =>
    `${branch.companyName} - ${branch.branchName}`;

  const getSortName = (branch) => {
    const short = branch.companyName || "";
    return `${short} - ${branch.companyName} - ${branch.branchName}`.toLowerCase();
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [branchesRes, companiesRes] = await Promise.all([
        branchService.getAll(),
        companyService.getAll(),
      ]);
      setBranches(branchesRes.data);
      setCompanies(companiesRes.data);
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

  const totalBranches = branches.length;
  const totalActive = branches.filter((b) => b.status === "ACTIVE").length;
  const totalInactive = branches.filter((b) => b.status !== "ACTIVE").length;

  const filteredBranches = branches.filter((branch) => {
    const combinedName = getCombinedName(branch).toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      branch.branchId?.toLowerCase().includes(term) ||
      branch.branchName?.toLowerCase().includes(term) ||
      branch.companyName?.toLowerCase().includes(term) ||
      (branch.companyProvider && branch.companyProvider.toLowerCase().includes(term)) ||
      combinedName.includes(term);

    const matchesStatus =
      activeStatusTab === "all" ||
      (activeStatusTab === "active" && branch.status === "ACTIVE") ||
      (activeStatusTab === "inactive" && (branch.status === "INACTIVE" || branch.status === "DEACTIVATED"));

    return matchesSearch && matchesStatus;
  });

  const sortedBranches = [...filteredBranches].sort((a, b) => {
    let cmp;
    if (sortField === "name") {
      cmp = getSortName(a).localeCompare(getSortName(b));
    } else if (sortField === "dateCreated") {
      cmp = new Date(a.dateCreated || 0) - new Date(b.dateCreated || 0);
    } else {
      const aVal = (a[sortField] ?? "").toString().toLowerCase();
      const bVal = (b[sortField] ?? "").toString().toLowerCase();
      cmp = aVal.localeCompare(bVal);
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sortedBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBranches = sortedBranches.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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

  const confirmDelete = async () => {
    try {
      await branchService.delete(selectedBranch.id);
      await alert.success("Deleted", "Branch has been deleted successfully.");
      setIsDeleteModalOpen(false);
      setSelectedBranch(null);
      await fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleToggleActive = async (branch) => {
    try {
      const newStatus = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await branchService.update(branch.id, {
        ...branch,
        status: newStatus,
      });
      await alert.success("Status Updated", `Branch has been set to ${newStatus}.`);
      await fetchData();
    } catch (err) {
      console.error("Toggle active failed", err);
    }
  };

  const saveBranch = async (branchData) => {
    try {
      const payload = {
        branchId: branchData.branchId,
        branchName: branchData.branchName,
        companyCode: branchData.companyCode,
        status: branchData.status,
      };

      if (isEditing && selectedBranch) {
        await branchService.update(selectedBranch.id, payload);
        await alert.success("Updated", "Branch has been updated successfully.");
      } else {
        await branchService.create(payload);
        await alert.success("Created", "Branch has been created successfully.");
      }
      setIsFormModalOpen(false);
      setSelectedBranch(null);
      await fetchData();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleBulkUpload = async (records) => {
    const invalid = records.find((r) => !r.company_code);
    if (invalid) {
      throw new Error(`Row with branch_id "${invalid.branch_id}" has a missing company_code. Please check your CSV.`);
    }
    const payload = records.map((r) => ({
      branchId: r.branch_id,
      branchName: r.branch_name,
      companyCode: r.company_code,
      status: "ACTIVE",
    }));
    return branchService.bulkCreate(payload);
  };

  const branchTemplateHeaders = ["branch_id", "branch_name", "company_code"];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Branch Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage insurance companies and their branches
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
              onClick={handleAddBranch}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add Branch
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <BranchStatCard
          title="Total Branches"
          value={totalBranches}
          icon={Building2}
          color="gray"
          onClick={() => { setActiveStatusTab("all"); setCurrentPage(1); }}
          active={activeStatusTab === "all"}
        />
        <BranchStatCard
          title="Active"
          value={totalActive}
          icon={CheckSquare}
          color="green"
          onClick={() => { setActiveStatusTab("active"); setCurrentPage(1); }}
          active={activeStatusTab === "active"}
        />
        <BranchStatCard
          title="Inactive"
          value={totalInactive}
          icon={XSquare}
          color="yellow"
          onClick={() => { setActiveStatusTab("inactive"); setCurrentPage(1); }}
          active={activeStatusTab === "inactive"}
        />
      </div>

      <Card className="p-4 mb-5">
        <div className="flex-1 relative w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, company, or shortname..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("name")}>
                  Name <SortIcon field="name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("companyProvider")}>
                  Provider <SortIcon field="companyProvider" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("status")}>
                  Status <SortIcon field="status" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("dateCreated")}>
                  Date Created <SortIcon field="dateCreated" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading branches...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : paginatedBranches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No branches found
                  </td>
                </tr>
              ) : (
                paginatedBranches.map((branch) => (
                  <BranchTableRow
                    key={branch.id}
                    branch={branch}
                    onView={handleViewBranch}
                    onEdit={handleEditBranch}
                    onDelete={handleDeleteBranch}
                    onToggleActive={handleToggleActive}
                    isViewer={isViewer}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredBranches.length)} of{" "}
              {filteredBranches.length} branches
            </p>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {totalPages > 1 && (
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft size={18} />
              </button>
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
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          )}
        </div>
      </Card>

      <BranchFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={saveBranch}
        branch={selectedBranch}
        isEditing={isEditing}
        companies={companies}
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
        branchName={selectedBranch?.branchName}
      />

      <UploadBulkModal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); fetchData(); }}
        onUpload={handleBulkUpload}
        templateHeaders={branchTemplateHeaders}
        moduleName="Branches"
      />
    </div>
  );
};
