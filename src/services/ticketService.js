const BASE_URL = "/api/support-ticket";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const formatDate = (raw) => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

// ✅ Appends +08:00 to backend LocalDateTime strings so JS treats them as Manila time
const parseManilaDate = (raw) => {
  if (!raw) return null;
  // If it already has timezone info (Z or +), use as-is
  if (typeof raw === "string" && (raw.includes("Z") || raw.includes("+"))) {
    return raw;
  }
  // Otherwise treat it as Manila time by appending +08:00
  return raw + "+08:00";
};

// ✅ Returns current time adjusted to Philippine Time (UTC+8)
const toManilaISO = () => {
  const now = new Date();
  const offset = 8 * 60; // UTC+8 in minutes
  const manila = new Date(now.getTime() + offset * 60 * 1000);
  return manila.toISOString();
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

/**
 * Maps a SupportTicket from the backend to the shape the frontend expects.
 */
const mapTicket = (t) => ({
  id: t.id,
  referenceNumber: t.referenceNumber,
  customer: t.name ?? "—",
  requestedBy: t.requestedBy ?? "—",
  processedBy: t.processedBy ?? "—",
  type: t.type,
  typeLabel: t.type,
  subject: t.type,
  description: t.address ?? "",
  // Normalise status to lowercase so filter counters match ("OPEN" → "open")
  status: (t.status ?? "pending").toLowerCase(),
  statusLabel: t.status ?? "Pending",
  // escalated comes as "YES" / "NO" string from backend
  priority: t.escalated === "YES" ? "high" : "normal",
  date: parseManilaDate(t.dateRequested),
  lastUpdated: parseManilaDate(t.dateUpdated),
  // ✅ Parse as Manila time so frontend displays correctly
  dateRequested: parseManilaDate(t.dateRequested),
  dateUpdated: parseManilaDate(t.dateUpdated),
  vehicleInfo: {
    plateNo: t.plateNo ?? "N/A",
    make: t.make ?? "N/A",
    model: t.series ?? "N/A",
    year: t.yearModel ? new Date(t.yearModel).getFullYear() : "N/A",
    mvFileNo: t.mvFileNo ?? "N/A",
    engineNo: t.engineNo ?? "N/A",
    chassisNo: t.chassisNo ?? "N/A",
    color: t.vehicleColor ?? "N/A",
    vehicleType: t.vehicleTypeDenomination ?? "N/A",
    classification: t.classification ?? "N/A",
  },
  escalated: t.escalated ?? "NO",
  roleBased: t.roleBased ?? null,
  certificateOfRegistration: t.certificateOfRegistration ?? null,
  plateCertification: t.plateCertification ?? null,
  actualPlate: t.actualPlate ?? null,
  // ✅ FIX: Preserve crAttachment from backend
  crAttachment: t.crAttachment ?? null,
});

/**
 * Maps frontend form data to the TicketRequest DTO the backend expects.
 */
const mapToRequest = (formData) => ({
  referenceNumber: formData.referenceNumber ?? null,
  status: formData.status ?? "PENDING",
  requestedBy: formData.requestedBy ?? null,
  type: formData.type ?? null,
  processedBy: formData.processedBy ?? null,
  // ✅ Use toManilaISO() so the saved time reflects Philippine Time (UTC+8)
  dateUpdated: formData.dateUpdated ?? toManilaISO(),
  dateRequested: formData.dateRequested ?? toManilaISO(),
  escalated: formData.escalated ?? "NO",
  roleBased: formData.roleBased ?? null,

  mvFileNo: formData.mvFileNo ?? null,
  plateNo: formData.plateNo ?? null,
  engineNo: formData.engineNo ?? null,
  chassisNo: formData.chassisNo ?? null,
  make: formData.make ?? null,
  series: formData.series ?? null,
  vehicleColor: formData.vehicleColor ?? null,
  vehicleTypeDenomination: formData.vehicleTypeDenomination ?? null,
  yearModel: formData.yearModel ?? null,
  classification: formData.classification ?? null,
  name: formData.name ?? null,
  address: formData.address ?? null,

  certificateOfRegistration: formData.certificateOfRegistration ?? null,
  plateCertification: formData.plateCertification ?? null,
  actualPlate: formData.actualPlate ?? null,
  crAttachment: formData.crAttachment ?? null,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const ticketService = {
  /** GET /api/support-ticket */
  async getAll() {
    const res = await fetch(BASE_URL, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return (
      data
        .map(mapTicket)
        // ✅ Sort by dateRequested descending so newest tickets appear first
        .sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested))
    );
  },

  /** GET /api/support-ticket/:id */
  async getById(id) {
    const res = await fetch(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
    const data = await handleResponse(res);
    return mapTicket(data);
  },

  /** POST /api/support-ticket */
  async create(formData) {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(mapToRequest(formData)),
    });
    const data = await handleResponse(res);
    return mapTicket(data);
  },

  /** PUT /api/support-ticket/:id */
  async update(id, formData) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(mapToRequest(formData)),
    });
    const data = await handleResponse(res);
    return mapTicket(data);
  },

  /** DELETE /api/support-ticket/:id */
  async delete(id) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
