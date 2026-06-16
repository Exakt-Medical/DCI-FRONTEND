import { Button } from "../../../components/Button";
import { Eye, Download, Mail } from "lucide-react";
import { generateClearanceCertificatePDF } from "../utils/generateClearanceCertificatePDF";

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

  const buildPdf = () => generateClearanceCertificatePDF(row);

  const handleView = () => {
    if (isDisabled) return;
    const { doc } = buildPdf();
    openPdfInNewTab(doc.output("blob"));
  };

  const handleDownload = () => {
    if (isDisabled) return;
    const { doc, filename } = buildPdf();
    doc.save(filename);
  };

  const handleShare = async () => {
    if (isDisabled) return;

    const { doc, filename } = buildPdf();
    const blob = doc.output("blob");
    const file = new File([blob], filename, { type: "application/pdf" });
    const subject = `Clearance Certificate ${row.certificateNo}`;
    const body = [
      `Certificate No: ${row.certificateNo}`,
      `Request ID: ${row.id || "-"}`,
      `Plate Number: ${row.plateNumber || "-"}`,
      "",
      "Please see the clearance certificate attached or download it from the DCI portal.",
    ].join("\n");

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: subject,
          text: body,
          files: [file],
        });
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }

    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
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
        onClick={handleShare}
        disabled={isDisabled}
        title="Share via email"
        aria-label="Share via email"
      >
        <Mail size={14} />
      </Button>
    </div>
  );
};
