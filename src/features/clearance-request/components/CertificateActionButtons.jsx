import { useState } from "react";
import { Button } from "../../../components/Button";
import { Eye, Download, Mail, Loader2 } from "lucide-react";
import { generateClearanceCertificatePDF } from "../utils/generateClearanceCertificatePDF";
import api from "../../../services/api";
import Swal from "sweetalert2";

const openPdfInNewTab = (blob) => {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");

  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const CertificateActionButtons = ({ row, disabled = false }) => {
  const hasCertificate = Boolean(row?.certificateNo);
  const isDisabled = disabled || !hasCertificate;
  
  const [isSending, setIsSending] = useState(false);

  const buildPdf = () => generateClearanceCertificatePDF(row);

  const handleView = async () => {
    if (isDisabled) return;
    const { doc } = await buildPdf();
    openPdfInNewTab(doc.output("blob"));
  };

  const handleDownload = async () => {
    if (isDisabled) return;
    const { doc, filename } = await buildPdf();
    doc.save(filename);
  };

  const handleSendEmail = async () => {
    if (isDisabled || isSending) return;

    setIsSending(true);

    try {
      const { doc } = await buildPdf();
      const dataUri = doc.output("datauristring");
      const base64Pdf = dataUri.split(",")[1];

      const res = await api.post("/email/send-certificate", {
        certificateNo: row.certificateNo,
        plateNo: row.plateNumber || row.plateNo || "",
        voucherCode: row.voucherCode || row.voucherReferenceNo || null,
        pdfBase64: base64Pdf,
      });

      const recipientEmail = res.data?.email || "your registered email";

      // Trigger SweetAlert popup
      Swal.fire({
        icon: "success",
        title: "Certificate Emailed!",
        text: `The certificate has been successfully sent to ${recipientEmail}.`,
        confirmButtonColor: "#0059b5",
        confirmButtonText: "OK",
      });

    } catch (err) {
      console.error("Failed to email certificate:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Send Email",
        text: err.response?.data?.error || "Failed to email certificate. Please try again.",
        confirmButtonColor: "#0059b5",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto grid w-24 grid-cols-3 items-center justify-items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="!px-2 !py-1.5"
        onClick={handleView}
        disabled={isDisabled}
        title="View PDF"
        aria-label="View PDF"
      >
        <Eye size={14} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="!px-2 !py-1.5"
        onClick={handleDownload}
        disabled={isDisabled}
        title="Download PDF"
        aria-label="Download PDF"
      >
        <Download size={14} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="!px-2 !py-1.5"
        onClick={handleSendEmail}
        disabled={isDisabled || isSending}
        title="Email Certificate"
        aria-label="Email Certificate"
      >
        {isSending ? (
          <Loader2 size={14} className="animate-spin text-blue-500" />
        ) : (
          <Mail size={14} />
        )}
      </Button>
    </div>
  );
};
