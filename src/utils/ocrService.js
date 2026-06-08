import {
  OCR_DOCUMENT_TYPE,
  OCR_LOW_CONFIDENCE_THRESHOLD,
} from "../constants/ocrConfig";

let tesseractPromise;
let pdfjsPromise;

const DATE_PATTERN = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

const normalizeLine = (line = "") => line.replace(/\s+/g, " ").trim();

const cleanupValue = (value = "") =>
  value
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .trim();

const upper = (value = "") => cleanupValue(value).toUpperCase();

const extractDate = (value = "") => {
  const match = value.match(DATE_PATTERN);
  if (!match) return "";

  const [rawMonth, rawDay, rawYear] = match[1].split(/[\/\-]/);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const yearValue = Number(rawYear);
  const year = rawYear.length === 2 ? 2000 + yearValue : yearValue;

  if (!month || !day || !year) return "";

  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}`;

  return iso;
};

const extractAmount = (value = "") => {
  const match = value.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})/);
  if (!match) return "";
  return `PHP ${match[1]}`;
};

const pickByRegex = (text, patterns = []) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanupValue(match[1]);
  }
  return "";
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// maxExtra: how many additional continuation lines to join after the first value line
const pickLabeledValue = (lines, labels = [], { allowNextLine = true, maxExtra = 0 } = {}) => {
  const safeLines = Array.isArray(lines) ? lines : [];
  // A line that starts a new labelled field (word(s) followed by colon)
  const isNewLabel = (s) => /\b\w[\w\s]{1,20}:/i.test(s);

  const joinFrom = (startIndex) => {
    const parts = [];
    for (let e = startIndex; e <= startIndex + maxExtra; e++) {
      const next = cleanupValue(safeLines[e] || "");
      if (!next || next.startsWith("(")) break;
      if (parts.length > 0 && isNewLabel(next)) break;
      parts.push(next);
    }
    return parts.join(" ");
  };

  for (let index = 0; index < safeLines.length; index += 1) {
    const line = safeLines[index] || "";
    for (const label of labels) {
      const escapedLabel = escapeRegex(label);
      const inlinePattern = new RegExp(`(?:^|\\b)${escapedLabel}\\s*:?\\s*(.+)$`, "i");
      const inlineMatch = line.match(inlinePattern);
      if (inlineMatch?.[1]) {
        const inlineValue = cleanupValue(inlineMatch[1]);
        // Skip parenthetical hint text e.g. "(Last Name, First Name Middle Name)"
        if (inlineValue && !inlineValue.startsWith("(")) {
          if (maxExtra > 0) {
            // Join the inline value with any continuation lines
            const parts = [inlineValue];
            for (let e = 1; e <= maxExtra; e++) {
              const extra = cleanupValue(safeLines[index + e] || "");
              if (!extra || extra.startsWith("(") || isNewLabel(extra)) break;
              parts.push(extra);
            }
            return parts.join(" ");
          }
          return inlineValue;
        }
        // Inline value is a parenthetical hint — actual value starts on the next line
        if (allowNextLine) {
          const combined = joinFrom(index + 1);
          if (combined) return combined;
        }
        continue;
      }

      if (!allowNextLine) continue;

      const labelOnlyPattern = new RegExp(`(?:^|\\b)${escapedLabel}\\s*:?\\s*$`, "i");
      if (labelOnlyPattern.test(line)) {
        const combined = joinFrom(index + 1);
        if (combined) return combined;
      }
    }
  }
  return "";
};

const pickLineValue = (lines, labels = []) => {
  for (const line of lines) {
    const normalized = upper(line);
    const found = labels.find((label) => normalized.includes(label));
    if (!found) continue;

    const splitByColon = line.split(":");
    if (splitByColon.length > 1) {
      const value = cleanupValue(splitByColon.slice(1).join(":"));
      if (value) return value;
    }

    const inline = line.replace(new RegExp(found, "i"), "").trim();
    if (inline) return cleanupValue(inline);
  }
  return "";
};

// Right-column bleed keywords that appear in the breakdown-of-payment table
const OR_BREAKDOWN_STOP = /\s+(?:PHP\b|DELINQUENT\b|MVUC\b|SCIENCE\b|SURCHARGE\b|LEGAL\b|BREAKDOWN\b|REGISTRATION\b)/i;

const stripBreakdownBleed = (value = "") => {
  const idx = value.search(OR_BREAKDOWN_STOP);
  return idx > 0 ? value.slice(0, idx).trim() : value.trim();
};

const normalizePlate = (value = "") => {
  // Take only the first whitespace-free token — prevents grabbing adjacent cell text
  const firstToken = (value || "").split(/\s+/)[0] || "";
  const cleaned = upper(firstToken).replace(/[^A-Z0-9]/g, "");
  // Philippine plates are 3–9 characters
  if (cleaned.length < 3 || cleaned.length > 10) return "";
  return cleaned;
};

const normalizeName = (value = "") => upper(value).replace(/[^A-Z0-9\s.,-]/g, "").trim();

const normalizeVehicleField = (value = "") => upper(value).replace(/[^A-Z0-9\s/-]/g, "").trim();

const parseOrData = (text, lines) => {
  const orNumber = pickByRegex(text, [
    /OFFICIAL\s+RECEIPT\s+([A-Z0-9\-]{6,})/i,
    /O\.?R\.?\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
  ]);

  const orDateValue =
    pickLabeledValue(lines, ["DATE"]) ||
    pickByRegex(text, [/\bDATE\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i]);

  const amountFromTotalLine = pickLabeledValue(lines, ["TOTAL AMOUNT PAID", "AMOUNT PAID"]);
  const amountFromText = pickByRegex(text, [
    /TOTAL\s+AMOUNT\s+PAID\s*[:\-]?\s*(?:PHP\s*)?([0-9][0-9,]*\.[0-9]{2})/i,
    /TOTAL\s+AMOUNT\s+PAID[\s\S]{0,40}?(?:PHP\s*)?([0-9][0-9,]*\.[0-9]{2})/i,
  ]);

  // Owner name is always on the line immediately after the "RECEIVED FROM" label line
  // (the label line itself contains a parenthetical hint, not the name)
  const ownerNameRaw =
    pickLabeledValue(lines, ["RECEIVED FROM"], { allowNextLine: true, maxExtra: 0 }) || "";
  const ownerName = normalizeName(stripBreakdownBleed(ownerNameRaw)) || "";

  // Address label line contains "(No. Street, Barangay…)" hint — real address follows on
  // the next 1–2 lines (e.g. street line + "Second District" continuation line)
  const ownerAddressRaw =
    pickLabeledValue(lines, ["ADDRESS"], { allowNextLine: true, maxExtra: 1 }) || "";
  const ownerAddress = cleanupValue(stripBreakdownBleed(ownerAddressRaw)) || "";

  return {
    orNumber,
    orDate: extractDate(orDateValue),
    orAmount: extractAmount(amountFromTotalLine || amountFromText),
    vehicle: {
      plateNumber: normalizePlate(
        // Prefer the dedicated plate line; strip any trailing cell bleed before tokenising
        stripBreakdownBleed(
          pickLabeledValue(lines, ["PLATE NO", "PLATE NUMBER"]) ||
            pickByRegex(text, [
              /PLATE\s*NO\.?\s*[:\-]?\s*([A-Z0-9]{3,10})/i,
              /PLATE\s*NUMBER\s*[:\-]?\s*([A-Z0-9]{3,10})/i,
            ]),
        ),
      ),
      mvFileNumber: normalizeVehicleField(
        stripBreakdownBleed(
          pickLabeledValue(lines, ["FILE NO", "MV FILE NUMBER"]) ||
            pickByRegex(text, [
              /FILE\s*NO\.?\s*[:\-]?\s*([A-Z0-9]{6,20})/i,
              /MV\s*FILE\s*NUMBER\s*[:\-]?\s*([A-Z0-9]{6,20})/i,
            ]),
        ),
      ),
      classification: normalizeVehicleField(
        stripBreakdownBleed(
          pickLabeledValue(lines, ["CLASSIFICATION"]) ||
            pickByRegex(text, [/CLASSIFICATION\s*[:\-]?\s*([A-Z0-9()\-\s]{2,30})/i]),
        ),
      ),
      // Vehicle type can wrap onto the next line in the table cell (e.g. "Motorcycle with sidecar" / "Motorcycle")
      vehicleType: normalizeVehicleField(
        stripBreakdownBleed(
          pickLabeledValue(lines, ["VEHICLE TYPE"], { maxExtra: 1 }) ||
            pickByRegex(text, [/VEHICLE\s*TYPE\s*[:\-]?\s*([A-Z0-9()\-\s]{2,40})/i]),
        ),
      ),
      fuelType: normalizeVehicleField(
        stripBreakdownBleed(
          pickLabeledValue(lines, ["FUEL TYPE"]) ||
            pickByRegex(text, [/FUEL\s*TYPE\s*[:\-]?\s*([A-Z0-9()\-\s]{2,20})/i]),
        ),
      ),
      airconType: normalizeVehicleField(
        stripBreakdownBleed(
          pickLabeledValue(lines, ["AIRCON TYPE"]) ||
            pickByRegex(text, [/AIRCON\s*TYPE\s*[:\-]?\s*([A-Z0-9()\-\s]{2,20})/i]),
        ),
      ),
      // Year model: extract exactly 4 digits from the labeled line only
      // Exclude years found in the renewal-validity sentence (>= current century check)
      yearModel: (() => {
        const labeledLine = pickLabeledValue(lines, ["YEAR MODEL"]);
        const match = labeledLine.match(/((?:19|20)\d{2})/);
        return match ? match[1] : pickByRegex(text, [/YEAR\s*MODEL\s*[:\-]?\s*((?:19|20)\d{2})/i]);
      })(),
      color: normalizeVehicleField(
        stripBreakdownBleed(
          pickLabeledValue(lines, ["COLOR"]) ||
            pickByRegex(text, [/\bCOLOR\s*[:\-]?\s*([A-Z][A-Z0-9\s-]{1,20})/i]),
        ),
      ),
      ownerName,
      ownerAddress,
    },
  };
};

// ─── parseCrData ─────────────────────────────────────────────────────────────
// Switched from regex-only to line-based helpers (same pattern as parseOrData)
// to handle:
//   • Multi-line owner address (street line + "SECOND DISTRICT, 1603")
//   • Table-cell bleed in make/series/color/classification
//   • Series values containing dots ("NISSAN URVAN 2.5 CARGO MT")
//   • CR No. appearing at the bottom of the form
const parseCrData = (text, lines) => {
  // CR number: appears at the very bottom as "CR No. 0047053672"
  // Also handle inline header variants like "CR NO.: ABC123"
  const crNumber =
    pickByRegex(text, [
      /CR\s*No\.?\s*[:\-]?\s*([A-Z0-9\-]{5,})/i,
    ]) || "";

  // Plate: short token, regex is reliable; normalizePlate trims bleed
  const plateNumber = normalizePlate(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["PLATE NO", "PLATE NUMBER"]) ||
        pickByRegex(text, [/PLATE\s*NO\.?\s*[:\-]?\s*([A-Z0-9]{3,10})/i]),
    ),
  );

  // MV File No — label is "FILE NO." in the CR form
  const mvFileNumber = normalizeVehicleField(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["FILE NO", "MV FILE NO", "MV FILE NUMBER"]) ||
        pickByRegex(text, [/FILE\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{6,20})/i]),
    ),
  );

  // Engine / Chassis: still reliable via regex (single-cell, no bleed risk)
  const engineNumber = normalizeVehicleField(
    pickByRegex(text, [/ENGINE\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{5,})/i]),
  );
  const chassisNumber = normalizeVehicleField(
    pickByRegex(text, [/CHASSIS\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{5,})/i]),
  );

  // VIN: dedicated label in the CR form (rightmost column, same row as chassis)
  const vin = normalizeVehicleField(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["VIN"]) ||
        pickByRegex(text, [/\bVIN\s*[:\-]?\s*([A-Z0-9\-]{10,})/i]),
    ),
  );

  // Make/Brand — use line-based to avoid bleeding into adjacent cells
  const make = normalizeVehicleField(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["MAKE/BRAND", "MAKE", "BRAND"]) ||
        pickByRegex(text, [/MAKE\/?BRAND\s*[:\-]?\s*([A-Z0-9\-\s]{2,20})/i]),
    ),
  );

  // Series: allow dot so "2.5" survives; use line-based first
  const seriesRaw =
    pickLabeledValue(lines, ["SERIES"]) ||
    pickByRegex(text, [/SERIES\s*[:\-]?\s*([A-Z0-9.\-\s]{2,40})/i]);
  const series = cleanupValue(stripBreakdownBleed(seriesRaw))
    .toUpperCase()
    .replace(/[^A-Z0-9\s./-]/g, "") // preserve dot for displacement strings e.g. "2.5"
    .trim();

  // Year model: 4-digit year only, from labeled line first
  const yearModel =
    (() => {
      const labeled = pickLabeledValue(lines, ["YEAR MODEL"]);
      const m = labeled.match(/((?:19|20)\d{2})/);
      return m ? m[1] : "";
    })() || pickByRegex(text, [/YEAR\s*MODEL\s*[:\-]?\s*((?:19|20)\d{2})/i]);

  // Color — line-based prevents "ALPINE WHITE DIESEL PRIVATE-(PVT)" bleed
  const color = normalizeVehicleField(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["COLOR"]) ||
        pickByRegex(text, [/\bCOLOR\s*[:\-]?\s*([A-Z][A-Z0-9\s-]{1,30})/i]),
    ),
  );

  // Vehicle type — present in CR form; may wrap onto next line
  const vehicleType = normalizeVehicleField(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["VEHICLE TYPE"], { maxExtra: 1 }) ||
        pickByRegex(text, [/VEHICLE\s*TYPE\s*[:\-]?\s*([A-Z0-9()\-\s]{2,40})/i]),
    ),
  );

  // Classification — present in CR form
  const classification = normalizeVehicleField(
    stripBreakdownBleed(
      pickLabeledValue(lines, ["CLASSIFICATION"]) ||
        pickByRegex(text, [/CLASSIFICATION\s*[:\-]?\s*([A-Z0-9()\-\s]{2,30})/i]),
    ),
  );

  // Owner name: label is "OWNER'S NAME"; value is on the same or next line
  const ownerNameRaw =
    pickLabeledValue(lines, ["OWNER'S NAME", "OWNERS NAME"], {
      allowNextLine: true,
      maxExtra: 0,
    }) || "";
  const ownerName = normalizeName(stripBreakdownBleed(ownerNameRaw));

  // Owner address: two-line value (e.g. "HALLARE BLDG…" + "SECOND DISTRICT, 1603")
  const ownerAddressRaw =
    pickLabeledValue(lines, ["OWNER'S ADDRESS", "OWNERS ADDRESS"], {
      allowNextLine: true,
      maxExtra: 1,
    }) || "";
  const ownerAddress = cleanupValue(stripBreakdownBleed(ownerAddressRaw));

  return {
    crNumber,
    vehicle: {
      plateNumber,
      mvFileNumber,
      engineNumber,
      chassisNumber,
      vin,
      make,
      series,
      yearModel,
      color,
      vehicleType,
      classification,
      ownerName,
      ownerAddress,
    },
  };
};

const parseMvcData = (text, lines) => {
  const dateLine = pickLineValue(lines, ["DATE"]);
  const controlNo = pickLineValue(lines, ["HPG CONTROL NO", "CONTROL NO"]);
  const status = /NOT\s+IN\s+THE\s+LIST\s+OF\s+WANTED\/?STOLEN/i.test(text)
    ? "CLEAR"
    : /WANTED|STOLEN/i.test(text)
      ? "NOT_CLEAR"
      : "";

  return {
    mvcNo:
      cleanupValue(controlNo) ||
      pickByRegex(text, [
        /MVC\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
        /CLEARANCE\s+CERTIFICATE\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9\-]{6,})/i,
      ]),
    mvcIssueDate: extractDate(dateLine),
    mvcValidUntil: "",
    mvcStatus: status,
  };
};

const parseMecData = (text, lines) => {
  const issueDate = pickLineValue(lines, ["DATE"]);
  const no = pickByRegex(text, [
    /MACRO\-ETCHING\s+CERTIFICATE\s+NUMBER\s*[:\-]?\s*([A-Z0-9\-]{4,})/i,
    /MEC\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-]{4,})/i,
  ]);

  const result = /NOT\s+TAMPERED/i.test(text)
    ? "PASS"
    : /TAMPERED/i.test(text)
      ? "FAIL"
      : "";

  return {
    mecNo: cleanupValue(no),
    mecIssueDate: extractDate(issueDate),
    mecValidUntil: "",
    mecCo2: pickByRegex(text, [/CO2\s*[:\-]?\s*([0-9.]+\s*[A-Z/%]*\s*[A-Z]*)/i]),
    mecHc: pickByRegex(text, [/HC\s*[:\-]?\s*([0-9.]+\s*[A-Z/%]*\s*[A-Z]*)/i]),
    mecResult: result,
  };
};

const parseByDocumentType = (docType, rawText) => {
  const text = rawText || "";
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);

  if (docType === OCR_DOCUMENT_TYPE.OR) return parseOrData(text, lines);
  if (docType === OCR_DOCUMENT_TYPE.CR) return parseCrData(text, lines); // fix: pass lines
  if (docType === OCR_DOCUMENT_TYPE.MVC) return parseMvcData(text, lines);
  if (docType === OCR_DOCUMENT_TYPE.MEC) return parseMecData(text, lines);

  return {};
};

const loadTesseract = async () => {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js");
  }
  return tesseractPromise;
};

const loadPdfJs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist");
  }
  return pdfjsPromise;
};

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const renderImageToCanvas = async (file) => {
  const imageBitmap = await createImageBitmap(file);
  const maxWidth = 1800;
  const maxHeight = 1800;
  const scale = Math.min(maxWidth / imageBitmap.width, maxHeight / imageBitmap.height, 1);
  const width = Math.round(imageBitmap.width * scale);
  const height = Math.round(imageBitmap.height * scale);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();
  return canvas;
};

const renderPdfToCanvas = async (file) => {
  const pdfjs = await loadPdfJs();
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;

  return canvas;
};

const fileToCanvas = async (file) => {
  const type = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();
  const isPdf = type.includes("pdf") || name.endsWith(".pdf");

  if (isPdf) {
    return renderPdfToCanvas(file);
  }
  return renderImageToCanvas(file);
};

export const extractDocumentData = async (file, docType) => {
  if (!file || !docType) {
    return { confidence: 0, rawText: "", fields: {} };
  }

  const canvas = await fileToCanvas(file);
  const tesseract = await loadTesseract();
  const result = await tesseract.recognize(canvas, "eng");

  const rawText = result?.data?.text || "";
  const confidence = Number(result?.data?.confidence || 0);
  const fields = parseByDocumentType(docType, rawText);

  return {
    confidence,
    rawText,
    fields,
    isLowConfidence: confidence < OCR_LOW_CONFIDENCE_THRESHOLD,
  };
};

export const formatOcrHint = ({ status, confidence, error }) => {
  if (status === "extracting") return "Extracting text from document...";
  if (status === "success") {
    if (confidence < OCR_LOW_CONFIDENCE_THRESHOLD) {
      return `Low confidence OCR (${Math.round(confidence)}%). Please review extracted fields.`;
    }
    return `OCR complete (${Math.round(confidence)}% confidence).`;
  }
  if (status === "error") {
    return error || "OCR failed. You can enter values manually or upload again.";
  }
  return "Supports image and PDF files.";
};