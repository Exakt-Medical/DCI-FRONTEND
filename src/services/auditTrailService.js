// /src/services/auditTrailService.js
import api from "./api";

const BASE_URL = "/audit-trail";

const handleResponse = (res) => {
  if (res.status === 204) return null;
  return res.data;
};

const normalizeError = (error) => {
  if (error?.response) {
    const body = error.response.data;
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Error(`${error.response.status}: ${text}`);
  }
  return error;
};

export const auditTrailService = {
  // Get all audit logs
  async getAll() {
    try {
      const res = await api.get(BASE_URL);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Get unique actions for filter dropdown
  async getUniqueActions() {
    try {
      const res = await api.get(`${BASE_URL}/actions`);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Get unique users for filter dropdown
  async getUniqueUsers() {
    try {
      const res = await api.get(`${BASE_URL}/users`);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Get by ID
  async getById(id) {
    try {
      const res = await api.get(`${BASE_URL}/${id}`);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Create new audit log
  async create(data) {
    try {
      const res = await api.post(BASE_URL, data);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Update audit log
  async update(id, data) {
    try {
      const res = await api.put(`${BASE_URL}/${id}`, data);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  // Delete audit log
  async delete(id) {
    try {
      const res = await api.delete(`${BASE_URL}/${id}`);
      return handleResponse(res);
    } catch (error) {
      throw normalizeError(error);
    }
  },
};
