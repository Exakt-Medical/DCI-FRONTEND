// components/CreateTicketModal.jsx
import { useState, useEffect } from "react";
import { X, Send, User, FileText, AlertCircle, Paperclip, Car } from "lucide-react";
import { Card } from "../../components/Card";
import { ConcernTypeSelector } from "./components/modals/ConcernTypeSelector";
import { RequestorInfoSection } from "./components/modals/RequestorInfoSection";
import { VehicleSection } from "./components/modals/VehicleSection";
import { OtherConcernSection } from "./components/modals/OtherConcernSection";
import { attachmentService } from "../../services/attachmentService";

// Get the API base URL from environment or use default
const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:8080";

// Helper function to get auth token
const getAuthToken = () => {
  // Try multiple storage locations and keys
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken");

  // If you're using cookies instead
  // const cookies = document.cookie.split(';').find(c => c.trim().startsWith('token='));
  // return cookies ? cookies.split('=')[1] : null;

  return token;
};

// API service with proper authentication
const attachmentApi = {
  upload: async (formData) => {
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found. Please log in.");
    }

    console.log("Uploading attachment with token:", !!token); // Debug: check if token exists

    const response = await fetch(`${API_BASE_URL}/api/attachment/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      // Clear invalid token
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("token");
      throw new Error("Authentication failed. Please log in again.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", response.status, errorText);
      throw new Error(`Failed to upload attachment: ${response.status}`);
    }

    return response.json();
  },
};

export const CreateTicketModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoginPageMode = false,
  prefilledData = null,
  previewTicket = null,
}) => {
  const [formData, setFormData] = useState({
    requestedBy: { name: "", email: "" },
    concernType: "",
    subject: "",
    description: "",
    vehicleSubType: "",
    vehicleInfo: {
      plateNo: "",
      make: "",
      model: "",
      mvFileNo: "",
      engineNo: "",
      chassisNo: "",
      correctValue: "",
      mismatchedField: "",
    },
    otherInfo: {
      category: "",
      details: "",
    },
    attachment: null,
    attachments: {
      crAttachment: null,
      plateCertificationAttachment: null,
      actualPlateAttachment: null,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("requestor");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (previewTicket) {
      const fetchAttachments = async () => {
        setLoadingAttachments(true);
        try {
          const all = await attachmentService.getAll();
          const filtered = all.filter(att => att.referenceNumber === previewTicket.referenceNumber);
          setAttachments(filtered.map(att => ({
            id: att.id,
            crAttachmentUrl: att.crAttachment && att.crAttachment.length > 0 ? `${API_BASE_URL}/attachment/${att.id}/image/cr` : null,
            plateCertificationUrl: att.plateCertificationAttachment && att.plateCertificationAttachment.length > 0 ? `${API_BASE_URL}/attachment/${att.id}/image/plate` : null,
            actualPlateUrl: att.actualPlateAttachment && att.actualPlateAttachment.length > 0 ? `${API_BASE_URL}/attachment/${att.id}/image/actual` : null,
            crAttachmentName: att.crAttachmentName || "CR Attachment",
            plateCertificationName: att.plateCertificationName || "Plate Certification",
            actualPlateName: att.actualPlateName || "Actual Plate",
          })));
        } catch (e) {
          console.error("Failed to load ticket attachments", e);
        } finally {
          setLoadingAttachments(false);
        }
      };
      fetchAttachments();
    } else {
      setAttachments([]);
    }
  }, [previewTicket]);

  useEffect(() => {
    if (isOpen && prefilledData) {
      setFormData((prev) => {
        const merged = {
          ...prev,
          ...prefilledData,
          requestedBy: {
            name: prefilledData.requestedBy?.name || prev.requestedBy?.name || [localStorage.getItem("firstname"), localStorage.getItem("lastname")].filter(Boolean).join(" "),
            email: prefilledData.requestedBy?.email || prev.requestedBy?.email || localStorage.getItem("email") || "",
          },
          vehicleInfo: {
            ...prev.vehicleInfo,
            ...prefilledData.vehicleInfo,
          },
          otherInfo: {
            ...prev.otherInfo,
            ...prefilledData.otherInfo,
          }
        };
        return merged;
      });

      if (prefilledData.concernType) {
        handleConcernTypeChange(prefilledData.concernType);
      }
    }
  }, [isOpen, prefilledData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError("");
  };

  const handleFileChange = (e, attachmentType = "general") => {
    const file = e.target.files[0];

    if (attachmentType === "general") {
      setFormData((prev) => ({ ...prev, attachment: file }));
    } else {
      setFormData((prev) => ({
        ...prev,
        attachments: { ...prev.attachments, [attachmentType]: file },
      }));
    }
  };

  const handleConcernTypeChange = (typeId) => {
    setFormData((prev) => ({
      ...prev,
      concernType: typeId,
      vehicleSubType: typeId === "vehicle" ? "vehicleNotFound" : "",
    }));

    if (typeId === "vehicle") {
      setFormData((prev) => ({ ...prev, subject: "Vehicle Not Found" }));
    } else if (typeId === "other") {
      setFormData((prev) => ({ ...prev, subject: "Other Concern" }));
    }
  };

  const uploadAttachments = async (referenceNumber, requestedBy) => {
    const hasFiles =
      formData.attachment ||
      Object.values(formData.attachments).some(
        (file) => file !== null,
      );

    if (!hasFiles) {
      console.log("No files to upload");
      return;
    }

    const uploadFormData = new FormData();

    uploadFormData.append("referenceNumber", referenceNumber);
    uploadFormData.append("requestedBy", requestedBy);

  // General attachment
    if (formData.attachment) {
    uploadFormData.append(
      "generalAttachment",
      formData.attachment,
    );
    }

  // Vehicle attachments
    if (formData.attachments.crAttachment) {
    uploadFormData.append(
      "crAttachment",
      formData.attachments.crAttachment,
    );
    }

    if (formData.attachments.plateCertificationAttachment) {
    uploadFormData.append(
      "plateCertificationAttachment",
      formData.attachments.plateCertificationAttachment,
    );
    }

    if (formData.attachments.actualPlateAttachment) {
    uploadFormData.append(
      "actualPlateAttachment",
      formData.attachments.actualPlateAttachment,
    );
    }

    await attachmentApi.upload(uploadFormData);

    console.log("All attachments uploaded successfully");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted!");

    // Validation
    if (
      !formData.requestedBy.name ||
      !formData.requestedBy.email ||
      !formData.concernType ||
      !formData.description
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isLoginPageMode && formData.concernType === "vehicle") {
      if (!formData.vehicleSubType) {
        setError("Please ensure this is a Vehicle Not Found issue.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    setUploadProgress(null);

    try {
      setUploadProgress("Creating ticket...");
      const { attachment, attachments, ...ticketOnlyData } = formData;

      const ticketResult = await onSubmit(ticketOnlyData);

      const referenceNumber =
        ticketResult?.referenceNumber ||
        ticketResult?.id ||
        ticketResult?.ticketId;
      const requestedBy = `${formData.requestedBy.name} (${formData.requestedBy.email})`;

      console.log("Ticket created with reference:", referenceNumber);

      // Only try to upload attachments if we have a reference number
      if (referenceNumber) {
        if (
          formData.attachment ||
          Object.values(formData.attachments).some((file) => file !== null)
        ) {
          setUploadProgress("Uploading attachments...");
          await uploadAttachments(referenceNumber, requestedBy);
        }
      } else {
        console.warn(
          "No reference number received from ticket creation, skipping attachment upload",
        );
      }

      setUploadProgress("Success!");

      // Reset form
      setFormData({
        requestedBy: { name: "", email: "" },
        concernType: "",
        subject: "",
        description: "",
        vehicleSubType: "",
        vehicleInfo: {
          plateNo: "",
          make: "",
          model: "",
          mvFileNo: "",
          engineNo: "",
          chassisNo: "",
          correctValue: "",
          mismatchedField: "",
        },
        otherInfo: { category: "", details: "" },
        attachment: null,
        attachments: {
          crAttachment: null,
          plateCertificationAttachment: null,
          actualPlateAttachment: null,
        },
      });

      onClose();
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!isOpen) return null;

  // ── Read-Only Preview Mode Layout ───────────────────────────────────────────
  if (previewTicket) {
    const v = previewTicket.vehicleInfo || {};
    const getStatusColor = (status) => {
      const s = String(status).toLowerCase();
      if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-200 animate-pulse";
      if (s === "resolved" || s === "closed") return "bg-green-100 text-green-800 border-green-200";
      return "bg-blue-100 text-blue-800 border-blue-200";
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-primary-500" />
                  Ticket Preview
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Viewing details of support ticket {previewTicket.referenceNumber || `#${previewTicket.id}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Reference No.</span>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{previewTicket.referenceNumber || "—"}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Status</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(previewTicket.status)}`}>
                      {previewTicket.statusLabel || previewTicket.status || "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-400">Date Created</span>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">
                      {previewTicket.dateRequested ? new Date(previewTicket.dateRequested).toLocaleString("en-PH") : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400">Concern Type</span>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{previewTicket.type || "—"}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-400">Requested By</span>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{previewTicket.requestedBy || previewTicket.customer || "—"}</p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-xs font-semibold text-gray-400">Description of Issue</span>
                  <p className="text-sm text-gray-700 whitespace-pre-line mt-1.5 leading-relaxed font-normal">
                    {previewTicket.description || previewTicket.address || "No description provided."}
                  </p>
                </div>
              </div>

              {v.plateNo && v.plateNo !== "N/A" && (
                <div className="space-y-3 pt-4 border-t border-gray-150">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Car size={16} className="text-[#0059b5]" />
                    Associated Vehicle Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Plate No.</span>
                      <p className="text-sm font-semibold text-gray-800 uppercase">{v.plateNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">MV File No.</span>
                      <p className="text-sm font-semibold text-gray-800 uppercase">{v.mvFileNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Make</span>
                      <p className="text-sm font-medium text-gray-800 uppercase">{v.make}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Model/Series</span>
                      <p className="text-sm font-medium text-gray-800 uppercase">{v.model}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Engine No.</span>
                      <p className="text-sm font-semibold text-gray-800 uppercase">{v.engineNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Chassis No.</span>
                      <p className="text-sm font-semibold text-gray-800 uppercase">{v.chassisNo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {(loadingAttachments || attachments.length > 0) && (
                <div className="space-y-3 pt-4 border-t border-gray-150">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Paperclip size={16} className="text-[#0059b5]" />
                    Attachments
                  </h3>
                  {loadingAttachments ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-[#0059b5] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          {att.crAttachmentUrl && (
                            <a
                              href={att.crAttachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1.5"
                            >
                              <Paperclip size={14} /> {att.crAttachmentName}
                            </a>
                          )}
                          {att.plateCertificationUrl && (
                            <a
                              href={att.plateCertificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1.5"
                            >
                              <Paperclip size={14} /> {att.plateCertificationName}
                            </a>
                          )}
                          {att.actualPlateUrl && (
                            <a
                              href={att.actualPlateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1.5"
                            >
                              <Paperclip size={14} /> {att.actualPlateName}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#0059b5] hover:bg-[#004a96] rounded-xl transition-colors shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard Create / Edit Mode Layout ──────────────────────────────────────
  const sections = [
    { id: "requestor", label: "Requestor Information", icon: User },
    { id: "details", label: "Ticket Details", icon: FileText },
  ];

  const renderDynamicFields = () => {
    if (isLoginPageMode) {
      if (
        formData.concernType === "login" ||
        formData.concernType === "account"
      ) {
        return <AccountSection formData={formData} onChange={handleChange} />;
      }
      return null;
    }

    switch (formData.concernType) {
      case "vehicle":
        return (
          <VehicleSection
            formData={formData}
            onChange={handleChange}
          />
        );
      case "other":
        return (
          <OtherConcernSection formData={formData} onChange={handleChange} />
        );
      default:
        return null;
    }
  };

  const renderAttachmentFields = () => {
    if (isLoginPageMode) return null;

    if (formData.concernType === "vehicle") {
      return (
        <Card className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Paperclip size={18} className="text-primary-500" />
            Vehicle Attachments
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                CR Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, "crAttachment")}
                accept=".jpg,.jpeg,.png,.pdf"
                className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Plate Certification Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={(e) =>
                  handleFileChange(e, "plateCertificationAttachment")
                }
                accept=".jpg,.jpeg,.png,.pdf"
                className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Actual Plate Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, "actualPlateAttachment")}
                accept=".jpg,.jpeg,.png,.pdf"
                className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
              />
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Paperclip size={18} className="text-primary-500" />
          Attachment (Optional)
        </h3>
        <input
          type="file"
          onChange={(e) => handleFileChange(e, "general")}
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
        />
        <p className="text-xs text-gray-400 mt-2">
          Supported formats: JPG, PNG, PDF, DOC (Max 5MB)
        </p>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-primary-500" />
                {isLoginPageMode ? "Report Login Issue" : "Create New Ticket"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isLoginPageMode
                ? "Having trouble logging in? Let us know and we'll help resolve the issue."
                : "Select your concern type and fill out the relevant information"}
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex-shrink-0 border-b border-gray-200 px-6">
            <div className="flex gap-6">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                      activeSection === section.id
                        ? "text-primary-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={16} />
                    {section.label}
                    {activeSection === section.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form with footer inside */}
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.tagName === "INPUT") {
                e.preventDefault();
              }
            }}
            className="flex-1 overflow-y-auto flex flex-col"
          >
            <div className="px-6 py-6 space-y-6 flex-1">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {uploadProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-600 text-sm flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  {uploadProgress}
                </div>
              )}

              {activeSection === "requestor" && (
                <RequestorInfoSection
                  formData={formData}
                  onChange={handleChange}
                />
              )}

              {activeSection === "details" && (
                <>
                  <ConcernTypeSelector
                    selectedType={formData.concernType}
                    onTypeChange={handleConcernTypeChange}
                    isLoginPageMode={isLoginPageMode}
                  />

                  <Card className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-primary-500" />
                      Ticket Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Please provide detailed information about your issue..."
                          rows={4}
                          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          required
                        />
                      </div>
                    </div>
                  </Card>

                  {renderDynamicFields()}
                  {renderAttachmentFields()}
                </>
              )}
            </div>

            {/* Footer inside form */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {activeSection === "requestor" ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection("details");
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#0059b5] hover:bg-[#004a96] rounded-xl transition-colors shadow-sm"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 animate-fade-in"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isLoginPageMode ? "Reporting..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      {isLoginPageMode ? "Report Issue" : "Create Ticket"}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
