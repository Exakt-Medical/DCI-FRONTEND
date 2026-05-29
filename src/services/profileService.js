// /src/services/profileService.js

const BASE_URL = "/api/profile";

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
    const response = await fetch(`${BASE_URL}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${BASE_URL}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await fetch(`${BASE_URL}/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
};
