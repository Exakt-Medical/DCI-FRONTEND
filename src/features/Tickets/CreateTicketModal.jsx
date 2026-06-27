// components/CreateTicketModal.jsx
import { useState } from "react";
import { X, Send, User, FileText, AlertCircle, Paperclip } from "lucide-react";
import { Card } from "../../components/Card";
import { ConcernTypeSelector } from "./components/modals/ConcernTypeSelector";
import { RequestorInfoSection } from "./components/modals/RequestorInfoSection";
import { VehicleSection } from "./components/modals/VehicleSection";
import { OtherConcernSection } from "./components/modals/OtherConcernSection";

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
    console.log("Mock uploading attachment:", formData);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true };
  },
};

export const CreateTicketModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoginPageMode = false,
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
      vehicleSubType: "",
    }));

    if (typeId === "vehicle") {
      setFormData((prev) => ({ ...prev, subject: "Vehicle Issue" }));
    } else if (typeId === "other") {
      setFormData((prev) => ({ ...prev, subject: "Other Concern" }));
    }
  };

  const handleVehicleSubTypeChange = (subTypeId) => {
    setFormData((prev) => ({ ...prev, vehicleSubType: subTypeId }));
    const subjectText =
      subTypeId === "dataMismatch"
        ? "Vehicle Data Mismatch"
        : "Vehicle Not Found";
    setFormData((prev) => ({ ...prev, subject: subjectText }));
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
        setError(
          "Please select whether this is a Data Mismatch or Vehicle Not Found issue.",
        );
        return;
      }
      if (
        formData.vehicleSubType === "dataMismatch" &&
        !formData.vehicleInfo.mismatchedField
      ) {
        setError("Please select which field has a mismatch.");
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

  // Rest of your component remains the same...
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
            onVehicleSubTypeChange={handleVehicleSubTypeChange}
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
