import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Spinner } from "../components/Spinner";
import { useAlert } from "../hooks/useAlert";
import DciLogo from "../assets/DCI-LOGO.png";
import { authService } from "../services/authService";
import { FileUpload } from "../components/FileUpload";
import { usePaddleOcr } from "../hooks/usePaddleOcr";

export const CitizenRegister = () => {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
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
  const [ocrHint, setOcrHint] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const navigate = useNavigate();
  const { success } = useAlert();
  
  const { runOcr } = usePaddleOcr();

  const suggestUsername = (first, last) => {
    if (!first && !last) return "";
    const cleanFirst = first.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLast = last.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const initial = cleanFirst.charAt(0) || "";
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${initial}${cleanLast}${randomSuffix}`;
  };

  const handleNameChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    if (!usernameEdited) {
      updatedForm.username = suggestUsername(updatedForm.firstName, updatedForm.lastName);
    }
    setForm(updatedForm);
  };

  const handleIdUpload = async (file, preview) => {
    setIdFile(file);
    setIdPreview(preview);
    if (!file) {
      setOcrHint("");
      return;
    }
    setOcrLoading(true);
    setOcrHint("Extracting details from ID...");
    try {
      const result = await runOcr(file);
      if (result && result.success) {
        const { firstName, lastName } = result.data;
        const updatedForm = { ...form };
        if (firstName) updatedForm.firstName = firstName;
        if (lastName) updatedForm.lastName = lastName;
        
        if (firstName || lastName) {
          if (!usernameEdited) {
            updatedForm.username = suggestUsername(updatedForm.firstName, updatedForm.lastName);
          }
          setOcrHint("Details extracted! Please double check the extracted data below.");
        } else {
          setOcrHint("Could not extract name details. Please fill manually.");
        }
        setForm(updatedForm);
      } else {
        setOcrHint("Could not extract details. Please fill manually.");
      }
    } catch (e) {
      console.error(e);
      setOcrHint("OCR extraction failed. Please fill manually.");
    } finally {
      setOcrLoading(false);
    }
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
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email format";
    }
    
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = "Frontend Validation: Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(form.password)) {
      errs.password = "Frontend Validation: Password must contain at least one lowercase letter";
    } else if (!/\d/.test(form.password)) {
      errs.password = "Frontend Validation: Password must contain at least one digit";
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
      await authService.register({
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });
      setIsRegistered(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Registration failed. Please try again.";
      if (msg.toLowerCase().includes("email")) {
        setErrors({ email: "Email already exists." });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(form.password);

  const inputClass = (field) =>
    `w-full bg-white border ${errors[field] ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`;

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-1 bg-primary-500" />
            <div className="p-8 text-center space-y-6">
              <div className="inline-flex items-center justify-center mb-2">
                <img src={DciLogo} alt="DCI Logo" className="h-20 w-auto object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DCI Clearance Verification System</h1>
              </div>

              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Create Citizen Account</div>

              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Mail size={32} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-950">Verify Your Email</h2>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                  We've sent a verification link to your email address.<br />
                  Please check your inbox (and spam folder) and click the link to verify your account.
                </p>
              </div>

              <button
                onClick={() => navigate('/dci-access')}
                className="w-full bg-[#0059b5] hover:bg-[#004bb0] text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
              >
                Back to Login
              </button>
            </div>
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400">
                © 2026 DCI Clearance Verification System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-1 bg-primary-500" />

          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4">
                <img src={DciLogo} alt="DCI Logo" className="h-16 w-auto object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DCI Clearance Verification System</h1>
            </div>

            <h2 className="text-base font-semibold text-gray-800 mb-5">Create Citizen Account</h2>

            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm flex items-center gap-2">
                {errors.form}
              </div>
            )}

            <div className="space-y-4">
              {/* ID Upload Box for Auto-Fill */}
              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50">
                <FileUpload
                  label="Upload Valid ID (For Auto-Fill)"
                  accept="image/*,application/pdf"
                  onFile={handleIdUpload}
                  preview={idPreview}
                  hint={ocrHint}
                  disabled={ocrLoading}
                />
                {ocrLoading && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Spinner size="xs" />
                    <span>Extracting fields from ID...</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleNameChange("firstName", e.target.value)}
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
                    onChange={(e) => handleNameChange("lastName", e.target.value)}
                    placeholder="Last name"
                    className={`w-full bg-white border ${errors.lastName ? "border-red-300" : "border-gray-300"} rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all`}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => {
                      setUsernameEdited(true);
                      setForm({ ...form, username: e.target.value });
                    }}
                    placeholder="Enter username"
                    className={inputClass("username")}
                    autoComplete="off"
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
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
                    autoComplete="new-password"
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
                    autoComplete="new-password"
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
                onClick={() => navigate('/dci-access')}
                className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Cancel
              </button>
            </div>
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
