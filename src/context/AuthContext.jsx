import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && role) {
      setUser({ token, role });
    }
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email ?? "");
      localStorage.setItem("firstname", data.firstname ?? "");
      localStorage.setItem("lastname", data.lastname ?? "");
      if (data.companyId != null)
        localStorage.setItem("companyId", String(data.companyId));
      if (data.companyCode != null)
        localStorage.setItem("companyCode", data.companyCode);
      setToken(data.token);
      setRole(data.role);
      setUser({ token: data.token, role: data.role });
      return data.role;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    localStorage.removeItem("companyId");
    localStorage.removeItem("companyCode");
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
