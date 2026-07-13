import { VoucherInventoryFilters } from "./VoucherInventoryFilters";
import { VoucherInventoryTable } from "./VoucherInventoryTable";
import { VoucherStatsCards } from "./VoucherStatsCards";

export const InventoryTab = ({
  summary,
  filterOptions,
  activeFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  rows,
  currentPage,
  setCurrentPage,
  totalPages,
  totalElements,
  pageSize,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      <VoucherStatsCards summary={summary} />
      <VoucherInventoryFilters
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
      <VoucherInventoryTable 
        rows={rows} 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        isLoading={isLoading}
      />
    </div>
  );
};
