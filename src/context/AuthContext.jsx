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
      // Mock authentication for demonstration
      await new Promise((resolve) => setTimeout(resolve, 500));

      let mockRole = "citizen";
      const lowerUser = username.toLowerCase();
      if (lowerUser.includes("agent")) mockRole = "agent_fixer";
      if (lowerUser.includes("admin")) mockRole = "admin";
      if (lowerUser.includes("hpg")) mockRole = "HPG";

      const data = {
        token: "mock-token-" + Date.now(),
        role: mockRole,
        username: username,
        email: `${username}@mock.local`,
        firstname: "Mock",
        lastname: "User",
        companyId: 1,
        companyCode: "MOCK",
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      localStorage.setItem("firstname", data.firstname);
      localStorage.setItem("lastname", data.lastname);
      localStorage.setItem("companyId", String(data.companyId));
      localStorage.setItem("companyCode", data.companyCode);

      setToken(data.token);
      setRole(data.role);
      setUser({ token: data.token, role: data.role });
      return data.role;
    } catch (error) {
      throw new Error("Mock login failed");
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
