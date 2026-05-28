// components/CreateTicketModal.jsx
import { useState } from "react";
import { X, Send, User, FileText, AlertCircle } from "lucide-react";
import { Card } from "../../components/Card";
import { ConcernTypeSelector } from "./components/modals/ConcernTypeSelector";
import { RequestorInfoSection } from "./components/modals/RequestorInfoSection";
import { VehicleSection } from "./components/modals/VehicleSection";
import { OtherConcernSection } from "./components/modals/OtherConcernSection";

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
      category: "", // account, voucher, company, system, other
      details: "",
    },
    attachment: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("requestor");

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

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, attachment: e.target.files[0] }));
  };

  const handleConcernTypeChange = (typeId) => {
    setFormData((prev) => ({
      ...prev,
      concernType: typeId,
      vehicleSubType: "",
    }));

    // Auto-set subject based on concern type
    if (typeId === "vehicle") {
      setFormData((prev) => ({ ...prev, subject: "Vehicle Issue" }));
    } else if (typeId === "other") {
      setFormData((prev) => ({ ...prev, subject: "Other Concern" }));
    }
  };

  const handleVehicleSubTypeChange = (subTypeId) => {
    setFormData((prev) => ({ ...prev, vehicleSubType: subTypeId }));
    // Auto-set subject based on vehicle sub-type
    const subjectText =
      subTypeId === "dataMismatch"
        ? "Vehicle Data Mismatch"
        : "Vehicle Not Found";
    setFormData((prev) => ({ ...prev, subject: subjectText }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.requestedBy.name ||
      !formData.requestedBy.email ||
      !formData.concernType ||
      !formData.description
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Only validate vehicle fields if not in login page mode
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

    try {
      await onSubmit(formData);
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
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    { id: "requestor", label: "Requestor Information", icon: User },
    { id: "details", label: "Ticket Details", icon: FileText },
  ];

  const renderDynamicFields = () => {
    // For login page mode - show account section for login/account issues
    if (isLoginPageMode) {
      if (
        formData.concernType === "login" ||
        formData.concernType === "account"
      ) {
        return <AccountSection formData={formData} onChange={handleChange} />;
      }
      return null;
    }

    // For regular mode
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
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

                  {/* Subject is now auto-generated, not required as separate field */}
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

                  <Card className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Attachment (Optional)
                    </h3>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: JPG, PNG, PDF, DOC (Max 5MB)
                    </p>
                  </Card>
                </>
              )}
            </div>
          </form>

          {/* Footer */}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  {isLoginPageMode ? "Reporting..." : "Creating..."}
                </>
              ) : (
                <>
                  <Send size={14} />{" "}
                  {isLoginPageMode ? "Report Issue" : "Create Ticket"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
