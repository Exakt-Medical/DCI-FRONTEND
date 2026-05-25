// features/tickets/mockData.js

export const MOCK_TICKETS = [
  {
    id: 1,
    referenceNumber: "TKT-2024-0001",
    status: "Pending",
    type: "Data Mismatch",
    requestedBy: {
      name: "Juan M. Dela Cruz",
      company: "Mapfre Insurance",
    },
    processedBy: null,
    dateUpdated: "2024-12-10 09:30:25",
    dateRequested: "2024-12-10 09:30:25",
  },
  {
    id: 2,
    referenceNumber: "TKT-2024-0002",
    status: "Processing",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Maria Santos",
      company: "Prudential Guarantee",
    },
    processedBy: "John Admin",
    dateUpdated: "2024-12-10 10:15:42",
    dateRequested: "2024-12-10 10:15:42",
  },
  {
    id: 3,
    referenceNumber: "TKT-2024-0003",
    status: "Resolved",
    type: "Data Mismatch",
    requestedBy: {
      name: "Ramon Villanueva",
      company: "Malayan Insurance",
    },
    processedBy: "Sarah Manager",
    dateUpdated: "2024-12-09 16:30:18",
    dateRequested: "2024-12-09 14:20:10",
  },
  {
    id: 4,
    referenceNumber: "TKT-2024-0004",
    status: "Declined",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Pedro Fernandez",
      company: "Fortun General Insurance",
    },
    processedBy: "John Admin",
    dateUpdated: "2024-12-09 11:45:33",
    dateRequested: "2024-12-09 11:45:33",
  },
  {
    id: 5,
    referenceNumber: "TKT-2024-0005",
    status: "Cancelled",
    type: "Data Mismatch",
    requestedBy: {
      name: "Ana Reyes",
      company: "BPI MS Insurance",
    },
    processedBy: "Ana Reyes",
    dateUpdated: "2024-12-08 16:30:18",
    dateRequested: "2024-12-08 16:30:18",
  },
  {
    id: 6,
    referenceNumber: "TKT-2024-0006",
    status: "Pending",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Carlos Lopez",
      company: "Standard Insurance",
    },
    processedBy: null,
    dateUpdated: "2024-12-08 13:22:05",
    dateRequested: "2024-12-08 13:22:05",
  },
  {
    id: 7,
    referenceNumber: "TKT-2024-0007",
    status: "Processing",
    type: "Data Mismatch",
    requestedBy: {
      name: "Isabella Cruz",
      company: "Pioneer Insurance",
    },
    processedBy: "Sarah Manager",
    dateUpdated: "2024-12-07 09:55:40",
    dateRequested: "2024-12-07 09:55:40",
  },
  {
    id: 8,
    referenceNumber: "TKT-2024-0008",
    status: "Resolved",
    type: "Vehicle Not Found",
    requestedBy: {
      name: "Mark Reyes",
      company: "AXA Philippines",
    },
    processedBy: "John Admin",
    dateUpdated: "2024-12-06 14:20:10",
    dateRequested: "2024-12-06 14:20:10",
  },
];

export const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Resolved", label: "Resolved" },
  { value: "Declined", label: "Declined" },
  { value: "Cancelled", label: "Cancelled" },
];

export const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "Data Mismatch", label: "Data Mismatch" },
  { value: "Vehicle Not Found", label: "Vehicle Not Found" },
];
