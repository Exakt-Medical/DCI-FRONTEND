import { useState, useEffect } from "react";
import { commentsService } from "../../../services/commentsService";
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Info,
  ChevronDown,
  Save,
  AlertTriangle,
  Paperclip,
  Download,
  Eye,
  FileImage,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Card } from "../../../components/Card";
import { ticketService } from "../../../services/ticketService";
import { attachmentService } from "../../../services/attachmentService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const STATUS_FLOW = [
  { value: "OPEN", label: "Open", style: "bg-blue-100 text-blue-700" },
  {
    value: "PENDING",
    label: "Pending",
    style: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "PROCESSING",
    label: "Processing",
    style: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    style: "bg-green-100 text-green-700",
  },
  { value: "DECLINED", label: "Declined", style: "bg-red-100 text-red-700" },
  {
    value: "CANCELLED",
    label: "Cancelled",
    style: "bg-gray-100 text-gray-700",
  },
];

const getStatusMeta = (status) =>
  STATUS_FLOW.find((s) => s.value === status?.toUpperCase()) ?? {
    value: status,
    label: status,
    style: "bg-gray-100 text-gray-700",
  };

const formatDate = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const parseCorrections = (crAttachment) => {
  if (!crAttachment) return {};

  try {
    let data =
      typeof crAttachment === "string"
        ? JSON.parse(crAttachment)
        : crAttachment;

    const FIELD_KEY_MAP = {
      // Vehicle fields
      mv_file_number: "mvFileNo",
      plate_number: "plateNo",
      engine_number: "engineNo",
      chassis_number: "chassisNo",
      make: "make",
      series: "series",
      model: "series",
      color: "vehicleColor",
      vehicle_color: "vehicleColor",
      denomination: "vehicleTypeDenomination",
      vehicle_type: "vehicleTypeDenomination",
      year_model: "yearModel",
      year: "yearModel",
      classification: "classification",
      // Owner fields
      owner_firstName: "ownerFirstName",
      owner_lastName: "ownerLastName",
      owner_middleName: "ownerMiddleName",
      owner_address: "ownerAddress",
      owner_contactNo: "ownerContactNo",
      owner_email: "ownerEmail",
      owner_tin: "ownerTin",
      // Legacy fallbacks
      owner_name: "ownerName",
    };

    const result = {};

    if (Array.isArray(data)) {
      data.forEach(({ field, expected }) => {
        const key = FIELD_KEY_MAP[field] ?? field;
        if (expected) result[key] = expected;
      });
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([field, expected]) => {
        const key = FIELD_KEY_MAP[field] ?? field;
        if (expected) result[key] = expected;
      });
    }

    return result;
  } catch (e) {
    console.error("Failed to parse crAttachment:", e);
    return {};
  }
};

const CompareRow = ({
  label,
  original,
  correctedKey,
  correctedValues,
  onChange,
  editable,
}) => (
  <div className="contents">
    <div className="py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100 flex items-center">
      {label}
    </div>
    <div className="py-2.5 px-3 text-sm text-gray-700 border-b border-gray-100 bg-white flex items-center border-l border-gray-100">
      {original || "—"}
    </div>
    <div className="py-2.5 px-3 border-b border-gray-100 bg-green-50 flex items-center border-l border-gray-100">
      {editable ? (
        <input
          type="text"
          value={correctedValues[correctedKey] ?? ""}
          onChange={(e) => onChange(correctedKey, e.target.value)}
          placeholder={original || "Enter correct value"}
          className="w-full text-sm text-gray-900 bg-transparent border-b border-green-300 focus:border-green-500 focus:outline-none placeholder-gray-400 py-0.5"
        />
      ) : (
        <span
          className={`text-sm ${
            correctedValues[correctedKey]
              ? "text-green-700 font-medium"
              : "text-gray-400 italic"
          }`}
        >
          {correctedValues[correctedKey] || "—"}
        </span>
      )}
    </div>
  </div>
);

export const TicketDetailModal = ({
  ticket,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const [activeTab, setActiveTab] = useState("ticket");
  const [copied, setCopied] = useState({});
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [corrected, setCorrected] = useState({});
  const [chatMessage, setChatMessage] = useState("");
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch attachments for this ticket
  const fetchAttachments = async (referenceNumber) => {
    if (!referenceNumber) return;

    setLoadingAttachments(true);
    try {
      const allAttachments = await attachmentService.getAll();

      const ticketAttachments = allAttachments.filter(
        (att) => att.referenceNumber === referenceNumber,
      );

      const uniqueAttachments = new Map();
      ticketAttachments.forEach((att) => {
        const key = att.id || `${att.referenceNumber}-cr`;
        if (!uniqueAttachments.has(key)) {
          uniqueAttachments.set(key, att);
        }
      });

      const uniqueList = Array.from(uniqueAttachments.values());

      const processedAttachments = uniqueList.map((att) => ({
        id: att.id,
        referenceNumber: att.referenceNumber,
        hasCrAttachment: att.crAttachment && att.crAttachment.length > 0,
        hasPlateCertification:
          att.plateCertificationAttachment &&
          att.plateCertificationAttachment.length > 0,
        hasActualPlate:
          att.actualPlateAttachment && att.actualPlateAttachment.length > 0,
        crAttachmentUrl:
          att.crAttachment && att.crAttachment.length > 0
            ? `${API_BASE_URL}/attachment/${att.id}/image/cr`
            : null,
        plateCertificationUrl:
          att.plateCertificationAttachment &&
          att.plateCertificationAttachment.length > 0
            ? `${API_BASE_URL}/attachment/${att.id}/image/plate`
            : null,
        actualPlateUrl:
          att.actualPlateAttachment && att.actualPlateAttachment.length > 0
            ? `${API_BASE_URL}/attachment/${att.id}/image/actual`
            : null,
        crAttachmentName: att.crAttachmentName || "CR Attachment",
        plateCertificationName:
          att.plateCertificationName || "Plate Certification",
        actualPlateName: att.actualPlateName || "Actual Plate",
      }));

      setAttachments(processedAttachments);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    if (ticket) {
      setCurrentTicket(ticket);

      const parsedCorrections = parseCorrections(ticket.crAttachment);

      setCorrected({
        // Vehicle fields
        mvFileNo: parsedCorrections.mvFileNo ?? "",
        plateNo: parsedCorrections.plateNo ?? "",
        engineNo: parsedCorrections.engineNo ?? "",
        chassisNo: parsedCorrections.chassisNo ?? "",
        make: parsedCorrections.make ?? "",
        model: parsedCorrections.series ?? "",
        color: parsedCorrections.vehicleColor ?? "",
        vehicleType: parsedCorrections.vehicleTypeDenomination ?? "",
        yearModel: parsedCorrections.yearModel ?? "",
        classification: parsedCorrections.classification ?? "",
        // Owner fields
        ownerFirstName: parsedCorrections.ownerFirstName ?? "",
        ownerLastName: parsedCorrections.ownerLastName ?? "",
        ownerMiddleName: parsedCorrections.ownerMiddleName ?? "",
        ownerAddress: parsedCorrections.ownerAddress ?? "",
        ownerContactNo: parsedCorrections.ownerContactNo ?? "",
        ownerEmail: parsedCorrections.ownerEmail ?? "",
        ownerTin: parsedCorrections.ownerTin ?? "",
        // Legacy fallback
        ownerName: parsedCorrections.ownerName ?? "",
      });

      fetchAttachments(ticket.referenceNumber);
    }
  }, [ticket]);

  useEffect(() => {
    if (currentTicket && activeTab === "livechat") {
      fetchComments();
    }
  }, [currentTicket, activeTab]);

  const fetchComments = async () => {
    try {
      const data = await commentsService.getAll();
      const filtered = data.filter(
        (item) => item.referenceNumber === currentTicket.referenceNumber,
      );
      const mapped = filtered.map((item) => ({
        id: item.id,
        sender: item.users,
        message: item.comments,
        createdAt: new Date(item.createdAt || Date.now()),
      }));
      setComments(mapped);
    } catch (error) {
      console.error("Failed to load comments", error);
    }
  };

  if (!isOpen || !currentTicket) return null;

  const isMismatch = currentTicket.type === "Data Mismatch";
  const isVehicleNotFound = currentTicket.type === "Vehicle Not Found";
  const isLTOType = isMismatch || isVehicleNotFound;
  const isEscalated = currentTicket.roleBased === "LTO";

  const copy = async (key, text) => {
    await navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const handleCorrectedChange = (key, value) =>
    setCorrected((prev) => ({ ...prev, [key]: value }));

  const nvl = (v) => (v === "N/A" || v === undefined ? null : (v ?? null));

  const buildPayload = (overrides = {}) => ({
    referenceNumber: currentTicket.referenceNumber,
    status: currentTicket.status?.toUpperCase(),
    requestedBy:
      typeof currentTicket.requestedBy === "string"
        ? currentTicket.requestedBy
        : (currentTicket.requestedBy?.name ?? null),
    type: currentTicket.type,
    processedBy: localStorage.getItem("username") ?? currentTicket.processedBy,
    dateRequested: currentTicket.dateRequested,
    dateUpdated: new Date().toISOString(),
    escalated: currentTicket.escalated ?? "NO",
    roleBased: currentTicket.roleBased ?? null,
    name: currentTicket.customer,
    address: currentTicket.description,
    plateNo: nvl(currentTicket.vehicleInfo?.plateNo),
    mvFileNo: nvl(currentTicket.vehicleInfo?.mvFileNo),
    make: nvl(currentTicket.vehicleInfo?.make),
    series: nvl(currentTicket.vehicleInfo?.model),
    engineNo: nvl(currentTicket.vehicleInfo?.engineNo),
    chassisNo: nvl(currentTicket.vehicleInfo?.chassisNo),
    vehicleColor: nvl(currentTicket.vehicleInfo?.color),
    vehicleTypeDenomination: nvl(currentTicket.vehicleInfo?.vehicleType),
    classification: nvl(currentTicket.vehicleInfo?.classification),
    certificateOfRegistration: currentTicket.certificateOfRegistration ?? null,
    plateCertification: currentTicket.plateCertification ?? null,
    actualPlate: currentTicket.actualPlate ?? null,
    crAttachment: currentTicket.crAttachment ?? null,
    ...overrides,
  });

  const handleStatusChange = async (newStatus) => {
    setStatusDropdown(false);
    if (newStatus === currentTicket.status?.toUpperCase()) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updated = await ticketService.update(
        currentTicket.id,
        buildPayload({ status: newStatus }),
      );
      setCurrentTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setUpdateError(err.message ?? "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCorrection = async () => {
    setIsSavingCorrection(true);
    setUpdateError(null);
    try {
      const correctionsArray = [];
      const originalVehicle = currentTicket.vehicleInfo ?? {};

      if (corrected.plateNo && corrected.plateNo !== originalVehicle.plateNo)
        correctionsArray.push({
          field: "plate_number",
          expected: corrected.plateNo,
        });
      if (corrected.mvFileNo && corrected.mvFileNo !== originalVehicle.mvFileNo)
        correctionsArray.push({
          field: "mv_file_number",
          expected: corrected.mvFileNo,
        });
      if (corrected.engineNo && corrected.engineNo !== originalVehicle.engineNo)
        correctionsArray.push({
          field: "engine_number",
          expected: corrected.engineNo,
        });
      if (
        corrected.chassisNo &&
        corrected.chassisNo !== originalVehicle.chassisNo
      )
        correctionsArray.push({
          field: "chassis_number",
          expected: corrected.chassisNo,
        });
      if (corrected.make && corrected.make !== originalVehicle.make)
        correctionsArray.push({ field: "make", expected: corrected.make });
      if (corrected.model && corrected.model !== originalVehicle.series)
        correctionsArray.push({ field: "series", expected: corrected.model });
      if (corrected.color && corrected.color !== originalVehicle.color)
        correctionsArray.push({ field: "color", expected: corrected.color });
      if (
        corrected.vehicleType &&
        corrected.vehicleType !== originalVehicle.vehicleType
      )
        correctionsArray.push({
          field: "denomination",
          expected: corrected.vehicleType,
        });
      if (
        corrected.yearModel &&
        corrected.yearModel !== originalVehicle.yearModel
      )
        correctionsArray.push({
          field: "year_model",
          expected: corrected.yearModel,
        });
      if (
        corrected.classification &&
        corrected.classification !== originalVehicle.classification
      )
        correctionsArray.push({
          field: "classification",
          expected: corrected.classification,
        });
      if (corrected.ownerFirstName)
        correctionsArray.push({
          field: "owner_firstName",
          expected: corrected.ownerFirstName,
        });
      if (corrected.ownerLastName)
        correctionsArray.push({
          field: "owner_lastName",
          expected: corrected.ownerLastName,
        });
      if (corrected.ownerMiddleName)
        correctionsArray.push({
          field: "owner_middleName",
          expected: corrected.ownerMiddleName,
        });
      if (corrected.ownerAddress)
        correctionsArray.push({
          field: "owner_address",
          expected: corrected.ownerAddress,
        });
      if (corrected.ownerContactNo)
        correctionsArray.push({
          field: "owner_contactNo",
          expected: corrected.ownerContactNo,
        });
      if (corrected.ownerEmail)
        correctionsArray.push({
          field: "owner_email",
          expected: corrected.ownerEmail,
        });
      if (corrected.ownerTin)
        correctionsArray.push({
          field: "owner_tin",
          expected: corrected.ownerTin,
        });

      const updated = await ticketService.update(
        currentTicket.id,
        buildPayload({
          crAttachment:
            correctionsArray.length > 0
              ? JSON.stringify(correctionsArray)
              : currentTicket.crAttachment,
        }),
      );
      setCurrentTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setUpdateError(err.message ?? "Failed to save corrections.");
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleEscalate = async () => {
    if (isEscalated) return;
    setIsEscalating(true);
    setUpdateError(null);
    try {
      const updated = await ticketService.update(
        currentTicket.id,
        buildPayload({ roleBased: "LTO", escalated: "YES" }),
      );
      setCurrentTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setUpdateError(err.message ?? "Failed to escalate ticket.");
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSendComment = async () => {
    if (!chatMessage.trim()) return;
    try {
      const payload = {
        referenceNumber: currentTicket.referenceNumber,
        users: localStorage.getItem("username") || "You",
        comments: chatMessage,
      };
      const saved = await commentsService.create(payload);
      setComments((prev) => [
        ...prev,
        {
          id: saved.id,
          sender: saved.users,
          message: saved.comments,
          createdAt: new Date(),
        },
      ]);
      setChatMessage("");
    } catch (error) {
      console.error("Failed to save comment", error);
    }
  };

  const handleViewAttachment = async (url) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load image");
      const blob = await response.blob();
      setPreviewImage(URL.createObjectURL(blob));
    } catch (error) {
      console.error("View failed:", error);
      alert("Failed to view attachment.");
    }
  };

  const handleImageError = (attachmentId, type) => {
    setImageErrors((prev) => ({ ...prev, [`${attachmentId}-${type}`]: true }));
  };

  const v = currentTicket.vehicleInfo ?? {};

  const vehicleCompareRows = isVehicleNotFound
    ? [
        { label: "MV File No.", originalKey: "mvFileNo", original: v.mvFileNo },
        { label: "Plate No.", originalKey: "plateNo", original: v.plateNo },
        { label: "Engine No.", originalKey: "engineNo", original: v.engineNo },
        {
          label: "Chassis No.",
          originalKey: "chassisNo",
          original: v.chassisNo,
        },
      ]
    : [
        { label: "MV File No.", originalKey: "mvFileNo", original: v.mvFileNo },
        { label: "Plate No.", originalKey: "plateNo", original: v.plateNo },
        { label: "Engine No.", originalKey: "engineNo", original: v.engineNo },
        {
          label: "Chassis No.",
          originalKey: "chassisNo",
          original: v.chassisNo,
        },
        { label: "Make", originalKey: "make", original: v.make },
        { label: "Series / Model", originalKey: "model", original: v.series },
        { label: "Vehicle Color", originalKey: "color", original: v.color },
        {
          label: "Vehicle Type/Denomination",
          originalKey: "vehicleType",
          original: v.vehicleType,
        },
        {
          label: "Year Model",
          originalKey: "yearModel",
          original: v.yearModel,
        },
        {
          label: "Classification",
          originalKey: "classification",
          original: v.classification,
        },
      ];

  // currentTicket.customer = full name string from `t.name` in mapTicket
  // Split it best-effort: "FIRST MIDDLE LAST" or however it was stored
  const fullNameParts = (currentTicket.customer ?? "").trim().split(/\s+/);
  const ltoFirstName = fullNameParts[0] ?? "—";
  const ltoLastName =
    fullNameParts.length > 1 ? fullNameParts[fullNameParts.length - 1] : "—";
  const ltoMiddleName =
    fullNameParts.length > 2 ? fullNameParts.slice(1, -1).join(" ") : "—";

  const ownerCompareRows = [
    { label: "First Name", key: "ownerFirstName", original: ltoFirstName },
    { label: "Last Name", key: "ownerLastName", original: ltoLastName },
    { label: "Middle Name", key: "ownerMiddleName", original: ltoMiddleName },
    {
      label: "Address",
      key: "ownerAddress",
      original: currentTicket.description ?? "—",
    },
    { label: "Contact No.", key: "ownerContactNo", original: "—" },
    { label: "Email", key: "ownerEmail", original: "—" },
    { label: "TIN", key: "ownerTin", original: "—" },
  ];

  const requestedBy =
    typeof currentTicket.requestedBy === "string"
      ? currentTicket.requestedBy
      : (currentTicket.requestedBy?.name ?? "—");

  const statusMeta = getStatusMeta(currentTicket.status);
  const tabs = [
    { id: "ticket", label: "Ticket", icon: Info },
    { id: "livechat", label: "Live Chat", icon: MessageCircle },
  ];

  const renderAttachmentItem = (
    url,
    title,
    description,
    attachmentId,
    type,
    fileName,
  ) => {
    if (!url) return null;
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-3">
          <FileImage size={20} className="text-primary-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
            {fileName && (
              <p className="text-xs text-gray-400 mt-0.5">{fileName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleViewAttachment(url)}
            className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
          >
            <Eye size={14} /> View
          </button>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");
                const response = await fetch(url, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                  const blob = await response.blob();
                  const downloadUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = downloadUrl;
                  a.download =
                    fileName || `${title}_${currentTicket.referenceNumber}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(downloadUrl);
                }
              } catch (error) {
                console.error("Download failed:", error);
              }
            }}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <Download size={14} /> Download
          </button>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title }) => (
    <div className="grid grid-cols-[180px_1fr_1fr]">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50 border-b border-gray-200" />
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-l border-gray-200">
        LTO Record
      </div>
      <div className="px-3 py-2 text-xs font-semibold text-green-600 uppercase bg-green-50 border-b border-l border-gray-200">
        On Hand Record
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col ${isLTOType ? "max-w-5xl" : "max-w-4xl"}`}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ticket Details
                </h2>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                  <code className="text-sm font-mono font-medium text-gray-700">
                    {currentTicket.referenceNumber}
                  </code>
                  <button
                    onClick={() =>
                      copy("ticketNumber", currentTicket.referenceNumber)
                    }
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {copied.ticketNumber ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                {isEscalated && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                    <AlertTriangle size={11} /> Escalated to LTO
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 px-6">
            <div className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-32">
            {activeTab === "ticket" && (
              <div className="space-y-6 pt-6">
                {updateError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {updateError}
                  </div>
                )}

                {/* Escalated banner */}
                {isEscalated && (
                  <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <AlertTriangle
                      size={16}
                      className="text-orange-500 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-orange-700">
                        Ticket Escalated to LTO
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        This ticket has been forwarded to the Land
                        Transportation Office for further action.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status & Type */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      Status:
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdown((p) => !p)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusMeta.style} ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
                      >
                        {isUpdating && (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        {statusMeta.label}
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${statusDropdown ? "rotate-180" : ""}`}
                        />
                      </button>
                      {statusDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                          <div className="p-2">
                            {STATUS_FLOW.map((s) => {
                              const isActive =
                                currentTicket.status?.toUpperCase() === s.value;
                              return (
                                <button
                                  key={s.value}
                                  onClick={() => handleStatusChange(s.value)}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                >
                                  <span
                                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${s.style}`}
                                  >
                                    {s.label}
                                  </span>
                                  {isActive && (
                                    <Check
                                      size={15}
                                      className="text-green-600"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Type:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${isMismatch ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}
                      >
                        {currentTicket.type ?? "—"}
                      </span>
                    </div>
                    {isLTOType && (
                      <button
                        onClick={handleEscalate}
                        disabled={isEscalated || isEscalating}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isEscalated
                            ? "bg-orange-50 text-orange-500 border-orange-200 cursor-default"
                            : "bg-white text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                        } disabled:opacity-60`}
                      >
                        {isEscalating ? (
                          <>
                            <span className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />{" "}
                            Escalating…
                          </>
                        ) : isEscalated ? (
                          <>
                            <Check size={12} /> Escalated to LTO
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={12} /> Escalate to LTO
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── LTO types: two-column comparison ── */}
                {isLTOType ? (
                  <>
                    {/* Vehicle Information */}
                    <Card className="p-0 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">
                          Vehicle Information
                        </h3>
                      </div>
                      <SectionHeader />
                      <div className="grid grid-cols-[180px_1fr_1fr]">
                        {vehicleCompareRows.map((row) => (
                          <CompareRow
                            key={row.originalKey}
                            label={row.label}
                            original={row.original}
                            correctedKey={row.originalKey}
                            correctedValues={corrected}
                            onChange={handleCorrectedChange}
                            editable={true}
                          />
                        ))}
                      </div>
                    </Card>

                    {/* Owner Details */}
                    {!isVehicleNotFound && (
                      <Card className="p-0 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-base font-semibold text-gray-900">
                            Owner Details
                          </h3>
                        </div>
                        <SectionHeader />
                        <div className="grid grid-cols-[180px_1fr_1fr]">
                          {ownerCompareRows.map((row) => (
                            <CompareRow
                              key={row.key}
                              label={row.label}
                              original={row.original}
                              correctedKey={row.key}
                              correctedValues={corrected}
                              onChange={handleCorrectedChange}
                              editable={true}
                            />
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Attachments */}
                    <Card className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Paperclip size={18} className="text-primary-500" />
                        Attachments
                      </h3>
                      {loadingAttachments ? (
                        <div className="flex justify-center py-8">
                          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : attachments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No attachments found.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="space-y-3">
                              {renderAttachmentItem(
                                attachment.crAttachmentUrl,
                                "CR Attachment",
                                "Certificate of Registration",
                                attachment.id,
                                "cr",
                                attachment.crAttachmentName,
                              )}
                              {renderAttachmentItem(
                                attachment.plateCertificationUrl,
                                "Plate Certification",
                                "Certification of Plate Number",
                                attachment.id,
                                "plate",
                                attachment.plateCertificationName,
                              )}
                              {renderAttachmentItem(
                                attachment.actualPlateUrl,
                                "Actual Plate",
                                "Photo of Actual Plate",
                                attachment.id,
                                "actual",
                                attachment.actualPlateName,
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </>
                ) : (
                  /* ── Other types ── */
                  <>
                    <Card className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Ticket Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">
                            Reference Number
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {currentTicket.referenceNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">
                            Type
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {currentTicket.type || "—"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">
                            Requested By
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {requestedBy}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Concern Details
                      </h3>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Concern
                        </label>
                        <p className="text-sm text-gray-900 mt-1 break-words">
                          {currentTicket.description || "—"}
                        </p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Paperclip size={18} className="text-primary-500" />
                        Attachments
                      </h3>
                      {loadingAttachments ? (
                        <div className="flex justify-center py-8">
                          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : attachments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No attachments found.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {attachments.map((attachment) => (
                            <div key={attachment.id}>
                              {renderAttachmentItem(
                                attachment.crAttachmentUrl,
                                "Attachment",
                                "Uploaded file",
                                attachment.id,
                                "file",
                                attachment.crAttachmentName,
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </>
                )}

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
                        {requestedBy}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Processed By
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {currentTicket.processedBy || "Not assigned yet"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Date Requested
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(currentTicket.dateRequested)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(currentTicket.dateUpdated)}
                      </p>
                    </div>
                    {isEscalated && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Escalated To
                        </label>
                        <p className="text-sm font-semibold text-orange-600 mt-1">
                          LTO
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "livechat" && (
              <div className="pt-6">
                <Card className="p-0 overflow-hidden flex flex-col h-[600px]">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      Live Chat
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Add comments regarding this ticket.
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col">
                          <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {comment.sender}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words">
                              {comment.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type your comment..."
                        rows={2}
                        className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleSendComment}
                        className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Image Preview Overlay */}
          {previewImage && (
            <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 text-white text-3xl"
              >
                ×
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {isLTOType && activeTab === "ticket"
                ? "Edit the Corrected column and save to update the ticket."
                : ""}
            </p>
            <div className="flex gap-3">
              {isLTOType && activeTab === "ticket" && (
                <button
                  onClick={handleSaveCorrection}
                  disabled={isSavingCorrection}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isSavingCorrection ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Corrections
                    </>
                  )}
                </button>
              )}
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
    </div>
  );
};
