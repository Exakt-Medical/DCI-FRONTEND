import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      if (role && role !== "null") {
        setUser({ token, role });
      } else {
        // Corrupted state (e.g. from previous bug), clear it out
        logout();
      }
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
      if (lowerUser.includes("dci")) mockRole = "dci";

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

  const getDefaultPageForRole = (currentRole) => {
    const role = (currentRole || "").toLowerCase();
    if (role === "citizen") return "requests";
    if (role === "hpg") return "verification";
    if (role === "lto") return "certificate-lookup";
    // admin, agent_fixer, agent, and any other roles → dashboard
    return "dashboard";
  };

  const handleLogin = (userRole, userData) => {
    const landingPage = getDefaultPageForRole(userRole);
    setRole(userRole);
    localStorage.setItem("role", userRole);
    
    // Ensure we have a token so isAuthenticated is true
    const mockToken = "mock-token-123";
    localStorage.setItem("token", mockToken);
    setToken(mockToken);
    
    if (userData) {
      localStorage.setItem("userProfile", JSON.stringify(userData));
    }
    navigate(`/dci-access/${landingPage}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/dci-access");
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
        handleLogin,
        handleLogout,
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
