// services/attachmentService.js
import api from "./api";

export const attachmentService = {
  upload: async (formData) => {
    try {
      const { data } = await api.post("/attachment/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    } catch (error) {
      throw new Error(
        error?.response?.data?.message || "Failed to upload attachment",
      );
    }
  },

  getAll: async () => {
    const { data } = await api.get("/attachment");
    return data;
  },

  getById: async (id) => {
    try {
      const { data } = await api.get(`/attachment/${id}`);
      return data;
    } catch {
      throw new Error("Failed to fetch attachment");
    }
  },

  delete: async (id) => {
    return api.delete(`/attachment/${id}`);
  },
};
