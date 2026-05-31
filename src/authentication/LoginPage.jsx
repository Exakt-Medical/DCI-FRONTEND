// pages/LoginPage.jsx
import { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { authService } from "../services/authService";
import DciLogo from "../assets/DCI-LOGO.png";
import { CreateTicketModal } from "../features/Tickets/CreateTicketModal";

export const LoginPage = ({ onLogin, onRegisterClick }) => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedRememberMe && savedUsername) {
      setForm({
        username: savedUsername,
        password: savedPassword || "",
      });
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await authService.login(form.username, form.password);

      const {
        token,
        role,
        allowedToBuyVoucher,
        firstname,
        lastname,
        email,
        userId,
        companyId,
        companyCode,
      } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);
      localStorage.setItem("firstname", firstname);
      localStorage.setItem("lastname", lastname);
      localStorage.setItem("username", form.username);
      if (companyId != null)
        localStorage.setItem("companyId", String(companyId));
      if (companyCode != null) localStorage.setItem("companyCode", companyCode);
      localStorage.setItem(
        "authAllowedToBuyVoucher",
        String(!!allowedToBuyVoucher),
      );
      // ✅ Save userId so other pages can fetch user-specific data
      localStorage.setItem("userId", userId);

      if (rememberMe) {
        localStorage.setItem("rememberedUsername", form.username);
        localStorage.setItem("rememberedPassword", form.password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedUsername");
        localStorage.removeItem("rememberedPassword");
        localStorage.setItem("rememberMe", "false");
      }

      onLogin(role.toLowerCase(), { allowedToBuyVoucher });
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid username or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (ticketData) => {
    console.log("Ticket submitted:", ticketData);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header with color bar */}
            <div className="h-1 bg-primary-500" />

            <div className="p-8">
              {/* Logo & Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center mb-4">
                  <img
                    src={DciLogo}
                    alt="DCI Logo"
                    className="h-60 w-auto object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Vehicle Verification Insurance Program
                </h1>
                <h1 className="text-xl font-bold text-gray-900">Mindanao</h1>
              </div>

              {/* Sign In Title */}
              <h2 className="text-base font-semibold text-gray-800 mb-5">
                Sign In
              </h2>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      placeholder="Enter username"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="Enter password"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between mt-4 mb-6">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 accent-primary-500"
                  />
                  Remember me
                </label>
                <a
                  href="#"
                  className="text-xs text-primary-500 hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </button>

              {/* Submit a Ticket Link */}
              <div className="flex items-center justify-center mt-4">
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="text-xs text-primary-500 hover:underline flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  Submit a Ticket
                </button>
              </div>

              {/* COLLAPSIBLE DEMO CREDENTIALS */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                  className="w-full flex items-center justify-between text-center text-[10px] text-gray-400 mb-2 hover:text-gray-600 transition-colors group"
                >
                  <span className="flex-1 text-center group-hover:text-gray-500">
                    Demo Credentials
                  </span>
                  {showDemoCredentials ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>

                {showDemoCredentials && (
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] animate-in fade-in duration-200">
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      admin / admin123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      manager1 / manager123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      manager2 / manager123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      agent1 / agent123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      agent2 / agent123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      subagent1 / subagent123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      subagent2 / subagent123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      viewer1 / viewer123
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1 text-gray-500 text-center font-mono">
                      viewer2 / viewer123
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
              <p className="text-center text-[10px] text-gray-400">
                © 2026 Vehicle Verification Insurance Program. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSubmit={handleTicketSubmit}
        isLoginPageMode={true}
      />
    </>
  );
};
