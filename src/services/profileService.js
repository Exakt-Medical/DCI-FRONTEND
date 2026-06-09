// /src/services/profileService.js

import api from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export const profileService = {
  // Get current user profile
  getProfile: async () => {
    const res = await api.get("/profile");
    return res.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const res = await api.put("/profile", profileData);
    return res.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const res = await api.post("/profile/change-password", passwordData);
    return res.data;
  },

  // Upload avatar (multipart/form-data)
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
