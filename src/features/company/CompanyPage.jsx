import { useState, useEffect, useCallback } from "react";
import { Card } from "../../components/Card";
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { companyService } from "../../services/companyService";
import { CompanyStatCard } from "./components/CompanyStatCard";
import { CompanyTableRow } from "./components/CompanyTableRow";
import { CompanyFormModal } from "./components/CompanyFormModal";
import { CompanyViewModal } from "./components/CompanyViewModal";
import { CompanyDeleteModal } from "./components/CompanyDeleteModal";
import { UploadBulkModal } from "../../components/UploadBulkModal";
import { Dropdown } from "../../components/Dropdown";

export const CompanyPage = () => {
  const role = localStorage.getItem("role");
  const isViewer = role === "VIEWER";
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const itemsPerPage = 5;
  const [sortField, setSortField] = useState("companyName");
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

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await companyService.getAll();
      setCompanies(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load companies");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const totalCompanies = companies.length;
  const totalActive = companies.filter((c) => c.isactive).length;
  const totalInactive = companies.filter((c) => !c.isactive && c.approvalStatus !== "REJECTED").length;
  const totalDeactivated = companies.filter((c) => c.approvalStatus === "REJECTED").length;

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      searchTerm === "" ||
      company.companyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.companyShortname || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || company.approvalStatus === selectedStatus || 
      (selectedStatus === "Active" && company.isactive) ||
      (selectedStatus === "Inactive" && !company.isactive && company.approvalStatus !== "REJECTED") ||
      (selectedStatus === "Deactivated" && company.approvalStatus === "REJECTED");

    return matchesSearch && matchesStatus;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const aVal = (a[sortField] ?? "").toString().toLowerCase();
    const bVal = (b[sortField] ?? "").toString().toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return sortDirection === "asc" ? cmp : -cmp;
  });
  const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompanies = sortedCompanies.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  const handleDeleteCompany = (company) => {
    setSelectedCompany(company);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await companyService.delete(selectedCompany.id);
      setCompanies(companies.filter((c) => c.id !== selectedCompany.id));
      setIsDeleteModalOpen(false);
      setSelectedCompany(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleToggleActive = async (company) => {
    try {
      const response = await companyService.update(company.id, {
        ...company,
        isactive: !company.isactive,
      });
      setCompanies(
        companies.map((c) =>
          c.id === company.id ? { ...c, ...response.data } : c,
        ),
      );
    } catch (err) {
      console.error("Toggle active failed", err);
    }
  };

  const saveCompany = async (companyData) => {
    try {
      if (isEditing && selectedCompany) {
        const response = await companyService.update(selectedCompany.id, companyData);
        setCompanies(
          companies.map((c) =>
            c.id === selectedCompany.id ? { ...c, ...response.data } : c,
          ),
        );
      } else {
        const response = await companyService.create(companyData);
        setCompanies([response.data, ...companies]);
      }
      setIsFormModalOpen(false);
      setSelectedCompany(null);
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleBulkUpload = async (records) => {
    return companyService.bulkCreate(records);
  };

  const companyTemplateHeaders = ["companyId", "companyName", "companyShortname"];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Deactivated", label: "Deactivated" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Company Management
          </h1>
          <p className="text-sm text-gray-500">Manage insurance companies</p>
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
              onClick={handleAddCompany}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Add Company
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CompanyStatCard
          title="Total Companies"
          value={totalCompanies}
          icon={Building2}
          color="gray"
        />
        <CompanyStatCard
          title="Active"
          value={totalActive}
          icon={Building2}
          color="green"
        />
        <CompanyStatCard
          title="Inactive"
          value={totalInactive}
          icon={Building2}
          color="yellow"
        />
        <CompanyStatCard
          title="Deactivated"
          value={totalDeactivated}
          icon={Building2}
          color="red"
        />
      </div>

      {/* Search and Filters */}
      <Card className="p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by ID, name, or short name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
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
                className="text-xs text-primary-600 hover:text-primary-700 whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Companies Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("companyId")}>
                  Code <SortIcon field="companyId" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("companyName")}>
                  Name <SortIcon field="companyName" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("companyShortname")}>
                  Short Name <SortIcon field="companyShortname" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("approvalStatus")}>
                  Status <SortIcon field="approvalStatus" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("isactive")}>
                  Active <SortIcon field="isactive" />
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading companies...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No companies found
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((company) => (
                  <CompanyTableRow
                    key={company.id}
                    company={company}
                    copiedId={copiedId}
                    onCopy={copyToClipboard}
                    onView={handleViewCompany}
                    onEdit={handleEditCompany}
                    onDelete={handleDeleteCompany}
                    onToggleActive={handleToggleActive}
                    isViewer={isViewer}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, sortedCompanies.length)} of{" "}
              {sortedCompanies.length} companies
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
      <CompanyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={saveCompany}
        company={selectedCompany}
        isEditing={isEditing}
      />

      <CompanyViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        company={selectedCompany}
      />

      <CompanyDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        companyName={selectedCompany?.companyName}
      />

      <UploadBulkModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        templateHeaders={companyTemplateHeaders}
        moduleName="Companies"
      />
    </div>
  );
};
