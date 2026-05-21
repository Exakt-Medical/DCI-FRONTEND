import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/Spinner";
import { User, Lock, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";
    if (savedRememberMe && savedUsername) {
      setForm({ username: savedUsername, password: savedPassword || "" });
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    try {
      const role = await login(form.username, form.password);
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", form.username);
        localStorage.setItem("rememberedPassword", form.password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedUsername");
        localStorage.removeItem("rememberedPassword");
        localStorage.setItem("rememberMe", "false");
      }
      navigate(role === "ADMIN" ? "/dashboard" : "/verification");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sapphire-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/3 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-sapphire-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <span className="text-3xl font-black text-white">VVIP</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vehicle Verification</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Insurance Program — Admin Portal</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sign In</h2>
          {error && (
            <div className="bg-carnelian-50 border border-carnelian-200 rounded-xl p-3 mb-4 text-carnelian-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter username"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 mb-6">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300"
              />
              Remember me
            </label>
            <button className="text-xs text-primary-600 hover:text-primary-700 transition-colors">
              Forgot password?
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner size="sm" /> Authenticating...</> : <><LogIn size={18} /> Sign In</>}
          </button>
          <p className="text-center text-xs text-gray-500 mt-4">Demo: admin/admin123 or agent/agent123</p>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/register")}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Register
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 Vehicle Verification Insurance Program
        </p>
      </div>
    </div>
  );
};