// /src/services/exportService.js

export const exportService = {
  // Export data to CSV
  toCSV(data, filename = "export") {
    if (!data || data.length === 0) {
      console.warn("No data to export");
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(",") || escaped.includes("\n")
          ? `"${escaped}"`
          : escaped;
      });
      csvRows.push(values.join(","));
    }

    // Create download
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Export logs specifically
  exportLogs(logs, filename = "activity_logs") {
    if (!logs || logs.length === 0) {
      console.warn("No logs to export");
      return;
    }

    // Format logs for export
    const exportData = logs.map((log) => ({
      Timestamp: log.timestamp,
      User: log.user,
      Role: log.role,
      Action: log.action,
      Details: log.details,
    }));

    this.toCSV(exportData, filename);
  },

  // Export access logs specifically
  exportAccessLogs(logs, filename = "access_logs") {
    if (!logs || logs.length === 0) {
      console.warn("No logs to export");
      return;
    }

    const formatTimestamp = (ts) => {
      if (!ts) return "-";
      const d = new Date(ts);
      return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
    };

    // Format logs for export (matching the columns shown in AccessLogsTable)
    const exportData = logs.map((log) => ({
      Username: log.user || "Unknown",
      Role: log.role || "Unknown",
      Action: log.action || "LOGIN",
      Timestamp: formatTimestamp(log.timestamp),
    }));

    this.toCSV(exportData, filename);
  },
};
