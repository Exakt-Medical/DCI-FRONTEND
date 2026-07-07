import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, Eye, EyeOff, ArrowLeft, Calendar } from "lucide-react";
import { Spinner } from "../components/Spinner";
import DciLogo from "../assets/DCI-LOGO.png";
import { authService } from "../services/authService";
import { FileUpload } from "../components/FileUpload";
import { useAuth } from "../context/AuthContext";
import emailjs from "@emailjs/browser";
import { useAlert } from "../hooks/useAlert";

export const CitizenRegister = () => {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    birthdate: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  
  const navigate = useNavigate();
  const { success } = useAlert();
  const { handleLogin } = useAuth();

  const handleIdUpload = (file, preview) => {
    setIdFile(file);
    setIdPreview(preview);
    if (!file) return;

    setOcrLoading(true);
    // Mock OCR processing
    setTimeout(() => {
      const mockFirstName = "Juan";
      const mockMiddleName = "Pedro";
      const mockLastName = "Dela Cruz";
      // Generate username: first letter of first name + first letter of middle name + full last name (no spaces)
      const generatedUsername = `${mockFirstName.charAt(0)}${mockMiddleName.charAt(0)}${mockLastName.replace(/\s+/g, '')}`.toLowerCase();

      setForm((prev) => ({
        ...prev,
        username: generatedUsername,
        firstName: mockFirstName,
        lastName: mockLastName,
        birthdate: "1990-01-01",
      }));
      setOcrLoading(false);
      success("ID Scanned", "Successfully extracted information from ID.");
    }, 2000);
  };

  const passwordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-600" };
    if (score <= 3) return { label: "Medium", color: "bg-yellow-500", text: "text-yellow-600" };
    return { label: "Strong", color: "bg-green-500", text: "text-green-600" };
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = "Username is required";
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.birthdate) errs.birthdate = "Birthdate is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email format";
    }
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      const templateParams = {
        to_name: form.firstName,
        to_email: form.email,
        verification_link: window.location.origin + "/dci-access/verify?token=mock-token-123",
      };
      
      await emailjs.send(
        "service_4ik3xef",
        "template_qgcsj7o",
        templateParams,
        "QMticHaw_n_hMIh_l"
      );
      
      setShowVerificationPrompt(true);
    } catch (err) {
      console.error("EmailJS Error:", err);
      setErrors({ form: "Failed to send verification email. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(form.password);

  const inputClass = (field) =>
    `w-full bg-white border ${errors[field] ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-1 bg-primary-500" />

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4">
                <img src={DciLogo} alt="DCI Logo" className="h-60 w-auto object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DCI Clearance Verification System</h1>
              <h1 className="text-xl font-bold text-gray-900">Mindanao</h1>
            </div>

            <h2 className="text-base font-semibold text-gray-800 mb-5">Create Citizen Account</h2>

            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm flex items-center gap-2">
                {errors.form}
              </div>
            )}

            {showVerificationPrompt ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                <p className="text-sm text-gray-600 mb-8">
                  We've sent a real verification link to your email address. Please check your inbox (and spam folder) and click the link to verify your account.
                </p>
                <div className="space-y-3">
                  {/* Verification is now required, skip button removed */}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
              <div className="relative">
                {ocrLoading && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
                    <Spinner size="md" />
                    <span className="text-sm font-medium text-primary-600 mt-2">Scanning ID...</span>
                  </div>
                )}
                <FileUpload
                  label="Upload Valid ID (For Auto-fill)"
                  accept="image/*"
                  onFile={handleIdUpload}
                  preview={idPreview}
                  hint="Upload an image of your ID to automatically fill your details."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Enter username"
                    className={inputClass("username")}
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="First name"
                    className={`w-full bg-white border ${errors.firstName ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Last name"
                    className={`w-full bg-white border ${errors.lastName ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Birthdate</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={form.birthdate}
                    onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                    className={inputClass("birthdate")}
                  />
                </div>
                {errors.birthdate && <p className="text-xs text-red-500 mt-1">{errors.birthdate}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email"
                    className={inputClass("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                    className={`w-full bg-white border ${errors.password ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {["Weak", "Medium", "Strong"].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength.label === level ? strength.color : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${strength.text}`}>{strength.label}</p>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className={`w-full bg-white border ${errors.confirmPassword ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Registering...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="mt-4">
              <button
                onClick={() => navigate("/dci-access")}
                className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Cancel
              </button>
            </div>
            </>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
            <p className="text-center text-[10px] text-gray-400">
              © 2026 DCI Clearance Verification System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
