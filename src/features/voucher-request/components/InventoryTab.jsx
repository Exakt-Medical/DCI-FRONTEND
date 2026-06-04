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
      <VoucherInventoryTable rows={rows} />
    </div>
  );
};
