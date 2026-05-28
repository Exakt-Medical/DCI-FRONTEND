import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { auditTrailService } from "../../services/auditTrailService";
import { ActivityLogsHeader } from "./components/ActivityLogsHeader";
import { ActivityLogsFilters } from "./components/ActivityLogsFilters";
import { ActivityLogsTable } from "./components/ActivityLogsTable";
import { ActivityLogsPagination } from "./components/ActivityLogsPagination";
import { ActivityLogsLoading } from "./components/ActivityLogsLoading";

export const ActivityLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });
  const itemsPerPage = 10;

  // Helper function to safely get string values
  const safeToString = (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const mapLog = (record) => ({
    id: record.id,
    user: record.userstamp || "Unknown",
    role: record.userrole || "Unknown",
    action: record.actionMade || "Unknown",
    details: record.details || "",
    timestamp: record.timestamp || new Date().toISOString(),
  });

  const fetchLogs = () => {
    setLoading(true);
    auditTrailService
      .getAll()
      .then((res) => {
        setLogs(res.data.map(mapLog));
        setLoading(false);
      })
      .catch(() => {
        setLogs([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs with null safety
  const filteredLogs = logs.filter((log) => {
    // Safely get string values (handle null/undefined)
    const user = safeToString(log.user);
    const action = safeToString(log.action);
    const details = safeToString(log.details);
    const search = safeToString(searchTerm);

    const matchesSearch =
      search === "" ||
      user.toLowerCase().includes(search.toLowerCase()) ||
      action.toLowerCase().includes(search.toLowerCase()) ||
      details.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter ? action === actionFilter : true;
    const matchesUser = userFilter ? user === userFilter : true;

    return matchesSearch && matchesAction && matchesUser;
  });

  // SORTED logs (AFTER filteredLogs)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (!aValue || !bValue) return 0;

    const isDate = sortConfig.key === "timestamp";

    const aComp = isDate
      ? new Date(aValue)
      : safeToString(aValue).toLowerCase();
    const bComp = isDate
      ? new Date(bValue)
      : safeToString(bValue).toLowerCase();

    if (aComp < bComp) return sortConfig.direction === "asc" ? -1 : 1;
    if (aComp > bComp) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);

  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  };

  // Get unique filter options with null safety
  const uniqueActions = [
    ...new Set(logs.map((log) => log.action).filter(Boolean)),
  ];
  const uniqueUsers = [...new Set(logs.map((log) => log.user).filter(Boolean))];

  const handleExport = () => {
    console.log("Exporting logs...");
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleActionFilterChange = (action) => {
    setActionFilter(action);
    setCurrentPage(1);
  };

  const handleUserFilterChange = (user) => {
    setUserFilter(user);
    setCurrentPage(1);
  };

  if (loading) {
    return <ActivityLogsLoading />;
  }

  return (
    <div className="space-y-6">
      <ActivityLogsHeader />

      <Card className="overflow-hidden">
        <ActivityLogsFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          actionFilter={actionFilter}
          onActionFilterChange={handleActionFilterChange}
          userFilter={userFilter}
          onUserFilterChange={handleUserFilterChange}
          uniqueActions={uniqueActions}
          uniqueUsers={uniqueUsers}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        <ActivityLogsTable
          logs={paginatedLogs}
          onSort={handleSort}
          sortConfig={sortConfig}
        />

        <ActivityLogsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredLogs.length}
          currentItems={paginatedLogs.length}
        />
      </Card>
    </div>
  );
};
