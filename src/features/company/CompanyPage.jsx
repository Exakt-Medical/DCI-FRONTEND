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

export const CompanyPage = () => {
  const role = localStorage.getItem("role");
  const isViewer = role === "VIEWER";
  const alert = useAlert();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
      const res = await companyService.getAll();
      setCompanies(res.data);
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
  const totalActive = companies.filter((c) => c.status === "ACTIVE").length;
  const totalInactive = companies.filter((c) => c.status !== "ACTIVE").length;

  const filteredCompanies = companies.filter((company) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      (company.companyName && company.companyName.toLowerCase().includes(term)) ||
      (company.provider && company.provider.toLowerCase().includes(term));

    const matchesStatus =
      activeStatusTab === "all" ||
      (activeStatusTab === "active" && company.status === "ACTIVE") ||
      (activeStatusTab === "inactive" && (company.status === "INACTIVE" || company.status === "DEACTIVATED"));

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

  const handleToggleActive = async (company) => {
    try {
      const newStatus = company.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await companyService.update(company.id, {
        companyName: company.companyName,
        status: newStatus,
      });
      await alert.success("Status Updated", `Company has been set to ${newStatus}.`);
      await fetchCompanies();
    } catch (err) {
      console.error("Toggle active failed", err);
    }
  };

  const confirmDelete = async () => {
    try {
      await companyService.delete(selectedCompany.id);
      await alert.success("Deleted", "Company has been deleted successfully.");
      setIsDeleteModalOpen(false);
      setSelectedCompany(null);
      await fetchCompanies();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const saveCompany = async (companyData) => {
    try {
      if (isEditing && selectedCompany) {
        await companyService.update(selectedCompany.id, companyData);
        await alert.success("Updated", "Company has been updated successfully.");
      } else {
        await companyService.create(companyData);
        await alert.success("Created", "Company has been created successfully.");
      }
      setIsFormModalOpen(false);
      setSelectedCompany(null);
      await fetchCompanies();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleBulkUpload = async (records) => {
    const payload = records.map((r) => ({
      companyName: r.company_name,
      code: r.code,
      provider: r.provider,
      address: r.address,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    }));
    return companyService.bulkCreate(payload);
  };

  const companyTemplateHeaders = ["provider", "code", "company_name", "address"];

  return (
    <div className="max-w-7xl mx-auto">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <CompanyStatCard
          title="Total Companies"
          value={totalCompanies}
          icon={Building2}
          color="gray"
          onClick={() => { setActiveStatusTab("all"); setCurrentPage(1); }}
          active={activeStatusTab === "all"}
        />
        <CompanyStatCard
          title="Active"
          value={totalActive}
          icon={Building2}
          color="green"
          onClick={() => { setActiveStatusTab("active"); setCurrentPage(1); }}
          active={activeStatusTab === "active"}
        />
        <CompanyStatCard
          title="Inactive"
          value={totalInactive}
          icon={Building2}
          color="yellow"
          onClick={() => { setActiveStatusTab("inactive"); setCurrentPage(1); }}
          active={activeStatusTab === "inactive"}
        />
      </div>

      <Card className="p-4 mb-5">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("companyName")}>
                  Name <SortIcon field="companyName" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("provider")}>
                  Provider <SortIcon field="provider" />
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
                    Loading companies...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No companies found
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((company) => (
                  <CompanyTableRow
                    key={company.id}
                    company={company}
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

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredCompanies.length)} of{" "}
              {filteredCompanies.length} companies
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
        onClose={() => { setIsUploadModalOpen(false); fetchCompanies(); }}
        onUpload={handleBulkUpload}
        templateHeaders={companyTemplateHeaders}
        moduleName="Companies"
      />
    </div>
  );
};
