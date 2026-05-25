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

  const itemsPerPage = 10;

  const mapLog = (record) => ({
    id: record.id,
    user: record.userstamp,
    role: record.userrole,
    action: record.actionMade,
    details: record.details,
    timestamp: record.timestamp,
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

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter ? log.action === actionFilter : true;
    const matchesUser = userFilter ? log.user === userFilter : true;

    return matchesSearch && matchesAction && matchesUser;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Get unique filter options
  const uniqueActions = [...new Set(logs.map((log) => log.action))];
  const uniqueUsers = [...new Set(logs.map((log) => log.user))];

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

        <ActivityLogsTable logs={paginatedLogs} />

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
