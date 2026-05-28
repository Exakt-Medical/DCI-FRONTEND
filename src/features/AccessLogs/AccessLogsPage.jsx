import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { accessLogService } from "../../services/accessLogService";
import { AccessLogsHeader } from "./components/AccessLogsHeader";
import { AccessLogsFilters } from "./components/AccessLogsFilters";
import { AccessLogsTable } from "./components/AccessLogsTable";
import { AccessLogsPagination } from "./components/AccessLogsPagination";
import { AccessLogsLoading } from "./components/AccessLogsLoading";

export const AccessLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const mapLog = (record) => ({
    id: record.id,
    user: record.username || record.userstamp,
    timestamp: record.timestamp,
  });

  const fetchLogs = () => {
    setLoading(true);
    accessLogService
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

  const sortedLogs = [...logs].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime() || 0;
    const bTime = new Date(b.timestamp).getTime() || 0;
    return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
  });

  // Filter logs
  const filteredLogs = sortedLogs.filter((log) => {
    return log.user.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExport = () => {
    console.log("Exporting access logs...");
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  if (loading) {
    return <AccessLogsLoading />;
  }

  return (
    <div className="space-y-6">
      <AccessLogsHeader />

      <Card className="overflow-hidden">
        <AccessLogsFilters
          searchTerm={searchTerm}
          sortOrder={sortOrder}
          onSearchChange={handleSearch}
          onSortChange={(value) => {
            setSortOrder(value);
            setCurrentPage(1);
          }}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        <AccessLogsTable logs={paginatedLogs} />

        <AccessLogsPagination
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
