import type {
  OcrWord,
  FormFields,
  FieldExtractionEntry,
  FieldExtractionMap,
  ParseResult,
} from "./types";
import {
  FIELD_ALIASES,
  KNOWN_VEHICLE_BRANDS,
  SOURCE_SCORES,
} from "./constants";
import {
  cleanFieldValue,
  normalizeIdForCompare,
  toCanonical,
  isLabelLine,
} from "./normalize";
import {
  isLikelyPlate,
  isLikelyEngine,
  isLikelyChassis,
  isLikelyColor,
  isLikelyYearModel,
  isLikelyDate,
  isLikelyMakeBrand,
  isLikelyControlNo,
  isLikelyOwnerName,
  isLikelyMvrrNumber,
  isLikelyCrNumber,
  isLikelySbrNo,
  isLikelyTin,
  isLikelyMeNumber,
  isLikelyNhqPid,
  isLikelyOfficerName,
  isLikelyFuelType,
  isLikelyWeight,
  isLikelyMvFileNo,
} from "./validators";
import {
  extractAroundLabel,
  extractColorFromLines,
  extractByPatterns,
  findStackedVehicleIds,
  extractFromFindingsBlock,
  findRightText,
  findBelowText,
  findAboveText,
  findColorByLayout,
  findYearModelByLayout,
  findDateByLayout,
  findTextNearAnchorWithConstraint,
  findTextBetweenAnchors,
} from "./extractors";
import { buildLayoutText } from "./layoutText";
import { extractMVCCFields } from "./mvccExtractor";
import { extractMECFields } from "./mecExtractor";

export type DocType = "MVCC" | "MEC";

export function detectDocumentType(text: string): DocType {
  const upper = text.toUpperCase();
  if (upper.includes("MACRO-ETCHING CERTIFICATE")) return "MEC";
  if (
    upper.includes("MOTOR VEHICLE CLEARANCE CERTIFICATE") ||
    upper.includes("TO SERVE AND PROTECT") ||
    upper.includes("HPG CONTROL NO")
  ) {
    return "MVCC";
  }
  if (upper.includes("NHQ-PID") || upper.includes("MACRO ETCHING"))
    return "MEC";
  return "MVCC";
}

function isLikelyPhilippineAddressLine(value: string): boolean {
  const text = value.trim().toUpperCase();
  if (!text) return false;
  if (/^[A-Z][A-Z .,'-]{2,}$/.test(text) && !/\d/.test(text)) return false;
  return /\d|\b(?:ST|STREET|AVE|AVENUE|RD|ROAD|BLK|BLOCK|LOT|SUBD|SUBDIVISION|PHASE|PH|BRGY|BARANGAY|CITY|MUNICIPALITY|PROVINCE|ZIP|MALAYBALAY|PUROK|DISTRICT|VILLAGE)\b/.test(
    text,
  );
}

function isLikelyReceiptNo(value: string): boolean {
  const v = value.replace(/\s+/g, "").toUpperCase();
  // Reject pure-date patterns e.g. "05/19/2026" (all digits with slashes)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) return false;
  return /^[A-Z0-9\-./]{4,25}$/.test(v);
}

function isLikelyVehicleType(value: string): boolean {
  return value.trim().length >= 3;
}

function stripPaymentBreakdown(val: string): string {
  if (!val) return val;
  return val
    .replace(/(?:LEGAL\s*RESEARCH\s*FEE|SCIENCE\s*TAX(?:.*REGISTRATION)?|MVUC|DELINQUENT\s*REGISTRATION|PHP\s*[\d,.]+).*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isLikelyAmount(value: string): boolean {
  const v = value.trim().replace(/,/g, "");
  return (
    /^\d+(\.\d{1,2})?$/.test(v) ||
    /^PHP\s*[\d,]+/.test(v) ||
    /^P\s*[\d,]+/.test(v)
  );
}

/** Extract date value from lines that appear after a TIN label (OR document layout).
 *  Prioritizes mm/dd/yyyy format dates found near a Date: label below the TIN. */
function extractAfterTINDate(lines: string[]): string {
  for (let i = 0; i < lines.length; i++) {
    if (!/TIN/i.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
      if (!/DATE/i.test(lines[j])) continue;

      // First, try to extract mm/dd/yyyy format directly inline after the label
      const mmddyyyy = lines[j].match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
      if (mmddyyyy) return mmddyyyy[0];

      // Try other inline date values after splitting
      const parts = lines[j].split(/[:\-\|]/);
      if (parts.length > 1) {
        const inline = parts.slice(1).join(" ").trim();
        const inlineMmddyyyy = inline.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
        if (inlineMmddyyyy) return inlineMmddyyyy[0];
        if (isLikelyDate(inline)) return inline;
      }

      // Look for mm/dd/yyyy on nearby lines (next few lines after the Date label)
      for (let k = j + 1; k < Math.min(lines.length, j + 4); k++) {
        const candidate = lines[k].trim();
        if (!candidate || isLabelLine(candidate)) continue;
        const mmddyyyyNear = candidate.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
        if (mmddyyyyNear) return mmddyyyyNear[0];
        if (isLikelyDate(candidate)) return candidate;
      }
    }
  }
  return "";
}

/** Find mm/dd/yyyy date in the top-right corner of the document (OR layout).
 *  On Official Receipts the date is typically printed in the top-right area. */
function extractTopRightDate(words: OcrWord[], pageWidth: number): string {
  if (!words.length || !pageWidth) return "";

  // Top-right quadrant: upper 40% of the page, right 40% of the page
  const topBound = Math.max(...words.map((w) => w.y)) * 0.4;
  const rightBound = pageWidth * 0.6;

  const candidates = words
    .filter((w) => w.y < topBound && w.x > rightBound)
    .filter((w) => /\b\d{1,2}\/\d{1,2}\/\d{4}\b/.test(w.text))
    .sort((a, b) => b.x - a.x || a.y - b.y);

  for (const c of candidates) {
    const match = c.text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
    if (match) return match[0];
  }
  return "";
}

/** Find engine number in the top-left area next to the plate number (CR layout).
 *  Engine and Plate are typically adjacent at the top of the CR document. */
function extractEngineNearPlate(words: OcrWord[], pageWidth: number): string {
  if (!words.length) return "";

  // Top-left region: upper 30% of page, left 50%
  const topBound = Math.max(...words.map((w) => w.y)) * 0.3;
  const leftBound = pageWidth * 0.5;

  // Find the plate label word in the top-left area
  const plateLabel = words.find(
    (w) =>
      w.y < topBound &&
      w.x < leftBound &&
      FIELD_ALIASES.plateNo.some((a) =>
        w.text.toUpperCase().includes(a.toUpperCase()),
      ),
  );
  if (plateLabel) {
    // Look for engine label nearby (same y band or just below)
    const engineLabel = words.find(
      (w) =>
        Math.abs(w.y - plateLabel.y) < 80 &&
        w.x < leftBound &&
        FIELD_ALIASES.engineNo.some((a) =>
          w.text.toUpperCase().includes(a.toUpperCase()),
        ),
    );
    if (engineLabel) {
      const candidates = words
        .filter(
          (w) =>
            Math.abs(w.y - engineLabel.y) <=
              Math.max(18, engineLabel.height * 1.2) &&
            w.x > engineLabel.x + engineLabel.width * 0.3 &&
            w.x < leftBound &&
            !isLabelLine(w.text) &&
            isLikelyEngine(w.text),
        )
        .sort((a, b) => a.x - b.x);
      if (candidates.length) return candidates[0].text;
    }
  }

  // Fallback: any engine-like text in top-left area
  const topLeftCandidates = words
    .filter(
      (w) =>
        w.y < topBound &&
        w.x < leftBound &&
        isLikelyEngine(w.text) &&
        !isLabelLine(w.text),
    )
    .sort((a, b) => a.y - b.y || a.x - b.x);
  if (topLeftCandidates.length) return topLeftCandidates[0].text;

  return "";
}

/** Scan all lines for the first occurrence of a mm/dd/yyyy date format. */
function extractMmDdYyyyDate(lines: string[]): string {
  for (const line of lines) {
    const match = line.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
    if (match) return match[0];
  }

  return "";
}

/** Scan lines for any word matching a known color name (CR color field).
 *  Prioritizes color combos (e.g. RED/BLACK), then single-word colors. */
function extractAnyColorLine(lines: string[]): string {
  // Prefer color combinations with "/" (e.g. "RED/BLACK")
  for (const line of lines) {
    const match = line.match(/(?:^|\s)([A-Z]+\/[A-Z]+)(?:\s|$)/);
    if (match && isLikelyColor(match[1])) return match[1];
  }
  // Then individual words that are known colors
  const known = [
    "WHITE",
    "BLACK",
    "RED",
    "BLUE",
    "SILVER",
    "GOLD",
    "GRAY",
    "GREY",
    "GREEN",
    "YELLOW",
    "ORANGE",
    "BROWN",
    "PURPLE",
    "PINK",
    "BEIGE",
    "MAROON",
    "VIOLET",
    "INDIGO",
    "MAGENTA",
    "CYAN",
    "TEAL",
    "TAN",
    "LAVENDER",
    "TURQUOISE",
    "PEARL",
    "BRONZE",
    "COPPER",
    "PLATINUM",
    "CHAMPAGNE",
    "CREAM",
    "IVORY",
    "CRIMSON",
    "NAVY",
    "AQUA",
  ];
  const allWords = lines.flatMap((l) => l.split(/\s+/));
  const uniqueWords = [...new Set(allWords)];
  for (const word of uniqueWords) {
    if (known.includes(word.toUpperCase())) return word.toUpperCase();
  }
  // Multi-word colors like "DARK BLUE"
  for (const line of lines) {
    const match = line.match(
      /(?:DARK|LIGHT|METALLIC|MATTE|GLOSS|BRIGHT|DEEP|PALE|SATIN)\s+[A-Z]{3,15}/i,
    );
    if (match && isLikelyColor(match[0])) return match[0].toUpperCase();
  }
  return "";
}

/** Scan lines for a field value above an anchor label (line-based). */
function extractAboveAnchorLine(
  lines: string[],
  targetAliases: readonly string[],
  anchorAliases: readonly string[],
  validator: (v: string) => boolean,
): string {
  for (let i = 0; i < lines.length; i++) {
    const anchorCanon = anchorAliases
      .map(toCanonical)
      .some((c) => toCanonical(lines[i]).includes(c));
    if (!anchorCanon) continue;
    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
      const candidate = lines[j].trim();
      if (!candidate || isLabelLine(candidate)) continue;
      if (validator(candidate)) return candidate;
    }
  }
  return "";
}

/** Scan lines for a field value below an anchor label (line-based). */
function extractBelowAnchorLine(
  lines: string[],
  targetAliases: readonly string[],
  anchorAliases: readonly string[],
  validator: (v: string) => boolean,
): string {
  for (let i = 0; i < lines.length; i++) {
    const anchorCanon = anchorAliases
      .map(toCanonical)
      .some((c) => toCanonical(lines[i]).includes(c));
    if (!anchorCanon) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
      const candidate = lines[j].trim();
      if (!candidate || isLabelLine(candidate)) continue;
      if (validator(candidate)) return candidate;
    }
  }
  return "";
}

/** Scan lines for a field value on the same line as gross weight (line-based). */
function extractNextToGrossWeightLine(
  lines: string[],
  validator: (v: string) => boolean,
): string {
  for (let i = 0; i < lines.length; i++) {
    const grossCanon = FIELD_ALIASES.grossWeight
      .map(toCanonical)
      .some((c) => toCanonical(lines[i]).includes(c));
    if (!grossCanon) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
      const candidate = lines[j].trim();
      if (!candidate || isLabelLine(candidate)) continue;
      if (validator(candidate)) return candidate;
    }
  }
  return "";
}

/** Strip a known label from the start of a line and return the remainder. */
function extractInlineAfterLabel(
  lines: string[],
  labelAliases: readonly string[],
  validator: (v: string) => boolean,
): string {
  for (const line of lines) {
    const upper = line.toUpperCase();
    for (const alias of labelAliases) {
      const idx = upper.indexOf(alias.toUpperCase());
      if (idx === -1) continue;
      const after = line
        .slice(idx + alias.length)
        .replace(/^[^A-Z0-9]+/, "")
        .trim();
      if (after && validator(after)) return after;
    }
  }
  return "";
}

function extractMvFileNoFromOwnerBlock(lines: string[]): string {
  const labelCanonicals = FIELD_ALIASES.mvFileNo.map((alias) =>
    toCanonical(alias),
  );

  for (let i = 0; i < lines.length; i++) {
    if (
      !labelCanonicals.some((canonical) =>
        toCanonical(lines[i]).includes(canonical),
      )
    )
      continue;

    const inline = lines[i]
      .split(/[:\-\|]/)
      .slice(1)
      .join(" ")
      .trim();
    if (inline && isLikelyMvFileNo(inline)) return inline;

    for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
      const candidate = lines[j].trim();
      if (!candidate) continue;
      if (isLabelLine(candidate)) break;
      if (isLikelyMvFileNo(candidate)) return candidate;
    }
  }

  return "";
}

function extractOwnerFromReceivedFrom(lines: string[]): string {
  for (let i = 0; i < lines.length; i++) {
    if (!/RECEIVED\s*FROM/i.test(lines[i])) continue;

    const inline = lines[i]
      .replace(/.*RECEIVED\s*FROM(?:\s*\([^)]*\))?\s*[:\-]?\s*/i, "")
      .trim();
    if (inline && isLikelyOwnerName(inline)) return inline;

    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      const candidate = lines[j].trim();
      if (!candidate || isLabelLine(candidate)) continue;
      if (isLikelyOwnerName(candidate)) return candidate;
    }
  }
  return "";
}

function extractAddressFromAddressLabel(lines: string[]): string {
  for (let i = 0; i < lines.length; i++) {
    if (!/^ADDRESS\b/i.test(lines[i])) continue;

    const values: string[] = [];
    const inline = lines[i].replace(/^ADDRESS\b[^:]*[:\-]?\s*/i, "").trim();
    if (inline) values.push(inline);

    for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
      const candidate = lines[j].trim();
      if (!candidate || isLabelLine(candidate)) continue;
      const upper = candidate.toUpperCase();
      if (
        /^(TIN|TAX\s*IDENTIFICATION\s*NUMBER|PAYMENT\s*DETAILS|TRANSACTION\s*NO|TOTAL\s*AMOUNT\s*PAID|MODE\s*OF\s*PAYMENT|LOCATION|CASHIER|POS\s*MACHINE)\b/.test(
          upper,
        )
      ) {
        break;
      }
      values.push(candidate);
    }

    const address = values
      .filter((line) => isLikelyPhilippineAddressLine(line))
      .join(" ")
      .trim();
    if (address) return address;
  }
  return "";
}

function extractAddressFromOwnerBlock(lines: string[]): string {
  const labelCanonicals = FIELD_ALIASES.ownerName.map((alias) =>
    toCanonical(alias),
  );

  for (let i = 0; i < lines.length; i++) {
    if (
      !labelCanonicals.some((canonical) =>
        toCanonical(lines[i]).includes(canonical),
      )
    )
      continue;

    const valueLines: string[] = [];
    const inline = lines[i]
      .split(/[:\-\|]/)
      .slice(1)
      .join(" ")
      .trim();
    if (inline) valueLines.push(inline);

    for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
      const candidate = lines[j].trim();
      if (!candidate) continue;
      if (isLabelLine(candidate)) break;

      const upper = candidate.toUpperCase();
      if (
        /^(MV\s*FILE|HPG\s*CONTROL|CONTROL\s*NO|DATE|MAKE\/?(TYPE|BRAND)|PLATE\s*NO|ENGINE\s*NO|CHASSIS\s*NO|TIN)/.test(
          upper,
        )
      ) {
        break;
      }

      if (/^TIN\b|TAX\s*IDENTIFICATION\s*NUMBER/.test(upper)) continue;
      valueLines.push(candidate);
    }

    const addressLines = valueLines
      .filter((line) => !isLikelyOwnerName(line))
      .filter((line) => isLikelyPhilippineAddressLine(line));
    if (addressLines.length) return addressLines.join(" ").trim();
  }

  return "";
}

function extractYearFromMakeBrand(makeBrand: string): string {
  const match = makeBrand.match(/\/(19[8-9]\d|20[0-2]\d|203[0-5])\b/);
  if (match) return match[1];
  const match2 = makeBrand.match(/\b(19[8-9]\d|20[0-2]\d|203[0-5])\b/);
  return match2 ? match2[1] : "";
}

function extractTin(lines: string[]): string {
  const labelCanonicals = FIELD_ALIASES.tin.map((alias) => toCanonical(alias));

  for (let i = 0; i < lines.length; i++) {
    if (
      !labelCanonicals.some((canonical) =>
        toCanonical(lines[i]).includes(canonical),
      )
    )
      continue;

    const inline = lines[i]
      .split(/[:\-\|]/)
      .slice(1)
      .join(" ")
      .trim();
    if (inline && isLikelyTin(inline)) return inline;

    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      const candidate = lines[j].trim();
      if (!candidate) continue;
      if (isLabelLine(candidate)) break;
      if (isLikelyTin(candidate)) return candidate;
    }
  }

  return "";
}

function extractMvccControlNoFromHpgBlock(lines: string[]): string {
  const labelIndex = lines.findIndex((l) => /HPG\s*CONTROL\s*NO/.test(l));
  if (labelIndex < 0) return "";

  // Look just below the label where the value is typically printed.
  const scope = lines.slice(
    labelIndex + 1,
    Math.min(lines.length, labelIndex + 10),
  );
  for (const line of scope) {
    const candidate = line.trim();
    if (!candidate) continue;
    if (
      /PNP\s*MOTOR\s*VEHICLE\s*CLEARANCE\s*CERTIFICATE|AUTHORITY|SECTION|RA\s*\d+|AM|PM|DATE|TIME/i.test(
        candidate,
      )
    ) {
      continue;
    }
    if (isLikelyControlNo(candidate)) return candidate;
  }
  return "";
}

function pickField(
  label: string,
  validator: (v: string) => boolean,
  candidates: Record<string, string>,
  allowFallback = false,
  prioritizeCoord = false
): FieldExtractionEntry {
  let entries = Object.entries(candidates)
    .map(([source, value]) => ({ source, value: value.trim() }))
    .filter((item) => Boolean(item.value));

  if (prioritizeCoord) {
    const coordIdx = entries.findIndex((e) => e.source === "coord");
    if (coordIdx > 0) {
      const coordEntry = entries.splice(coordIdx, 1)[0];
      entries.unshift(coordEntry);
    }
  }

  const validEntry = entries.find((item) => validator(item.value));
  const fallback = allowFallback ? (entries[0]?.value ?? "") : "";
  const fallbackSrc = allowFallback
    ? (entries[0]?.source ?? "fallback")
    : "none";
  const selected = validEntry?.value ?? fallback;
  const source = validEntry?.source ?? (selected ? fallbackSrc : "none");

  return {
    label,
    candidates,
    selected,
    valid: Boolean(
      validEntry ?? (allowFallback && fallback && validator(fallback)),
    ),
    source,
    confidence: SOURCE_SCORES[source] ?? 0.6,
  };
}

function applyConsistencyAdjustment(
  entry: FieldExtractionEntry,
  validator: (v: string) => boolean,
): FieldExtractionEntry {
  const vals = Object.values(entry.candidates)
    .map((v) => v.trim())
    .filter((v) => Boolean(v) && validator(v))
    .map(normalizeIdForCompare);

  if (vals.length < 2 || !entry.selected) return entry;

  const norm = normalizeIdForCompare(entry.selected);
  const support = vals.filter((v) => v === norm).length;
  const unique = new Set(vals).size;
  let conf = entry.confidence;
  if (support >= 2) conf = Math.min(0.99, conf + 0.08);
  if (unique >= 2) conf = Math.max(0.45, conf - 0.1);
  return { ...entry, confidence: conf };
}

export function parseFields(
  normalizedText: string,
  words: OcrWord[],
  pageWidth: number,
): ParseResult {
  const lines = normalizedText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const flat = lines.join("\n");
  const docType = detectDocumentType(flat);

  const pageHeight = words.length ? Math.max(...words.map(w => w.y + w.height)) : 0;

  const stacked = findStackedVehicleIds(normalizedText);
  const findings = extractFromFindingsBlock(normalizedText);
  const mvccSpecific =
    docType === "MVCC" ? extractMVCCFields(lines, words) : null;
  const mecSpecific = docType === "MEC" ? extractMECFields(lines, words, pageWidth, pageHeight) : null;

  const lineScan = {
    mvccControlNo:
      extractMvccControlNoFromHpgBlock(lines) ||
      extractAroundLabel(lines, FIELD_ALIASES.mvccControlNo, isLikelyControlNo),
    ownerName:
      extractOwnerFromReceivedFrom(lines) ||
      extractAroundLabel(lines, FIELD_ALIASES.ownerName, isLikelyOwnerName),
    address:
      extractAddressFromAddressLabel(lines) ||
      extractAddressFromOwnerBlock(lines),
    tin: extractTin(lines),
    mvFileNo: extractMvFileNoFromOwnerBlock(lines),
    plate: extractAroundLabel(lines, FIELD_ALIASES.plateNo, isLikelyPlate),
    engine:
      extractAboveAnchorLine(
        lines,
        FIELD_ALIASES.engineNo,
        FIELD_ALIASES.vehicleType,
        isLikelyEngine,
      ) || extractAroundLabel(lines, FIELD_ALIASES.engineNo, isLikelyEngine),
    chassis: extractAroundLabel(
      lines,
      FIELD_ALIASES.chassisNo,
      isLikelyChassis,
    ),
    color:
      extractAnyColorLine(lines) ||
      extractBelowAnchorLine(
        lines,
        FIELD_ALIASES.color,
        FIELD_ALIASES.vehicleType,
        isLikelyColor,
      ) ||
      extractColorFromLines(lines),
    yearModel: extractAroundLabel(
      lines,
      FIELD_ALIASES.yearModel,
      isLikelyYearModel,
    ),
    makeBrand: extractAroundLabel(
      lines,
      FIELD_ALIASES.makeBrand,
      isLikelyMakeBrand,
    ),
    date: extractAroundLabel(lines, FIELD_ALIASES.date, isLikelyDate),
    classification:
      extractAroundLabel(lines, FIELD_ALIASES.classification, (v) => v.length >= 3) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.classification, (v) => v.length >= 3),
    series:
      extractAroundLabel(lines, FIELD_ALIASES.series, (v) => v.length >= 2) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.series, (v) => v.length >= 2),
    remarks: extractAroundLabel(lines, FIELD_ALIASES.remarks, (v) => v.length >= 3),
    orNumber:
      extractAroundLabel(lines, FIELD_ALIASES.orNumber, isLikelyReceiptNo) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.orNumber, isLikelyReceiptNo),
    orDate:
      extractAfterTINDate(lines) ||
      extractMmDdYyyyDate(lines) ||
      extractAroundLabel(lines, FIELD_ALIASES.orDate, isLikelyDate) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.orDate, isLikelyDate),
    amountPaid:
      extractAroundLabel(lines, FIELD_ALIASES.amountPaid, isLikelyAmount) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.amountPaid, isLikelyAmount),
    ltoBranch:
      extractAroundLabel(
        lines,
        FIELD_ALIASES.ltoBranch,
        (v) => v.length >= 3,
      ) ||
      extractInlineAfterLabel(
        lines,
        FIELD_ALIASES.ltoBranch,
        (v) => v.length >= 3,
      ),
    fuelType:
      extractAroundLabel(lines, FIELD_ALIASES.fuelType, isLikelyFuelType) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.fuelType, isLikelyFuelType),
    grossWeight:
      extractAroundLabel(lines, FIELD_ALIASES.grossWeight, isLikelyWeight) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.grossWeight, isLikelyWeight),
    netWeight:
      extractNextToGrossWeightLine(lines, isLikelyWeight) ||
      extractAroundLabel(lines, FIELD_ALIASES.netWeight, isLikelyWeight) ||
      extractInlineAfterLabel(lines, FIELD_ALIASES.netWeight, isLikelyWeight),
  };

  const coord = {
    mvccControlNo:
      findRightText(FIELD_ALIASES.mvccControlNo, words, isLikelyControlNo) ||
      findBelowText(FIELD_ALIASES.mvccControlNo, words, isLikelyControlNo) ||
      findAboveText(FIELD_ALIASES.mvccControlNo, words, isLikelyControlNo),
    ownerName:
      findRightText(FIELD_ALIASES.ownerName, words, isLikelyOwnerName) ||
      findBelowText(FIELD_ALIASES.ownerName, words, isLikelyOwnerName) ||
      findAboveText(FIELD_ALIASES.ownerName, words, isLikelyOwnerName),
    address:
      findBelowText(FIELD_ALIASES.ownerName, words) ||
      findRightText(FIELD_ALIASES.ownerName, words) ||
      findAboveText(FIELD_ALIASES.ownerName, words),
    makeBrand:
      findRightText(FIELD_ALIASES.makeBrand, words, isLikelyMakeBrand) ||
      findBelowText(FIELD_ALIASES.makeBrand, words, isLikelyMakeBrand) ||
      findAboveText(FIELD_ALIASES.makeBrand, words, isLikelyMakeBrand),
    color:
      findTextNearAnchorWithConstraint(
        FIELD_ALIASES.color,
        FIELD_ALIASES.vehicleType,
        "below",
        words,
        isLikelyColor,
      ) || findColorByLayout(words),
    plate:
      findRightText(FIELD_ALIASES.plateNo, words, isLikelyPlate) ||
      findBelowText(FIELD_ALIASES.plateNo, words, isLikelyPlate) ||
      findAboveText(FIELD_ALIASES.plateNo, words, isLikelyPlate),
    engine:
      extractEngineNearPlate(words, pageWidth) ||
      findTextNearAnchorWithConstraint(
        FIELD_ALIASES.engineNo,
        FIELD_ALIASES.vehicleType,
        "above",
        words,
        isLikelyEngine,
      ) ||
      findRightText(FIELD_ALIASES.engineNo, words, isLikelyEngine) ||
      findBelowText(FIELD_ALIASES.engineNo, words, isLikelyEngine) ||
      findAboveText(FIELD_ALIASES.engineNo, words, isLikelyEngine),
    chassis:
      findRightText(FIELD_ALIASES.chassisNo, words, isLikelyChassis) ||
      findBelowText(FIELD_ALIASES.chassisNo, words, isLikelyChassis) ||
      findAboveText(FIELD_ALIASES.chassisNo, words, isLikelyChassis),
    date: findDateByLayout(words),
    yearModel: findYearModelByLayout(words, normalizedText),
    mvFileNo:
      findRightText(FIELD_ALIASES.mvFileNo, words) ||
      findBelowText(FIELD_ALIASES.mvFileNo, words) ||
      findAboveText(FIELD_ALIASES.mvFileNo, words),
    tin:
      findRightText(FIELD_ALIASES.tin, words, isLikelyTin) ||
      findBelowText(FIELD_ALIASES.tin, words, isLikelyTin) ||
      findAboveText(FIELD_ALIASES.tin, words, isLikelyTin),
    classification:
      findRightText(FIELD_ALIASES.classification, words) ||
      findBelowText(FIELD_ALIASES.classification, words),
    series:
      findRightText(FIELD_ALIASES.series, words) ||
      findBelowText(FIELD_ALIASES.series, words),
    remarks:
      findRightText(FIELD_ALIASES.remarks, words) ||
      findBelowText(FIELD_ALIASES.remarks, words),
  };

  const regex = {
    mvccControlNo: extractByPatterns(flat, [
      /(?:HPG\s*CONTROL\s*NO\.?)\s*[\r\n]+\s*(?:PNP\s*MOTOR\s*VEHICLE\s*CLEARANCE\s*CERTIFICATE\s*[\r\n]+)?([0-9A-Z]{6,}(?:\s+[A-Z]+)?)/m,
      /(?:MVCC\s*CONTROL\s*NO\.?|HPG\s*CONTROL\s*NO\.?|CONTROL\s*NO\.?|CONTROL\s*NUMBER)\s*[:\-]?\s*([A-Z0-9\s\-]{6,30})/m,
    ]),
    ownerName: extractByPatterns(flat, [
      /RECEIVED\s*FROM(?:\s*\([^)]*\))?\s*[\r\n]+([A-Z0-9][A-Z0-9 .,'()\-]{3,100})/m,
      /RECEIVED\s*FROM(?:\s*\([^)]*\))?\s*[:\-]?\s*([A-Z0-9][A-Z0-9 .,'()\-]{3,100})/m,
      /(?:NEW\s*\/\s*REGISTERED\s*OWNER\s*\/\s*ADDRESS|OWNER'?S?\s*NAME|REGISTERED\s*OWNER)\s*[\r\n]+([A-Z0-9][A-Z0-9 .,'()\-]{3,80})/m,
      /(?:NEW\s*\/\s*REGISTERED\s*OWNER\s*\/\s*ADDRESS)\s*[:\-]?\s*([A-Z0-9][A-Z0-9 .,'()\-]{3,80})/m,
    ]),
    address: extractByPatterns(flat, [
      /ADDRESS(?:\s*\([^)]*\))?\s*[:\-]?\s*([A-Z0-9][A-Z0-9 .,'#&\/\-]{8,140})/m,
      /(?:NEW\s*\/\s*REGISTERED\s*OWNER\s*\/\s*ADDRESS|REGISTERED\s*OWNER\s*\/\s*ADDRESS)\s*[\r\n]+[A-Z0-9 .,'()\-]{3,80}\s*[\r\n]+([A-Z0-9][A-Z0-9 .,'#&/\-]{5,120})/m,
    ]),
    makeBrand: extractByPatterns(flat, [
      /(?:MAKE\/TYPE\/SERIES\/YEAR|MAKE\/TYPE|MAKE TYPE|MAKE\/BRAND|MAKE BRAND|MAKE|BRAND)\s*[\r\n]+([A-Z0-9\s.\-\/()]{5,40})/m,
      /(?:MAKE\/TYPE|MAKE BRAND|MAKE|BRAND)\s*[:\-]\s*([A-Z0-9 .\-\/()]{2,40})/m,
    ]),
    color: extractByPatterns(flat, [
      /(?:COLOR|COLOUR|VEHICLE COLOR)\s*[\r\n]+([A-Z\/]{3,20})/m,
      /(?:COLOR|COLOUR)\s*[:\-]\s*([A-Z0-9]{3,20})/m,
    ]),
    plate: extractByPatterns(flat, [
      /(?:C\.?\s*S\.?\s*NO\.?\s*\/\s*PLATE\s*NO\.?|CS\s*NO\.?\s*\/\s*PLATE\s*NO\.?)\s*[\r\n]+([A-Z0-9\- ]{4,12})/m,
      /(?:PLATE\s*NO\.?|PLATE\s*NUMBER|PLATE#|PLATE)\s*[:\-]?\s*([A-Z0-9\- ]{4,12})/m,
    ]),
    engine: extractByPatterns(flat, [
      /(?:ENGINE\s*NUMBER|ENGINE\s*NO\.?|MOTOR\s*NO\.?)\s*[\r\n]+([A-Z0-9\-]{8,25})/m,
      /(?:ENGINE\s*NO\.?|ENGINE\s*NUMBER|MOTOR\s*NO\.?)\s*[:\-]\s*([A-Z0-9\-]{8,25})/m,
    ]),
    chassis: extractByPatterns(flat, [
      /(?:CHASSIS\s*NUMBER|CHASSIS\s*NO\.?|VIN)\s*[\r\n]+([A-Z0-9\-]{8,25})/m,
      /(?:CHASSIS\s*NO\.?|CHASSIS\s*NUMBER|CHASSISNUMBER|FRAME\s*NO\.?|VIN)\s*[:\-]\s*([A-Z0-9\-]{8,25})/m,
    ]),
    date: extractByPatterns(flat, [
      /(?:DATE|DATE ISSUED)\s*[\r\n]+(\d{1,2}[\/\-\s][A-Za-z]{3,}[\/\-\s]\d{2,4}(?:\s+\d{2}:\d{2}\s+[AP]M)?)/m,
      /(?:DATE|DATE ISSUED)\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/m,
    ]),
    yearModel: extractByPatterns(flat, [
      /(?:YEAR\s*MODEL|MODEL\s*YEAR|YR\s*MODEL)\s*[:\-]?\s*[\r\n]*\s*(\d{4})/m,
    ]),
    mvFileNo: extractByPatterns(flat, [
      /(?:MV\s*FILE\s*NUMBER|MV\s*FILE\s*NO\.?|FILE\s*NO\.?|FILE\s*NUMBER|FILE\s*NO\b)\s*[\r\n]+([A-Z0-9\-]{4,20})/m,
      /(?:MV\s*FILE\s*NO\.?|MV\s*FILE\s*NUMBER|FILE\s*NO\.?|FILE\s*NUMBER|FILE\s*NO\b)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/m,
    ]),
    hpgOffice: extractByPatterns(flat, [
      /(?:HPG\s*OFFICE|OFFICE)\s*[:\-]?\s*[\r\n]*\s*([A-Z0-9 .,'-]{3,40})/m,
    ]),
    purpose: extractByPatterns(flat, [
      /(?:PURPOSE)\s*[:\-]?\s*[\r\n]*\s*([A-Z0-9 .,'-]{3,40})/m,
    ]),
    hpgTechnician: extractByPatterns(flat, [
      /(?:HPG\s*TECHNICIAN|TECHNICIAN|EXAMINED\s*BY)\s*[:\-]?\s*[\r\n]*\s*([A-Z][A-Z .,'-]{3,80})/m,
    ]),
    mvrrNumber: extractByPatterns(flat, [
      /(?:M\.??V\.??R\.??R\.??\s*NUMBER|MVRR\s*NO\.?)\s*[\r\n]+([A-Z0-9\-]{4,20})/m,
    ]),
    crNumber: extractByPatterns(flat, [
      /(?:C\.?\s*R\.?\s*NO\.?|CR\s*NO\.?)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/m,
      /(?:C\.??R\.??\s*NUMBER|CR\s*NUMBER|CERTIFICATE\s+OF\s+REGISTRATION\s*NO\.?)\s*[\r\n]+([A-Z0-9\-]{4,20})/m,
    ]),
    sbrNo: extractByPatterns(flat, [
      /(?:SBR\s*NO\.?|SBR\s*NUMBER|SERIAL\s*BOND\s*REGISTER\s*NO\.?)\s*[\r\n]+([A-Z0-9\-]{3,20})/m,
    ]),
    acquiredFrom: extractByPatterns(flat, [
      /(?:ACQUIRED\s*FROM(?:\s*\/\s*ADDRESS)?|SOURCE)\s*[\r\n]+([A-Z0-9][A-Z0-9 .,'()#&\/\-]{5,140})/m,
    ]),
    tin: extractByPatterns(flat, [
      /(?:TIN|TAX\s*IDENTIFICATION\s*NUMBER)\s*[\r\n]+(\d{3}-\d{3}-\d{3}(?:-\d{1,3})?|\d{9,12})/m,
      /(?:TIN|TAX\s*IDENTIFICATION\s*NUMBER)\s*[:\-]?\s*(\d{3}-\d{3}-\d{3}(?:-\d{1,3})?|\d{9,12})/m,
    ]),
    processingOfficer: extractByPatterns(flat, [
      /(?:PROCESSING\s*OFFICER|PROCESSED\s*BY)\s*[\r\n]+([A-Z][A-Z .,'\-IVX]{3,80})/m,
    ]),
    clearanceOfficer: extractByPatterns(flat, [
      /(?:CLEARANCE\s*OFFICER|APPROVED\s*BY)\s*[\r\n]+([A-Z][A-Z .,'\-IVX]{3,80})/m,
    ]),
    meNumber: extractByPatterns(flat, [
      /(?:ME\s*#\/DATE\/or\s*LTOCC\s*\(NEW\s*MV\)|ME\s*#\/DATE\/or\s*LTOCC\s*\(NEW\s*MV\)|ME#|ME\s*NO\.?|LTOCC|LTO\s*CC)\s*[\r\n]+([A-Z0-9\s.\-\/#]+)/m,
      /(?:ME#|ME\s*NO\.?|LTOCC|LTO\s*CC)\s*[:\-]?\s*([A-Z0-9\-]{3,30})/m,
    ]),
    nhqPid: extractByPatterns(flat, [
      /(?:NHQ\s*\-?\s*PID\s*\/\s*RFU\s*\/\s*PFU\s*\/\s*CFU|NHQ\s*PID|PID\s*NO\.?)\s*[\r\n]+([A-Z0-9\-]{3,30})/m,
    ]),
    examinedBy: extractByPatterns(flat, [
      /(?:EXAMINED\s*BY|INSPECTED\s*BY)\s*[\r\n]+([A-Z][A-Z .,'\-IVX]{3,80})/m,
    ]),
    notedBy: extractByPatterns(flat, [
      /(?:NOTED\s*BY|NOTED)\s*[\r\n]+([A-Z][A-Z .,'\-IVX]{3,80})/m,
    ]),
    orNumber: extractByPatterns(flat, [
      /OFFICIAL\s+RECEIPT\s*(?:NO\.?|NUMBER|#)?\s*[:\-]?\s*([A-Z0-9\-./]{6,30})/m,
      /(?:RECEIPT\s*NO\.?\s*|OR\s*NO\.?\s*|O\.R\.\s*NO\.?)\s*[:\-]?\s*([A-Z0-9\-./]{4,25})/m,
      /OFFICIAL\s+RECEIPT[\s\S]*?([A-Z0-9][A-Z0-9\-/]{3,24})\s*$/m,
    ]),
    orDate: extractByPatterns(flat, [
      /(?:Date\s*[:\-]\s*)(\d{1,2}\/\d{1,2}\/\d{4})/im,
      /(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE)\s*[:\-]\s*(\d{1,2}\/\d{1,2}\/\d{4})/m,
      /(?:Date\s*[:\-]\s*)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/im,
      /(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE)\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/m,
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    ]),
    amountPaid: extractByPatterns(flat, [
      /TOTAL\s+AMOUNT\s+PAID\s*:?\s*PHP\s*([\d,]+(?:\.\d{2})?)/im,
      /TOTAL\s+AMOUNT\s+PAID\s*:?\s*([\d,]+(?:\.\d{2})?)/im,
      /AMOUNT\s+PAID\s*:?\s*PHP\s*([\d,]+(?:\.\d{2})?)/im,
    ]),
    ltoBranch: extractByPatterns(flat, [
      /(?:FIELD\s+OFFICE|LTO\s+BRANCH|LAND\s+TRANSPORTATION\s+OFFICE|TRANSACTING\s+OFFICE)\s*[:\-]\s*([A-Z][A-Z0-9\s.,'-]{2,40})/im,
    ]),
    classification: extractByPatterns(flat, [
      /(?:CLASSIFICATION|CLASSIFCATION|CLASSFICATION)\s*[:\-]?\s*([A-Z0-9\s.,'-]+)/im,
      /(?:CLASS)\s*[:\-]\s*([A-Z0-9\s.,'-]+)/im,
    ]),
    series: extractByPatterns(flat, [
      /(?:SERIES)\s*[:\-]?\s*([A-Z0-9\s.,'-]+)/im,
    ]),
    fuelType: extractByPatterns(flat, [
      /(?:TYPE\s*OF\s*FUEL|FUEL\s*TYPE)\s*[:\-]?\s*([A-Z]{3,15})/im,
    ]),
    grossWeight: extractByPatterns(flat, [
      /(?:GROSS\s*(?:WT\.?|WEIGHT|VEHICLE\s*WEIGHT)|GVW)\s*[:\-]?\s*([\d,]+(?:\s*KG)?)/im,
    ]),
    netWeight: extractByPatterns(flat, [
      /(?:NET\s*(?:WT\.?|WEIGHT|CAPACITY))\s*[:\-]?\s*([\d,]+(?:\s*KG)?)/im,
    ]),
  };

  const globalBrand = KNOWN_VEHICLE_BRANDS.find((b) => flat.includes(b)) ?? "";

  const isTable = docType === "MVCC" || docType === "CR";

  const extraction: FieldExtractionMap = {
    mvccControlNo: pickField("MVCC CONTROL NO.", isLikelyControlNo, {
      lineScan: lineScan.mvccControlNo,
      coord: coord.mvccControlNo,
      regex: regex.mvccControlNo,
      specific: (mvccSpecific?.mvccControlNo || mecSpecific?.mvccControlNo) ?? "",
    }),
    ownerName: pickField("OWNER NAME", isLikelyOwnerName, {
      lineScan: lineScan.ownerName,
      coord: coord.ownerName,
      regex: regex.ownerName,
      specific: (mvccSpecific?.ownerName || mecSpecific?.ownerName) ?? "",
    }),
    address: pickField("ADDRESS", (v) => v.length >= 5, {
      lineScan: lineScan.address,
      coord: coord.address,
      regex: regex.address,
      specific: mecSpecific?.address ?? "",
    }),
    makeBrand: pickField("MAKE / BRAND", isLikelyMakeBrand, {
      global: globalBrand,
      coord: coord.makeBrand,
      regex: regex.makeBrand,
      lineScan: lineScan.makeBrand,
      specific: (mvccSpecific?.makeBrand || mecSpecific?.makeBrand) ?? "",
    }, false, isTable),
    color: pickField("COLOR", isLikelyColor, {
      lineScan: lineScan.color,
      coord: coord.color,
      regex: regex.color,
      specific: (mvccSpecific?.color || mecSpecific?.color) ?? "",
    }, false, isTable),
    plateNo: pickField("PLATE NO.", isLikelyPlate, {
      lineScan: lineScan.plate,
      stacked: stacked.plate,
      coord: coord.plate,
      regex: regex.plate,
      specific: (mvccSpecific?.plateNo || mecSpecific?.plateNo) ?? "",
    }, false, isTable),
    engineNo: pickField("ENGINE NO.", isLikelyEngine, {
      findings: findings.engine,
      coord: coord.engine,
      lineScan: lineScan.engine,
      stacked: stacked.engine,
      regex: regex.engine,
      specific: (mvccSpecific?.engineNo || mecSpecific?.engineNo) ?? "",
    }, false, isTable),
    chassisNo: pickField("CHASSIS NO.", isLikelyChassis, {
      findings: findings.chassis,
      coord: coord.chassis,
      lineScan: lineScan.chassis,
      stacked: stacked.chassis,
      regex: regex.chassis,
      specific: (mvccSpecific?.chassisNo || mecSpecific?.chassisNo) ?? "",
    }, false, isTable),
    date: pickField(
      "DATE",
      isLikelyDate,
      { lineScan: lineScan.date, coord: coord.date, regex: regex.date, specific: mvccSpecific?.date ?? "" },
      true,
    ),
    yearModel: pickField("YEAR MODEL", isLikelyYearModel, {
      lineScan: lineScan.yearModel,
      coord: coord.yearModel,
      regex: regex.yearModel,
    }, false, isTable),
    mvFileNo: pickField("MV FILE NO.", isLikelyMvFileNo, {
      lineScan: lineScan.mvFileNo,
      coord: coord.mvFileNo,
      regex: regex.mvFileNo,
      specific: mvccSpecific?.mvFileNo ?? "",
    }, false, isTable),
    hpgOffice: pickField("HPG OFFICE", (v) => v.length >= 3, {
      regex: regex.hpgOffice,
    }),
    purpose: pickField("PURPOSE", (v) => v.length >= 3, {
      regex: regex.purpose,
    }),
    hpgTechnician: pickField("HPG TECHNICIAN", (v) => v.length >= 3, {
      specific: mecSpecific?.examinedBy ?? "",
      regex: regex.hpgTechnician,
    }),
    mvrrNumber: pickField("MVRR NUMBER", isLikelyMvrrNumber, {
      specific: mvccSpecific?.mvrrNumber ?? "",
      regex: regex.mvrrNumber,
    }),
    crNumber: pickField("C.R. NUMBER", isLikelyCrNumber, {
      specific: mvccSpecific?.crNumber ?? "",
      regex: regex.crNumber,
    }),
    sbrNo: pickField("SBR NO.", isLikelySbrNo, {
      specific: mvccSpecific?.sbrNo ?? "",
      regex: regex.sbrNo,
    }),
    acquiredFrom: pickField("ACQUIRED FROM / ADDRESS", (v) => v.length >= 5, {
      specific: mvccSpecific?.acquiredFrom ?? "",
      regex: regex.acquiredFrom,
    }),
    tin: pickField("TIN", isLikelyTin, {
      lineScan: lineScan.tin,
      coord: coord.tin,
      specific: mvccSpecific?.tin ?? "",
      regex: regex.tin,
    }),
    processingOfficer: pickField("PROCESSING OFFICER", isLikelyOfficerName, {
      specific: mvccSpecific?.processingOfficer ?? "",
      regex: regex.processingOfficer,
    }),
    clearanceOfficer: pickField("CLEARANCE OFFICER", isLikelyOfficerName, {
      specific: mvccSpecific?.clearanceOfficer ?? "",
      regex: regex.clearanceOfficer,
    }),
    meNumber: pickField("ME# / LTOCC", isLikelyMeNumber, {
      specific: mvccSpecific?.meNumber ?? "",
      regex: regex.meNumber,
    }),
    nhqPid: pickField("NHQ-PID/RFU/PFU/CFU", isLikelyNhqPid, {
      specific: mecSpecific?.nhqPid ?? "",
      regex: regex.nhqPid,
    }),
    examinedBy: pickField("EXAMINED BY", isLikelyOfficerName, {
      specific: mecSpecific?.examinedBy ?? "",
      regex: regex.examinedBy,
    }),
    notedBy: pickField("NOTED BY", isLikelyOfficerName, {
      specific: mecSpecific?.notedBy ?? "",
      regex: regex.notedBy,
    }),
    classification: pickField("CLASSIFICATION", (v) => v.length >= 3, {
      lineScan: stripPaymentBreakdown(lineScan.classification),
      coord: stripPaymentBreakdown(coord.classification),
      regex: stripPaymentBreakdown(regex.classification),
    }, false, isTable),
    series: pickField("SERIES", (v) => v.length >= 2, {
      lineScan: stripPaymentBreakdown(lineScan.series),
      coord: stripPaymentBreakdown(coord.series),
      regex: stripPaymentBreakdown(regex.series),
    }, false, isTable),
    remarks: pickField("REMARKS", (v) => v.length >= 3, {
      lineScan: lineScan.remarks,
      coord: coord.remarks,
    }),
    engineNoStencilled: pickField("ENGINE NO. (STENCILLED)", isLikelyEngine, {
      specific: mecSpecific?.engineNo ?? "",
    }),
    chassisNoStencilled: pickField("CHASSIS / FRAME NO. (STENCILLED)", isLikelyChassis, {
      specific: mecSpecific?.chassisNo ?? "",
    }),
  };

  extraction.engineNo = applyConsistencyAdjustment(
    extraction.engineNo,
    isLikelyEngine,
  );
  extraction.chassisNo = applyConsistencyAdjustment(
    extraction.chassisNo,
    isLikelyChassis,
  );

  // Log confidence rates for all extractions
  console.log("=== OCR EXTRACTION CONFIDENCE RATES ===");
  console.log("docType:", docType);
  console.log(
    "mvccControlNo:",
    extraction.mvccControlNo.confidence,
    "| selected:",
    extraction.mvccControlNo.selected,
    "| source:",
    extraction.mvccControlNo.source,
  );
  console.log(
    "ownerName:",
    extraction.ownerName.confidence,
    "| selected:",
    extraction.ownerName.selected,
    "| source:",
    extraction.ownerName.source,
  );
  console.log(
    "address:",
    extraction.address.confidence,
    "| selected:",
    extraction.address.selected,
    "| source:",
    extraction.address.source,
  );
  console.log(
    "mvFileNo:",
    extraction.mvFileNo.confidence,
    "| selected:",
    extraction.mvFileNo.selected,
    "| source:",
    extraction.mvFileNo.source,
  );
  console.log(
    "plateNo:",
    extraction.plateNo.confidence,
    "| selected:",
    extraction.plateNo.selected,
    "| source:",
    extraction.plateNo.source,
  );
  console.log(
    "engineNo:",
    extraction.engineNo.confidence,
    "| selected:",
    extraction.engineNo.selected,
    "| source:",
    extraction.engineNo.source,
  );
  console.log(
    "chassisNo:",
    extraction.chassisNo.confidence,
    "| selected:",
    extraction.chassisNo.selected,
    "| source:",
    extraction.chassisNo.source,
  );
  console.log(
    "makeBrand:",
    extraction.makeBrand.confidence,
    "| selected:",
    extraction.makeBrand.selected,
    "| source:",
    extraction.makeBrand.source,
  );
  console.log(
    "color:",
    extraction.color.confidence,
    "| selected:",
    extraction.color.selected,
    "| source:",
    extraction.color.source,
  );
  console.log(
    "date:",
    extraction.date.confidence,
    "| selected:",
    extraction.date.selected,
    "| source:",
    extraction.date.source,
  );
  console.log(
    "classification:",
    extraction.classification.confidence,
    "| selected:",
    extraction.classification.selected,
    "| source:",
    extraction.classification.source,
  );
  console.log(
    "series:",
    extraction.series.confidence,
    "| selected:",
    extraction.series.selected,
    "| source:",
    extraction.series.source,
  );
  console.log(
    "yearModel:",
    extraction.yearModel.confidence,
    "| selected:",
    extraction.yearModel.selected,
    "| source:",
    extraction.yearModel.source,
  );
  console.log(
    "hpgOffice:",
    extraction.hpgOffice.confidence,
    "| selected:",
    extraction.hpgOffice.selected,
    "| source:",
    extraction.hpgOffice.source,
  );
  console.log(
    "purpose:",
    extraction.purpose.confidence,
    "| selected:",
    extraction.purpose.selected,
    "| source:",
    extraction.purpose.source,
  );
  console.log(
    "hpgTechnician:",
    extraction.hpgTechnician.confidence,
    "| selected:",
    extraction.hpgTechnician.selected,
    "| source:",
    extraction.hpgTechnician.source,
  );
  console.log(
    "mvrrNumber:",
    extraction.mvrrNumber.confidence,
    "| selected:",
    extraction.mvrrNumber.selected,
    "| source:",
    extraction.mvrrNumber.source,
  );
  console.log(
    "crNumber:",
    extraction.crNumber.confidence,
    "| selected:",
    extraction.crNumber.selected,
    "| source:",
    extraction.crNumber.source,
  );
  console.log(
    "sbrNo:",
    extraction.sbrNo.confidence,
    "| selected:",
    extraction.sbrNo.selected,
    "| source:",
    extraction.sbrNo.source,
  );
  console.log(
    "acquiredFrom:",
    extraction.acquiredFrom.confidence,
    "| selected:",
    extraction.acquiredFrom.selected,
    "| source:",
    extraction.acquiredFrom.source,
  );
  console.log(
    "tin:",
    extraction.tin.confidence,
    "| selected:",
    extraction.tin.selected,
    "| source:",
    extraction.tin.source,
  );
  console.log(
    "processingOfficer:",
    extraction.processingOfficer.confidence,
    "| selected:",
    extraction.processingOfficer.selected,
    "| source:",
    extraction.processingOfficer.source,
  );
  console.log(
    "clearanceOfficer:",
    extraction.clearanceOfficer.confidence,
    "| selected:",
    extraction.clearanceOfficer.selected,
    "| source:",
    extraction.clearanceOfficer.source,
  );
  console.log(
    "meNumber:",
    extraction.meNumber.confidence,
    "| selected:",
    extraction.meNumber.selected,
    "| source:",
    extraction.meNumber.source,
  );
  console.log(
    "nhqPid:",
    extraction.nhqPid.confidence,
    "| selected:",
    extraction.nhqPid.selected,
    "| source:",
    extraction.nhqPid.source,
  );
  console.log(
    "examinedBy:",
    extraction.examinedBy.confidence,
    "| selected:",
    extraction.examinedBy.selected,
    "| source:",
    extraction.examinedBy.source,
  );
  console.log(
    "notedBy:",
    extraction.notedBy.confidence,
    "| selected:",
    extraction.notedBy.selected,
    "| source:",
    extraction.notedBy.source,
  );
  console.log("=====================================");

  // ==========================================
  // CROSS-FIELD DEDUPLICATION & CLEANUP
  // ==========================================

  const fields: FormFields = {
    mvccControlNo: cleanFieldValue(
      "mvccControlNo",
      extraction.mvccControlNo.selected,
    ),
    ownerName: cleanFieldValue("ownerName", extraction.ownerName.selected),
    address: cleanFieldValue("address", extraction.address.selected),
    makeBrand: cleanFieldValue("makeBrand", extraction.makeBrand.selected),
    color: cleanFieldValue("color", extraction.color.selected),
    plateNo: cleanFieldValue("plateNo", extraction.plateNo.selected),
    engineNo: cleanFieldValue("engineNo", extraction.engineNo.selected),
    chassisNo: cleanFieldValue("chassisNo", extraction.chassisNo.selected),
    date: cleanFieldValue("date", extraction.date.selected),
    yearModel: cleanFieldValue("yearModel", extraction.yearModel.selected),
    mvFileNo: cleanFieldValue("mvFileNo", extraction.mvFileNo.selected),
    classification: cleanFieldValue("classification", extraction.classification.selected),
    series: cleanFieldValue("series", extraction.series.selected),
    hpgOffice: cleanFieldValue("hpgOffice", extraction.hpgOffice.selected),
    purpose: cleanFieldValue("purpose", extraction.purpose.selected),
    hpgTechnician: cleanFieldValue(
      "hpgTechnician",
      extraction.hpgTechnician.selected,
    ),
    mvrrNumber: cleanFieldValue("mvrrNumber", extraction.mvrrNumber.selected),
    crNumber: cleanFieldValue("crNumber", extraction.crNumber.selected),
    sbrNo: cleanFieldValue("sbrNo", extraction.sbrNo.selected),
    acquiredFrom: cleanFieldValue(
      "acquiredFrom",
      extraction.acquiredFrom.selected,
    ),
    tin: cleanFieldValue("tin", extraction.tin.selected),
    processingOfficer: cleanFieldValue(
      "processingOfficer",
      extraction.processingOfficer.selected,
    ),
    clearanceOfficer: cleanFieldValue(
      "clearanceOfficer",
      extraction.clearanceOfficer.selected,
    ),
    meNumber: cleanFieldValue("meNumber", extraction.meNumber.selected),
    nhqPid: cleanFieldValue("nhqPid", extraction.nhqPid.selected),
    examinedBy: cleanFieldValue("examinedBy", extraction.examinedBy.selected),
    notedBy: cleanFieldValue("notedBy", extraction.notedBy.selected),
    remarks: cleanFieldValue("remarks", extraction.remarks.selected),
    engineNoStencilled: cleanFieldValue("engineNoStencilled", extraction.engineNoStencilled.selected),
    chassisNoStencilled: cleanFieldValue("chassisNoStencilled", extraction.chassisNoStencilled.selected),
  };

  // 1. Explicitly Scrub Boilerplate Paragraphs
  const boilerplateEradicator =
    /(REPUBLIC OF THE PHILIPPINES|DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT|NATIONAL POLICE COMMISSION|PHILIPPINE NATIONAL POLICE|HEADQUARTERS HIGHWAY PATROL GROUP|IN VIEW OF THE ABOVE FINDINGS|PNP MOTOR VEHICLE CLEARANCE IS HEREBY ISSUED|EFFECTIVE UNTIL|DETERMINING THAT ABOVE STATED MV\/MC IS NOT INCLUDED IN THE HPG LIST OF WANTED\/STOLEN VEHICLES|NOTE: VALID WITH ERASURES AND WITHOUT OFFICIAL RECEIPT|NOTE: NOT VALID WITH ERASURES|THIS FORM HAS BLEED THROUGH NUMBERING, OBSERVE REVERSE SIDE OF NUMBER TO VERIFY|MICROPRINT ON SIGNATURE LINE, MAGNIFY TO VERIFY|SECURITY BARCODED|TO SERVE AND PROTECT)/gi;

  const scrub = (val: string) =>
    val
      .replace(boilerplateEradicator, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  fields.ownerName = scrub(fields.ownerName);
  fields.address = scrub(fields.address);
  fields.acquiredFrom = scrub(fields.acquiredFrom);
  fields.purpose = scrub(fields.purpose);
  fields.hpgOffice = scrub(fields.hpgOffice);

  // 2. Fix Horizontal Bleeding: Strip TINs off the end of text fields
  const tinRegex = /\s*\d{3}-\d{3}-\d{3}(?:-\d{1,3})?$/;
  if (tinRegex.test(fields.address))
    fields.address = fields.address.replace(tinRegex, "").trim();
  if (tinRegex.test(fields.ownerName))
    fields.ownerName = fields.ownerName.replace(tinRegex, "").trim();
  if (tinRegex.test(fields.acquiredFrom))
    fields.acquiredFrom = fields.acquiredFrom.replace(tinRegex, "").trim();

  // 3. Fix Number Bleeding: Deduplicate SBR, CR, and MVRR
  // When a field is blank, the OCR line scanner keeps moving right and grabs the next field's number.
  const sbr = fields.sbrNo;
  const cr = fields.crNumber;
  const mvrr = fields.mvrrNumber;

  if (sbr && cr === sbr) fields.crNumber = "";
  if (cr && mvrr === cr) fields.mvrrNumber = "";
  if (sbr && mvrr === sbr) fields.mvrrNumber = "";
  if (fields.mvFileNo && (fields.mvFileNo === cr || fields.mvFileNo === sbr))
    fields.mvFileNo = "";

  // 4. Swap Color and Plate if they grabbed each other
  if (isLikelyPlate(fields.color) && isLikelyColor(fields.plateNo)) {
    const temp = fields.plateNo;
    fields.plateNo = fields.color;
    fields.color = temp;
  } else {
    if (isLikelyPlate(fields.color)) fields.color = "";
    if (isLikelyColor(fields.plateNo)) fields.plateNo = "";
  }

  // 5. Fix Owner Name / TIN overlap
  if (isLikelyTin(fields.ownerName)) {
    if (!fields.tin) fields.tin = fields.ownerName;
    fields.ownerName = "";
  }

  // 6. Fix Owner Name / Address overlap
  if (fields.address === fields.ownerName && fields.ownerName) {
    const altAddress = Object.values(extraction.address.candidates).find(
      (c) => c && c !== fields.ownerName,
    );
    fields.address = altAddress ? cleanFieldValue("address", altAddress) : "";
  }

  // 7. Recover Full Make/Brand if Regex truncated it
  if (
    extraction.makeBrand.candidates.lineScan &&
    extraction.makeBrand.candidates.lineScan.length > fields.makeBrand.length
  ) {
    if (extraction.makeBrand.candidates.lineScan.includes(fields.makeBrand)) {
      fields.makeBrand = cleanFieldValue(
        "makeBrand",
        extraction.makeBrand.candidates.lineScan,
      );
    }
  }

  // 8. Extract Year from Make/Brand if missing
  if (!fields.yearModel && fields.makeBrand) {
    const match = fields.makeBrand.match(/\b(19[8-9]\d|20[0-2]\d|203[0-5])\b/);
    if (match) fields.yearModel = match[1];
  }

  // 9. Fix ME# and Date overlapping
  if (fields.date && /^\d{5,8}\s*\//.test(fields.date)) {
    fields.date = ""; // Date accidentally grabbed the ME number layout, reset it.
  } else if (fields.meNumber.includes("/")) {
    const parts = fields.meNumber.split(/\s*\/\s*/);
    const possibleDate = parts[parts.length - 1];
    if (isLikelyDate(possibleDate) && !fields.date) {
      fields.date = cleanFieldValue("date", possibleDate);
    }
    fields.meNumber = cleanFieldValue(
      "meNumber",
      parts.filter((p) => p !== possibleDate).join(" / "),
    );
  }

  const layoutText = buildLayoutText(words, pageWidth);

  return { fields, extraction, layoutText };
}
