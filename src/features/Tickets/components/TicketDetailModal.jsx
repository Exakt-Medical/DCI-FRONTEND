import { useState } from "react";
import { X, Copy, Check, MessageCircle, Info } from "lucide-react";
import { Card } from "../../../components/Card";

export const TicketDetailModal = ({ ticket, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("ticket");
  const [copied, setCopied] = useState({});

  if (!isOpen || !ticket) return null;

  const handleCopyTicketNumber = async () => {
    await navigator.clipboard.writeText(ticket.referenceNumber);
    setCopied({ ...copied, ticketNumber: true });
    setTimeout(() => setCopied({ ...copied, ticketNumber: false }), 2000);
  };

  const handleCopyAllVehicleInfo = async () => {
    // Format all vehicle information as a single text block
    const vehicleInfoText = `MV File No.: ${vehicleInfo.mvFileNo}
Plate No.: ${vehicleInfo.plateNo}
Engine No.: ${vehicleInfo.engineNo}
Chassis No.: ${vehicleInfo.chassisNo}
Make: ${vehicleInfo.make}
Series: ${vehicleInfo.series}
Vehicle Color: ${vehicleInfo.vehicleColor}
Vehicle Type/Denomination: ${vehicleInfo.vehicleType}
Year Model: ${vehicleInfo.yearModel}
Classification: ${vehicleInfo.classification}`;

    await navigator.clipboard.writeText(vehicleInfoText);
    setCopied({ ...copied, allVehicleInfo: true });
    setTimeout(() => setCopied({ ...copied, allVehicleInfo: false }), 2000);
  };

  // Mock vehicle data - in real app, this would come from API
  const vehicleInfo = {
    mvFileNo: "MV-2024-001234",
    plateNo: "ABC-1234",
    engineNo: "ENG-987654321",
    chassisNo: "CHS-123456789",
    make: "Toyota",
    series: "Vios 1.3E",
    vehicleColor: "White",
    vehicleType: "Sedan",
    yearModel: "2024",
    classification: "Private",
  };

  // Mock owner details - in real app, this would come from API
  const ownerDetails = {
    name: ticket.requestedBy.name,
    address: "123 Main Street, Makati City, Metro Manila, Philippines 1200",
  };

  // Mock attachments
  const attachments = [
    { id: 1, name: "Certificate_of_Registration.pdf", type: "CR", url: "#" },
    {
      id: 2,
      name: "Plate_Certification.pdf",
      type: "Plate Certification",
      url: "#",
    },
    { id: 3, name: "Actual_Plate.jpg", type: "Actual Plate", url: "#" },
  ];

  const tabs = [
    { id: "ticket", label: "Ticket", icon: Info },
    { id: "livechat", label: "Live Chat", icon: MessageCircle },
  ];

  const vehicleFields = [
    { key: "mvFileNo", label: "MV File No.", value: vehicleInfo.mvFileNo },
    { key: "plateNo", label: "Plate No.", value: vehicleInfo.plateNo },
    { key: "engineNo", label: "Engine No.", value: vehicleInfo.engineNo },
    { key: "chassisNo", label: "Chassis No.", value: vehicleInfo.chassisNo },
    { key: "make", label: "Make", value: vehicleInfo.make },
    { key: "series", label: "Series", value: vehicleInfo.series },
    {
      key: "vehicleColor",
      label: "Vehicle Color",
      value: vehicleInfo.vehicleColor,
    },
    {
      key: "vehicleType",
      label: "Vehicle Type/Denomination",
      value: vehicleInfo.vehicleType,
    },
    { key: "yearModel", label: "Year Model", value: vehicleInfo.yearModel },
    {
      key: "classification",
      label: "Classification",
      value: vehicleInfo.classification,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ticket Details
                </h2>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                  <code className="text-sm font-mono font-medium text-gray-700">
                    {ticket.referenceNumber}
                  </code>
                  <button
                    onClick={handleCopyTicketNumber}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                    title="Copy ticket number"
                  >
                    {copied.ticketNumber ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs - Fixed */}
          <div className="flex-shrink-0 border-b border-gray-200 px-6">
            <div className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? "text-primary-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content - Scrollable with bottom padding */}
          <div className="flex-1 overflow-y-auto px-6 pb-32">
            {activeTab === "ticket" && (
              <div className="space-y-6 pt-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : ticket.status === "Processing"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "Resolved"
                              ? "bg-green-100 text-green-700"
                              : ticket.status === "Declined"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      Type:
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.type === "Data Mismatch"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {ticket.type}
                    </span>
                  </div>
                </div>

                {/* Vehicle Information with Copy All button */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Vehicle Information
                    </h3>
                    <button
                      onClick={handleCopyAllVehicleInfo}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      title="Copy all vehicle information"
                    >
                      {copied.allVehicleInfo ? (
                        <>
                          <Check size={16} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicleFields.map((field) => (
                      <div key={field.key}>
                        <label className="text-xs font-medium text-gray-500">
                          {field.label}
                        </label>
                        <p
                          className={`text-sm text-gray-900 mt-1 ${field.value.length > 20 ? "break-all" : ""}`}
                        >
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Owner Details */}
                <Card className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Owner Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Name
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {ownerDetails.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Address
                      </label>
                      <p className="text-sm text-gray-900 break-words mt-1">
                        {ownerDetails.address}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Attachments */}
                <Card className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Attachment(s)
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-600">
                              {attachment.type.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {attachment.type}
                            </p>
                            <p className="text-xs text-gray-500 break-all">
                              {attachment.name}
                            </p>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Request Details */}
                <Card className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Request Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Requested By
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {ticket.requestedBy.name}
                      </p>
                      <p className="text-xs text-gray-500 break-words mt-1">
                        {ticket.requestedBy.company}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Processed By
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {ticket.processedBy || "Not assigned yet"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Date Requested
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {ticket.dateRequested}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {ticket.dateUpdated}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "livechat" && (
              <div className="space-y-4 pt-6">
                <Card className="p-4">
                  <div className="text-center py-8">
                    <MessageCircle
                      size={48}
                      className="mx-auto text-gray-400 mb-3"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Live Chat
                    </h3>
                    <p className="text-sm text-gray-500">
                      Chat functionality coming soon. For now, please use the
                      notes feature or contact support directly.
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
