import { MOCK_TICKETS } from "../constants/ticketMockData";

// Helper to load/save tickets from localStorage
const getLocalTickets = () => {
  const local = localStorage.getItem("dci_tickets");
  if (!local) {
    // Map initial tickets to match the expected format
    const mapped = MOCK_TICKETS.map(t => ({
      id: t.id,
      referenceNumber: t.referenceNumber,
      customer: t.requestedBy?.name ?? "—",
      requestedBy: t.requestedBy?.name ?? "—",
      processedBy: t.processedBy ?? "—",
      type: t.type,
      typeLabel: t.type,
      subject: t.type,
      description: t.description ?? "Mock description of the vehicle issue.",
      status: (t.status ?? "pending").toLowerCase(),
      statusLabel: t.status ?? "Pending",
      priority: "normal",
      date: t.dateRequested,
      lastUpdated: t.dateUpdated,
      dateRequested: t.dateRequested,
      dateUpdated: t.dateUpdated,
      vehicleInfo: {
        plateNo: "ABC1234",
        make: "TOYOTA",
        model: "VIOS",
        year: "2020",
        mvFileNo: "13242500000003A",
        engineNo: "ENG-123456",
        chassisNo: "CHA-123456",
        color: "WHITE",
        vehicleType: "SEDAN",
        classification: "PRIVATE",
      },
      escalated: "NO",
      roleBased: "LTO" // Escalated to LTO for viewing
    }));
    localStorage.setItem("dci_tickets", JSON.stringify(mapped));
    return mapped;
  }
  return JSON.parse(local);
};

const saveLocalTickets = (tickets) => {
  localStorage.setItem("dci_tickets", JSON.stringify(tickets));
};

export const ticketService = {
  async getAll() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getLocalTickets();
  },

  async getById(id) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const tickets = getLocalTickets();
    const ticket = tickets.find(t => String(t.id) === String(id));
    if (!ticket) throw new Error("Ticket not found");
    return ticket;
  },

  async create(formData) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const tickets = getLocalTickets();
    
    const newTicket = {
      id: Date.now(),
      referenceNumber: formData.referenceNumber || `REF-${Date.now()}`,
      customer: formData.requestedBy || "—",
      requestedBy: formData.requestedBy || "—",
      processedBy: formData.processedBy || "—",
      type: formData.type || "General",
      typeLabel: formData.type || "General",
      subject: formData.type || "General",
      description: formData.address || "",
      status: (formData.status || "pending").toLowerCase(),
      statusLabel: formData.status || "Pending",
      priority: formData.escalated === "YES" ? "high" : "normal",
      date: formData.dateRequested || new Date().toISOString(),
      lastUpdated: formData.dateUpdated || new Date().toISOString(),
      dateRequested: formData.dateRequested || new Date().toISOString(),
      dateUpdated: formData.dateUpdated || new Date().toISOString(),
      vehicleInfo: {
        plateNo: formData.plateNo || "N/A",
        make: formData.make || "N/A",
        model: formData.series || "N/A",
        year: formData.yearModel || "N/A",
        mvFileNo: formData.mvFileNo || "N/A",
        engineNo: formData.engineNo || "N/A",
        chassisNo: formData.chassisNo || "N/A",
        color: formData.vehicleColor || "N/A",
        vehicleType: formData.vehicleTypeDenomination || "N/A",
        classification: formData.classification || "N/A",
      },
      escalated: formData.escalated || "NO",
      roleBased: formData.roleBased || null,
      crAttachment: formData.crAttachment || null,
    };
    
    const updated = [newTicket, ...tickets];
    saveLocalTickets(updated);
    return newTicket;
  },

  async update(id, formData) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const tickets = getLocalTickets();
    const index = tickets.findIndex(t => String(t.id) === String(id));
    if (index === -1) throw new Error("Ticket not found");
    
    const current = tickets[index];
    const updatedTicket = {
      ...current,
      status: (formData.status || current.status).toLowerCase(),
      statusLabel: formData.status || current.statusLabel,
      processedBy: formData.processedBy || current.processedBy,
      dateUpdated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      escalated: formData.escalated || current.escalated,
      priority: formData.escalated === "YES" ? "high" : "normal",
      roleBased: formData.roleBased || current.roleBased,
    };
    
    tickets[index] = updatedTicket;
    saveLocalTickets(tickets);
    return updatedTicket;
  },

  async delete(id) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const tickets = getLocalTickets();
    const filtered = tickets.filter(t => String(t.id) !== String(id));
    saveLocalTickets(filtered);
  },
};
