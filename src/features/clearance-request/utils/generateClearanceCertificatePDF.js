import { jsPDF } from "jspdf";

const formatValue = (value) => {
  if (value === 0) return "0";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const safeFileSegment = (value) =>
  String(value || "certificate")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "certificate";

const drawField = (doc, { label, value, x, y, labelWidth, valueWidth }) => {
  const rowHeight = 8;

  doc.setDrawColor(214, 219, 229);
  doc.setLineWidth(0.3);
  doc.rect(x, y, labelWidth, rowHeight);
  doc.rect(x + labelWidth, y, valueWidth, rowHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text(label, x + 3, y + 5.2);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(formatValue(value).toUpperCase(), x + labelWidth + 3, y + 5.2);

  return y + rowHeight;
};

export const generateClearanceCertificatePDF = (row = {}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  const labelWidth = 52;
  const valueWidth = contentWidth - labelWidth;

  const certificateNo =
    row.certificateNo || row.clearanceReferenceNo || row.requestId || "UNKNOWN";
  const plateNumber = row.plateNumber || row.orCr?.plateNumber || "-";
  const voucherCode =
    row.voucherCode || row.voucherReferenceNo || row.voucherId || "-";
  const requestId = row.requestId || "-";
  const issuedDate = formatDate(row.certificateIssuedAt || row.dateCreated || new Date());
  const status = row.clearanceStatus || row.status || "CERTIFICATE_ISSUED";

  let y = 22;

  doc.setFillColor(0, 89, 181);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("CERTIFICATE OF CLEARANCE", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Issued through the DCI portal", pageWidth / 2, 24, {
    align: "center",
  });

  y = 48;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("Certificate Details", marginX, y);
  y += 5;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  const fields = [
    { label: "Certificate No.", value: certificateNo },
    { label: "Request ID", value: requestId },
    { label: "Plate Number", value: plateNumber },
    { label: "Transaction Code", value: voucherCode },
    { label: "Issued Date", value: issuedDate },
    { label: "Status", value: status },
  ];

  fields.forEach((field) => {
    y = drawField(doc, {
      ...field,
      x: marginX,
      y,
      labelWidth,
      valueWidth,
    });
  });

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text(
    "This document confirms that the clearance certificate was generated and is available in the DCI portal.",
    marginX,
    y,
    { maxWidth: contentWidth },
  );

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("Verification Reference", marginX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(
    `Use certificate number ${certificateNo} when checking the request status or sharing with the recipient.`,
    marginX,
    y,
    { maxWidth: contentWidth },
  );

  const filename = `Clearance_Certificate_${safeFileSegment(certificateNo)}.pdf`;

  return { doc, filename };
};
