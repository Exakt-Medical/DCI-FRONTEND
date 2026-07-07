import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState((localStorage.getItem("role") || "").toLowerCase() || null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // Intercept successful login and require mock OTP (123456)
      return { 
        otpRequired: true, 
        username: data.username, 
        email: data.email || "user@example.com", 
        data 
      };
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

  const verifyOtp = async (otpCode, pendingData) => {
    setLoading(true);
    try {
      if (otpCode !== "123456") {
        throw new Error("Invalid OTP code. Please use the mock code: 123456");
      }

      const normalizedRole = (pendingData.role || "").toLowerCase();
      localStorage.setItem("token", pendingData.token);
      localStorage.setItem("role", normalizedRole);
      localStorage.setItem("username", pendingData.username);
      localStorage.setItem("email", pendingData.email ?? "");
      localStorage.setItem("firstname", pendingData.firstname ?? "");
      localStorage.setItem("lastname", pendingData.lastname ?? "");
      if (pendingData.companyId != null)
        localStorage.setItem("companyId", String(pendingData.companyId));
      if (pendingData.companyCode != null)
        localStorage.setItem("companyCode", pendingData.companyCode);
      if (pendingData.userId != null)
        localStorage.setItem("userId", pendingData.userId);
      setToken(pendingData.token);
      setRole(normalizedRole);
      setUser({ token: pendingData.token, role: normalizedRole });
      return normalizedRole;
    } catch (error) {
      throw new Error(error.message || "OTP verification failed");
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
    if (role === "citizen" || role === "agent" || role === "agent_fixer") return "requests";
    if (role === "hpg") return "hpg-verification";
    if (role === "dci") return "dci-verification";
    // admin, agent_fixer, agent, and any other roles → dashboard
    return "dashboard";
  };

  const handleLogin = (userRole, userData) => {
    const landingPage = getDefaultPageForRole(userRole);
    setRole(userRole);
    localStorage.setItem("authRole", userRole);
    
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
        verifyOtp,
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
