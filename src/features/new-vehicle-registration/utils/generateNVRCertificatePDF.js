import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import DOTRLogo from "../../../assets/DOTR-LOGO.png";
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
    img.onerror = () => {
      resolve(null);
    };
    img.src = imageUrl;
  });
};

const safeFileSegment = (value) =>
  String(value || "certificate")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "certificate";

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

  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, y, labelColWidth, rowHeight);
  doc.rect(marginLeft + labelColWidth, y, valueColWidth, rowHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(label, marginLeft + paddingLeft, y + paddingTop + 3);

  let displayValue = String(value || "-");
  if (
    !displayValue.match(/\d{1,2}\/\d{1,2}\/\d{4}/) &&
    !displayValue.includes("@") &&
    !displayValue.includes(":")
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

export const generateNVRCertificatePDF = async (row = {}) => {
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

  const dotrLogoBase64 = await getImageBase64(DOTRLogo);
  const dciLogoBase64 = await getImageBase64(DCILogo);

  // ─── HEADER WITH LOGOS ──────────────────────────────────────────────────────

  if (dotrLogoBase64) {
    try {
      const logoWidth = 22;
      const logoHeight = logoWidth * (dotrLogoBase64.height / dotrLogoBase64.width);
      doc.addImage(dotrLogoBase64.base64, "PNG", marginLeft, y - 5, logoWidth, logoHeight);
    } catch (e) {
      doc.setDrawColor(0, 89, 181);
      doc.setLineWidth(0.5);
      doc.circle(marginLeft + 11, y, 11);
      doc.setFontSize(5);
      doc.setTextColor(0, 89, 181);
      doc.text("DOTR", marginLeft + 8, y + 1.5);
    }
  } else {
    doc.setDrawColor(0, 89, 181);
    doc.setLineWidth(0.5);
    doc.circle(marginLeft + 11, y, 11);
    doc.setFontSize(5);
    doc.setTextColor(0, 89, 181);
    doc.text("DOTR", marginLeft + 8, y + 1.5);
  }

  if (dciLogoBase64) {
    try {
      const logoWidth = 28;
      const logoHeight = logoWidth * (dciLogoBase64.height / dciLogoBase64.width);
      doc.addImage(
        dciLogoBase64.base64,
        "PNG",
        pageWidth - marginRight - logoWidth,
        y - 19,
        logoWidth,
        logoHeight,
      );
    } catch (e) {
      doc.setDrawColor(180, 30, 30);
      doc.setLineWidth(0.5);
      doc.circle(pageWidth - marginRight - 11, y, 11);
      doc.setFontSize(5);
      doc.setTextColor(180, 30, 30);
      doc.text("LTO", pageWidth - marginRight - 14, y + 1.5);
    }
  } else {
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
  const title = "CERTIFICATE OF REGISTRATION";
  const titleWidth = doc.getTextWidth(title);
  const titleX = (pageWidth - titleWidth) / 2;
  doc.text(title, titleX, y + 8);

  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(0.8);
  doc.line(titleX, y + 9.5, titleX + titleWidth, y + 9.5);

  y += 28;

  // Introductory Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const introText =
    "This is to certify that the motor vehicle described below has been registered in accordance with the relevant standards and regulations.";
  const splitIntro = doc.splitTextToSize(introText, tableWidth);
  doc.text(splitIntro, marginLeft, y);
  y += splitIntro.length * 4.5 + 8;

  // ─── VEHICLE INFORMATION SECTION ────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Vehicle Information", marginLeft, y);
  y += 8;

  const csr = row.csr || {};
  const stencil = row.stencil || {};
  const invoice = row.invoice || {};
  const ctpl = row.ctpl || {};

  const vehicle = {
    make: row.make || csr.make || stencil.make || invoice.vehicleMake || "TOYOTA",
    series: row.series || csr.series || stencil.series || invoice.vehicleSeries || "HIACE",
    mv_file_number: row.mvFileNumber || csr.mvFileNumber || stencil.mvFileNumber || "13242500000003A",
    engine_number: row.engineNumber || csr.engineNumber || stencil.engineNumber || "ENG-987654",
    chassis_number: row.chassisNumber || csr.chassisNumber || stencil.chassisNumber || "CHA-123456",
    plate_number: row.plateNumber || csr.plateNumber || stencil.plateNumber || ctpl.plateNumber || "ABC1234",
    color: row.color || csr.color || stencil.color || "WHITE",
    vehicle_type: row.vehicleType || "MOTOR VEHICLE",
    year_model: row.yearModel || csr.yearModel || stencil.yearModel || invoice.vehicleYearModel || "2025",
  };

  const vehicleRows = [
    ["Make and Model", `${vehicle.make} ${vehicle.series}`.trim()],
    ["MV File No.", vehicle.mv_file_number],
    ["Engine No.", vehicle.engine_number],
    ["Chassis No.", vehicle.chassis_number],
    ["Plate No.", vehicle.plate_number],
    ["Color", vehicle.color],
    ["Vehicle Type/Denomination", vehicle.vehicle_type],
    ["Year Model", vehicle.year_model],
  ];

  for (const [label, value] of vehicleRows) {
    y = drawTableRow(doc, y, label, value, pageWidth, marginLeft, labelColWidth, valueColWidth);
  }

  y += 8;

  // ─── DOCUMENT DETAILS SECTION ───────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Document Details", marginLeft, y);
  y += 8;

  const docRows = [
    ["Sales Invoice No.", invoice.invoiceNo || "-"],
    ["CSR No.", csr.csrNo || "-"],
    ["CTPL Policy No.", ctpl.policyNo || "-"],
  ];

  for (const [label, value] of docRows) {
    y = drawTableRow(doc, y, label, value, pageWidth, marginLeft, labelColWidth, valueColWidth);
  }

  y += 8;

  // ─── INSPECTION DETAILS SECTION ─────────────────────────────────────────────

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Inspection Details", marginLeft, y);
  y += 8;

  const authNo = row.certificateNo || row.refNumber || "UNKNOWN";

  const rawDate = row.dateIssued || row.dateCreated || new Date();
  const dateObj = new Date(rawDate);
  const dateStr = !Number.isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : String(rawDate);

  const inspectionRows = [
    ["DCI Authentication Code", authNo],
    ["Date of Registration", dateStr],
  ];

  for (const [label, value] of inspectionRows) {
    y = drawTableRow(doc, y, label, value, pageWidth, marginLeft, labelColWidth, valueColWidth);
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
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.5);
    doc.rect(qrX, y, qrSize, qrSize);
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text("[QR CODE]", qrX + 5, y + qrSize / 2 + 1);
  }

  // Footer text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const footerText = "This certifies that the information contained in this transaction has been validated against the official records of the Land Transportation Office (LTO).";
  doc.text(footerText, pageWidth / 2, 280, { align: "center" });

  const filename = `NVR_Certificate_${safeFileSegment(authNo)}.pdf`;

  return { doc, filename };
};
