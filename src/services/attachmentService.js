// services/attachmentService.js
// Use import.meta.env for Vite instead of process.env
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const attachmentService = {
  upload: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/attachment/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload attachment");
    }

    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/attachment`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/attachment/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch attachment");
    }

    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/attachment/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response;
  },
};
