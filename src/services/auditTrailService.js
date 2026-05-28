// /src/services/auditTrailService.js

const BASE_URL = "/api/audit-trail";

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

export const auditTrailService = {
  // Get all audit logs
  getAll() {
    return fetch(BASE_URL, { headers: getAuthHeaders() }).then(handleResponse);
  },

  // Get unique actions for filter dropdown
  getUniqueActions() {
    return fetch(`${BASE_URL}/actions`, { headers: getAuthHeaders() }).then(
      handleResponse,
    );
  },

  // Get unique users for filter dropdown
  getUniqueUsers() {
    return fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() }).then(
      handleResponse,
    );
  },

  // Get by ID
  getById(id) {
    return fetch(`${BASE_URL}/${id}`, { headers: getAuthHeaders() }).then(
      handleResponse,
    );
  },

  // Create new audit log
  create(data) {
    return fetch(BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  // Update audit log
  update(id, data) {
    return fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  // Delete audit log
  delete(id) {
    return fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(handleResponse);
  },
};
