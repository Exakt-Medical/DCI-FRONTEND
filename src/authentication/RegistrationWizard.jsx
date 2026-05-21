import { useState, useRef, useEffect } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { FileUpload } from "../components/FileUpload";
import { 
  Building2, 
  Upload,
  Code, 
  MapPin, 
  Globe, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  CheckCircle,
  UserCircle,
  Camera,
  ArrowLeft,
  ArrowRight,
  X
} from "lucide-react";

export const RegistrationWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [company, setCompany] = useState({ 
    name: "", code: "", branch: "", provider: "LTO", address: "", 
    logo: null, logoPreview: null, accreditation: null, accreditationName: "" 
  });
  const [profile, setProfile] = useState({ 
    avatar: null, avatarPreview: null, firstName: "", middleName: "", 
    lastName: "", email: "", mobile: "" 
  });
  const [submitting, setSubmitting] = useState(false);

  const steps = ["Company", "Profile", "Confirm"];

  const startCamera = async () => {
    setCameraError(null);
    try {
      // First try with rear camera (environment)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: "environment" } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.log("Play error:", e));
        };
      }
      setShowCamera(true);
    } catch (err) {
      // Fallback to any available camera
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.log("Play error:", e));
          };
        }
        setShowCamera(true);
      } catch (fallbackErr) {
        console.error("Camera error:", fallbackErr);
        setCameraError("Unable to access camera. Please check permissions and ensure no other app is using the camera.");
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
          const preview = URL.createObjectURL(file);
          setProfile({ ...profile, avatar: file, avatarPreview: preview });
        }
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setProfile({ ...profile, avatar: file, avatarPreview: preview });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    onComplete({ company, profile });
  };

  const cn = (...classes) => classes.filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Vehicle Verification Insurance Program</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                    step > i + 1 ? "bg-primary-500 text-white" : 
                    step === i + 1 ? "bg-primary-500 text-white ring-4 ring-primary-200" : 
                    "bg-gray-200 text-gray-500"
                  )}>
                    {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-1",
                    step === i + 1 ? "text-primary-600" : "text-gray-500"
                  )}>
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2",
                    step > i + 1 ? "bg-primary-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Take a Photo</h3>
                <button onClick={stopCamera} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full rounded-lg bg-gray-900"
                  style={{ minHeight: "300px", objectFit: "cover" }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {cameraError && (
                  <p className="text-xs text-carnelian-500 mt-2 text-center">{cameraError}</p>
                )}
              </div>
              <div className="flex justify-between gap-3 p-4 border-t border-gray-200">
                <Button variant="secondary" onClick={stopCamera} size="sm">
                  Cancel
                </Button>
                <Button onClick={capturePhoto} size="sm">
                  Capture Photo
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-white shadow-xl border-0">
          {/* STEP 1 - Company Details */}
          {step === 1 && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 size={16} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Company Details</h2>
                  <p className="text-xs text-gray-500">Enter your insurance company information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Company Name *</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={company.name} 
                      onChange={e => setCompany({ ...company, name: e.target.value })} 
                      placeholder="Premier Insurance Corp" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Company Code *</label>
                  <div className="relative">
                    <Code size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={company.code} 
                      onChange={e => setCompany({ ...company, code: e.target.value })} 
                      placeholder="PIC-001" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Branch Name *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={company.branch} 
                      onChange={e => setCompany({ ...company, branch: e.target.value })} 
                      placeholder="Main Branch" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Provider *</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select 
                      value={company.provider} 
                      onChange={e => setCompany({ ...company, provider: e.target.value })} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="LTO">LTO</option>
                      <option value="IC">Insurance Commission</option>
                      <option value="BSP">BSP</option>
                    </select>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Address *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-2 text-gray-400" />
                    <textarea 
                      value={company.address} 
                      onChange={e => {
                        setCompany({ ...company, address: e.target.value });
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder="Complete business address" 
                      rows="1"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 overflow-hidden resize-none"
                      style={{ height: 'auto', minHeight: '38px' }}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <FileUpload 
                    label="Company Logo" 
                    accept="image/*" 
                    hint="PNG, JPG" 
                    onFile={(f, url) => setCompany({ ...company, logo: f, logoPreview: url })} 
                    preview={company.logoPreview} 
                  />
                </div>
                
                <div>
                  <FileUpload 
                    label="Accreditation" 
                    accept=".pdf,image/*" 
                    hint="PDF or Image" 
                    onFile={(f, url) => setCompany({ ...company, accreditation: f, accreditationName: f.name })} 
                    preview={company.accreditationName ? null : null} 
                  />
                  {company.accreditationName && (
                    <p className="text-xs text-primary-600 mt-1 truncate">{company.accreditationName}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-5 pt-3 border-t border-gray-100">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!company.name || !company.code || !company.branch || !company.address}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 - Profile Details */}
          {step === 2 && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <UserCircle size={16} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Profile Details</h2>
                  <p className="text-xs text-gray-500">Administrator's information</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center mb-5">
                <label className="text-xs font-semibold text-gray-700 block mb-2">Profile Photo</label>
                <div className="relative flex flex-col items-center">
                  <div 
                    className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    {profile.avatarPreview ? (
                      <img src={profile.avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={28} className="text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = handleFileUpload;
                        input.click();
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Upload size={12} /> Upload
                    </button>
                    
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Camera size={12} /> Take Photo
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">First Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={profile.firstName} 
                      onChange={e => setProfile({ ...profile, firstName: e.target.value })} 
                      placeholder="First name" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Middle Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={profile.middleName} 
                      onChange={e => setProfile({ ...profile, middleName: e.target.value })} 
                      placeholder="Middle name" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Last Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={profile.lastName} 
                      onChange={e => setProfile({ ...profile, lastName: e.target.value })} 
                      placeholder="Last name" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Email *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={e => setProfile({ ...profile, email: e.target.value })} 
                      placeholder="admin@company.com" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Mobile *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={profile.mobile} 
                      onChange={e => setProfile({ ...profile, mobile: e.target.value })} 
                      placeholder="09XXXXXXXXX" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-5 pt-3 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setStep(1)} size="sm" className="flex items-center gap-2">
                  <ArrowLeft size={14} /> Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!profile.firstName || !profile.lastName || !profile.email || !profile.mobile}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}
          
          {/* STEP 3 - Confirmation */}
          {step === 3 && (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Confirmation</h2>
                  <p className="text-xs text-gray-500">Review before submitting</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <Building2 size={14} className="text-primary-600" />
                    <h3 className="text-xs font-bold text-gray-900">Company</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex">
                      <span className="text-gray-500 w-20">Name:</span>
                      <span className="text-gray-700 font-medium truncate">{company.name || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Code:</span>
                      <span className="text-gray-700">{company.code || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Branch:</span>
                      <span className="text-gray-700">{company.branch || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Provider:</span>
                      <span className="text-gray-700">{company.provider || "—"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                    <UserCircle size={14} className="text-primary-600" />
                    <h3 className="text-xs font-bold text-gray-900">Profile</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex">
                      <span className="text-gray-500 w-20">Name:</span>
                      <span className="text-gray-700 font-medium truncate">
                        {[profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ") || "—"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Email:</span>
                      <span className="text-gray-700 truncate">{profile.email || "—"}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">Mobile:</span>
                      <span className="text-gray-700">{profile.mobile || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 flex items-center gap-2">
                <span className="text-amber-600 text-sm">⚠️</span>
                <p className="text-xs text-amber-700">Review carefully before submitting</p>
              </div>
              
              <div className="flex justify-between mt-5 pt-3 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setStep(2)} size="sm" className="flex items-center gap-2">
                  <ArrowLeft size={14} /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} size="sm" className="flex items-center gap-2">
                  {submitting ? <><Spinner size="sm" /> Submitting...</> : <>Submit</>}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};