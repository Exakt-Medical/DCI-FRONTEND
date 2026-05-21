import api from "./api";

export const authService = {
  login: (username, password) =>
    api.post("/auth/login", { username, password }),

  verifyMfa: (username, code) =>
    api.post("/auth/verify-mfa", { username, code }),

  register: (data) => api.post("/auth/register", data),
};