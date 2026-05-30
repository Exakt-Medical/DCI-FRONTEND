import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import DOTRLogo from "../assets/DOTR-LOGO.png";
import LTOLogo from "../assets/LTO-LOGO.png";

/**
 * Converts image URL to base64 for embedding in PDF
 */
const getImageBase64 = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  });
};

function drawTableRow(
  doc,
  y,
  label,
  value,
  pageWidth,
  marginLeft,
  labelColWidth,
  valueColWidth,
) {
  const rowHeight = 7;
  const paddingLeft = 3;
  const paddingTop = 2.5;

  // Draw cell borders with semi-bold thickness (0.5pt)
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, y, labelColWidth, rowHeight);
  doc.rect(marginLeft + labelColWidth, y, valueColWidth, rowHeight);

  // Label text - BOLD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(label, marginLeft + paddingLeft, y + paddingTop + 3);

  // Value text - Normal but slightly bold for data
  let displayValue = String(value || "-");
  if (
    !displayValue.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
    !displayValue.includes("@")
  ) {
    displayValue = displayValue.toUpperCase();
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(
    displayValue,
    marginLeft + labelColWidth + paddingLeft,
    y + paddingTop + 3,
  );

  return y + rowHeight;
}

export async function generateCertificatePDF({
  vehicle,
  owner,
  insurance,
  authNo,
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const tableWidth = pageWidth - marginLeft - marginRight;
  const labelColWidth = tableWidth * 0.3;
  const valueColWidth = tableWidth * 0.7;

  let y = 20;

  // Load logos
  const dotrLogoBase64 = await getImageBase64(DOTRLogo);
  const ltoLogoBase64 = await getImageBase64(LTOLogo);

  // ─── HEADER WITH LOGOS ──────────────────────────────────────────────────────

  try {
    doc.addImage(dotrLogoBase64, "PNG", marginLeft, y - 5, 22, 22);
  } catch (e) {
    doc.setDrawColor(0, 89, 181);
    doc.setLineWidth(0.5);
    doc.circle(marginLeft + 11, y, 11);
    doc.setFontSize(5);
    doc.setTextColor(0, 89, 181);
    doc.text("DOTR", marginLeft + 8, y + 1.5);
  }

  try {
    doc.addImage(
      ltoLogoBase64,
      "PNG",
      pageWidth - marginRight - 22,
      y - 5,
      22,
      22,
    );
  } catch (e) {
    doc.setDrawColor(180, 30, 30);
    doc.setLineWidth(0.5);
    doc.circle(pageWidth - marginRight - 11, y, 11);
    doc.setFontSize(5);
    doc.setTextColor(180, 30, 30);
    doc.text("LTO", pageWidth - marginRight - 14, y + 1.5);
  }

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(20, 20, 20);
  const title = "CERTIFICATE OF VALIDATION";
  const titleWidth = doc.getTextWidth(title);
  const titleX = (pageWidth - titleWidth) / 2;
  doc.text(title, titleX, y + 8);

  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.8);
  doc.line(titleX, y + 9.5, titleX + titleWidth, y + 9.5);

  y += 28;

  // Introductory Text - Semi-bold with black color
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Black color for semi-bold effect
  const introText =
    "This is to certify that the motor vehicle described below has been validated for compliance with the relevant standards and regulations.";
  const splitIntro = doc.splitTextToSize(introText, tableWidth);
  doc.text(splitIntro, marginLeft, y);
  y += splitIntro.length * 4.5 + 8;

  // ─── VEHICLE INFORMATION SECTION ────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Vehicle Information", marginLeft, y);
  y += 8;

  const vehicleRows = [
    ["Make and Model", `${vehicle.make || ""} ${vehicle.series || ""}`.trim()],
    ["MV File No.", vehicle.mv_file_number],
    ["Engine No.", vehicle.engine_number],
    ["Chassis No.", vehicle.chassis_number],
    ["Plate No.", vehicle.plate_number],
    ["Color", vehicle.color],
    [
      "Vehicle Type/Denomination",
      vehicle.vehicle_type || vehicle.denomination || "",
    ],
    ["Year Model", vehicle.year_model],
    ["Classification", vehicle.classification],
  ];

  for (const [label, value] of vehicleRows) {
    y = drawTableRow(
      doc,
      y,
      label,
      value,
      pageWidth,
      marginLeft,
      labelColWidth,
      valueColWidth,
    );
  }

  y += 8;

  // ─── PREMIUM TYPE SECTION ───────────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Premium Type", marginLeft, y);
  y += 8;

  const premiumTypeRows = [
    [
      "Premium Type",
      vehicle.classification
        ? `${vehicle.classification.toUpperCase()} CARS (INCLUDING JEEPS AND AUVS)`
        : "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
    ],
  ];

  for (const [label, value] of premiumTypeRows) {
    y = drawTableRow(
      doc,
      y,
      label,
      value,
      pageWidth,
      marginLeft,
      labelColWidth,
      valueColWidth,
    );
  }

  y += 8;

  // ─── INSPECTION DETAILS SECTION ─────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Inspection Details", marginLeft, y);
  y += 8;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const inspectionRows = [
    ["DCI Authentication Code", authNo],
    ["Date of Validation", dateStr],
    ["Issuer", insurance.insurer || "PREMIER INSURANCE CORP."],
  ];

  for (const [label, value] of inspectionRows) {
    y = drawTableRow(
      doc,
      y,
      label,
      value,
      pageWidth,
      marginLeft,
      labelColWidth,
      valueColWidth,
    );
  }

  y += 12;

  // ─── QR CODE ─────────────────────────────────────────────────────────────────
  const qrSize = 28;
  const qrX = pageWidth - marginRight - qrSize;

  try {
    const verificationUrl = `${window.location.origin}/verify/${authNo}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
    });
    doc.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
  } catch (e) {
    // fallback placeholder if QR generation fails
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.5);
    doc.rect(qrX, y, qrSize, qrSize);
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text("[QR CODE]", qrX + 5, y + qrSize / 2 + 1);
  }

  y += qrSize + 8;

  // ─── SAVE ─────────────────────────────────────────────────────────────────────

  const filename = `Certificate_of_Validation_${vehicle.plate_number || "VEHICLE"}_${Date.now()}.pdf`;
  doc.save(filename);
}
