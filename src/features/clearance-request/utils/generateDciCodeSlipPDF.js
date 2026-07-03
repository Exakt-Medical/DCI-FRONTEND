import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import DCILogo from "../../../assets/DCI-LOGO.png";

const getImageBase64 = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        resolve({
          base64: canvas.toDataURL("image/png"),
          width: img.width,
          height: img.height,
        });
      } catch (e) {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
};

const safeFileSegment = (value) =>
  String(value || "slip")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "slip";

export const generateDciCodeSlipPDF = async (row = {}) => {
  // Use A6 Landscape (148mm width x 105mm height) for a compact voucher-style slip
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a6",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 148
  const pageHeight = doc.internal.pageSize.getHeight(); // 105

  const transactionCode = row.voucherCode || row.voucherReferenceNo || "PENDING";

  // ─── HEADER: TITLE AND LOGO ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(19, 34, 59);
  doc.text("DCI CODE\nSLIP", 12, 10);

  // Render DCI Logo at top-right
  // ─── DCI LOGO ─────────────────────────────────────────────────────────────
  const dciLogo = await getImageBase64(DCILogo);

  if (dciLogo) {
    try {
      // Change ONLY this value whenever you want a larger/smaller logo
      const logoWidth = 20;

      // Maintain original aspect ratio
      const logoHeight =
        logoWidth * (dciLogo.height / dciLogo.width);

      const rightMargin = 12;
      const topMargin = -7;

      doc.addImage(
        dciLogo.base64,
        "PNG",
        pageWidth - rightMargin - logoWidth,
        topMargin,
        logoWidth,
        logoHeight
      );
    } catch (e) {
      // Ignore rendering errors
    }
  }

  // Separator line under title
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(12, 25, pageWidth - 12, 25);

  // ─── LEFT COLUMN: QR CODE & TRANSACTION CODE ────────────────────────────────
  const qrSize = 42;
  const qrX = 12;
  const qrY = 28;

  try {
    const qrDataUrl = await QRCode.toDataURL(transactionCode, {
      width: 250,
      margin: 1,
    });
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch (e) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.rect(qrX, qrY, qrSize, qrSize);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("[QR CODE ERROR]", qrX + 8, qrY + qrSize / 2, { align: "left" });
  }

  // Label: TRANSACTION CODE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("TRANSACTION CODE", 12, 76);

  // Value: TRANSACTION CODE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(transactionCode, 12, 84);

  // ─── VERTICAL SEPARATOR LINE ────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(62, 28, 62, 88);

  // ─── RIGHT COLUMN: INSTRUCTIONS & FOOTER ─────────────────────────────────────
  const rightColX = 68;
  let instructionY = 30;

  // Title: INSTRUCTION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 89, 181);
  doc.text("INSTRUCTION:", rightColX, instructionY);

  instructionY += 6;

  // Steps
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  const instructions = [
    "1. Keep a copy of the code by printing or downloading.",
    "2. Present this slip to the HPG officer for scanning and vehicle verification."
  ];

  const maxTextWidth = pageWidth - rightColX - 12; // 148 - 68 - 12 = 68mm

  for (const stepText of instructions) {
    const splitText = doc.splitTextToSize(stepText, maxTextWidth);
    doc.text(splitText, rightColX, instructionY);
    instructionY += splitText.length * 4.5;
  }

  // Footer notice
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text("This is an official system-generated transaction slip.", pageWidth / 2, 95, { align: "center" });

  const filename = `DCI_Transaction_Slip_${safeFileSegment(transactionCode)}.pdf`;

  return { doc, filename };
};
