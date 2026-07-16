import type { OcrWord } from "./types";
import { FIELD_ALIASES } from "./constants";
import { extractAroundLabel, findRightText, findBelowText } from "./extractors";
import { isLabelLine, toCanonical } from "./normalize";
import {
  isLikelyMvrrNumber,
  isLikelyCrNumber,
  isLikelySbrNo,
  isLikelyTin,
  isLikelyMeNumber,
  isLikelyOfficerName,
  isLikelyControlNo,
  isLikelyOwnerName,
  isLikelyMakeBrand,
  isLikelyColor,
  isLikelyPlate,
  isLikelyEngine,
  isLikelyChassis,
  isLikelyDate,
  isLikelyMvFileNo,
} from "./validators";

function extractMultiLineAddress(lines: string[], aliases: readonly string[]): string {
  const aliasCanonicals = aliases.map((alias) => toCanonical(alias));
  const idx = lines.findIndex((line) => aliasCanonicals.some((canon) => toCanonical(line).includes(canon)));
  if (idx === -1) return "";

  const addressLines: string[] = [];
  for (let i = idx + 1; i < Math.min(lines.length, idx + 6); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isLabelLine(line)) break;
    addressLines.push(line);
  }

  return addressLines.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Find a color value below a label, handling multi-word colors like "NOT AVAILABLE".
 * Standard findBelowText works word-by-word; this also tries joining adjacent words
 * within the same row range.
 */
function findColorBelowLabel(words: OcrWord[]): string {
  // Find the COLOR label word
  const sorted = [...FIELD_ALIASES.color].sort((a, b) => b.length - a.length);
  let labelWord: OcrWord | null = null;
  for (const alias of sorted) {
    const found = words.find((w) => w.text.toUpperCase().includes(alias));
    if (found) { labelWord = found; break; }
  }
  if (!labelWord) return "";

  const lw = labelWord;

  // Determine column bounds for this label (based on neighboring header words on same row)
  const headersOnSameLine = words
    .filter((w) => Math.abs(w.y - lw.y) < lw.height * 0.8 && (isLabelLine(w.text) || w === lw))
    .sort((a, b) => a.x - b.x);
  const myIdx = headersOnSameLine.findIndex((w) => w === lw);
  let minX = lw.x - lw.width;
  let maxX = lw.x + lw.width * 3;
  if (myIdx > 0) {
    const prev = headersOnSameLine[myIdx - 1];
    minX = (prev.x + prev.width + lw.x) / 2;
  }
  if (myIdx !== -1 && myIdx < headersOnSameLine.length - 1) {
    const next = headersOnSameLine[myIdx + 1];
    maxX = (lw.x + lw.width + next.x) / 2;
  }

  // Get all value words in this column below the label
  const valueWords = words
    .filter((w) => {
      if (w.y <= lw.y + lw.height * 0.3) return false;
      if (w.y - lw.y > 300) return false;
      const wCenter = w.x + w.width / 2;
      return wCenter > minX && wCenter < maxX;
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);

  if (!valueWords.length) return "";

  // Group words that are on the same row (within 1 font-height of each other)
  const firstY = valueWords[0].y;
  const rowWords = valueWords.filter((w) => Math.abs(w.y - firstY) < lw.height * 1.5);

  // Try joining the row words into a single value
  const joined = rowWords.map((w) => w.text).join(" ").trim();
  if (joined && isLikelyColor(joined)) return joined;

  // Try each word individually
  for (const w of rowWords) {
    if (!isLabelLine(w.text) && isLikelyColor(w.text)) return w.text;
  }

  return "";
}

/**
 * MVCC-specific extraction for MV FILE NUMBER from document grid layout.
 * The MV FILE NUMBER on MVCC is a long mostly-numeric code (e.g. 132425000000003A)
 * found in a grid cell labeled "MV FILE NUMBER".
 */
function extractMvFileNoFromMvccLayout(lines: string[], words: OcrWord[]): string {
  // First try: coordinate-based search (most reliable for grid layouts)
  const coordResult =
    findRightText(FIELD_ALIASES.mvFileNo, words, isLikelyMvFileNo) ||
    findBelowText(FIELD_ALIASES.mvFileNo, words, isLikelyMvFileNo);
  if (coordResult) return coordResult;

  // Fallback: line-based search
  const mvFileNoLabelIndex = lines.findIndex((line) =>
    FIELD_ALIASES.mvFileNo.some((alias) => toCanonical(line).includes(toCanonical(alias)))
  );

  if (mvFileNoLabelIndex === -1) return "";

  // Check the same line for value to the right of label
  const labelLine = lines[mvFileNoLabelIndex];
  for (const alias of FIELD_ALIASES.mvFileNo) {
    const idx = labelLine.toUpperCase().indexOf(alias.toUpperCase());
    if (idx !== -1) {
      const afterLabel = labelLine.substring(idx + alias.length).trim();
      // Extract the value (remove colons, dashes, etc.)
      const valueMatch = afterLabel.match(/^[\s:.\-]*([\w\-]+)/);
      if (valueMatch && isLikelyMvFileNo(valueMatch[1])) {
        return valueMatch[1].toUpperCase();
      }
    }
  }

  // Check lines below the label for the value
  for (let i = mvFileNoLabelIndex + 1; i < Math.min(lines.length, mvFileNoLabelIndex + 4); i++) {
    const candidate = lines[i].trim();
    if (!candidate) continue;
    if (isLabelLine(candidate)) break;
    if (isLikelyMvFileNo(candidate)) return candidate.toUpperCase();
  }

  return "";
}

/** Extract color from MVCC text lines — scans a window around the COLOR label,
 *  handles multi-word colors like "NOT AVAILABLE". */
function extractColorFromMvccLines(lines: string[]): string {
  const colorLabelIndex = lines.findIndex((line) =>
    FIELD_ALIASES.color.some((alias) => toCanonical(line).includes(toCanonical(alias)))
  );
  if (colorLabelIndex === -1) return "";

  const startIdx = Math.max(0, colorLabelIndex - 3);
  const endIdx = Math.min(lines.length, colorLabelIndex + 8);
  const searchWindow = lines.slice(startIdx, endIdx);

  // Prefer color combos like "RED/BLACK"
  for (const line of searchWindow) {
    const match = line.match(/(?:^|\s)([A-Z]+\/[A-Z]+)(?:\s|$)/);
    if (match && isLikelyColor(match[1])) return match[1];
  }

  // Check for multi-word colors (e.g. "NOT AVAILABLE", "DARK BLUE")
  for (const line of searchWindow) {
    // "NOT AVAILABLE" — 2-word known color
    const twoWordMatch = line.match(/\b([A-Z]+\s+[A-Z]+)\b/g);
    if (twoWordMatch) {
      for (const phrase of twoWordMatch) {
        if (isLikelyColor(phrase)) return phrase;
      }
    }
    // "DARK BLUE"-style prefix
    const prefixMatch = line.match(/(?:DARK|LIGHT|METALLIC|MATTE|GLOSS|BRIGHT|DEEP|PALE|SATIN)\s+[A-Z]{3,15}/i);
    if (prefixMatch && isLikelyColor(prefixMatch[0].toUpperCase())) return prefixMatch[0].toUpperCase();
  }

  // Single known color words
  const windowWords = searchWindow.flatMap((l) => l.split(/\s+/));
  for (const word of [...new Set(windowWords)]) {
    if (isLikelyColor(word.toUpperCase())) return word.toUpperCase();
  }

  return "";
}

export function extractMVCCFields(lines: string[], words: OcrWord[]) {
  const getField = (aliases: readonly string[], validator: (v: string) => boolean) => {
    return (
      extractAroundLabel(lines, aliases, validator) ||
      findBelowText(aliases, words, validator) ||
      findRightText(aliases, words, validator)
    );
  };

  const getGridField = (aliases: readonly string[], validator: (v: string) => boolean) => {
    return (
      findBelowText(aliases, words, validator) ||
      extractAroundLabel(lines, aliases, validator) ||
      findRightText(aliases, words, validator)
    );
  };

  return {
    mvccControlNo: getField(FIELD_ALIASES.mvccControlNo, isLikelyControlNo),
    ownerName: getField(FIELD_ALIASES.ownerName, isLikelyOwnerName),
    makeBrand: getGridField(FIELD_ALIASES.makeBrand, isLikelyMakeBrand),
    // Color: coordinate-aware multi-word extractor first, then line-scan fallback
    color:
      findColorBelowLabel(words) ||
      getGridField(FIELD_ALIASES.color, isLikelyColor) ||
      extractColorFromMvccLines(lines),
    plateNo: getGridField(FIELD_ALIASES.plateNo, isLikelyPlate),
    engineNo: getGridField(FIELD_ALIASES.engineNo, isLikelyEngine),
    chassisNo: getGridField(FIELD_ALIASES.chassisNo, isLikelyChassis),
    date: getField(FIELD_ALIASES.date, isLikelyDate),
    // MV File No: dedicated extractor that handles mostly-numeric long codes
    mvFileNo: extractMvFileNoFromMvccLayout(lines, words),
    mvrrNumber: getGridField(FIELD_ALIASES.mvrrNumber, isLikelyMvrrNumber),
    crNumber: getGridField(FIELD_ALIASES.crNumber, isLikelyCrNumber),
    sbrNo: getGridField(FIELD_ALIASES.sbrNo, isLikelySbrNo),
    acquiredFrom: extractMultiLineAddress(lines, FIELD_ALIASES.acquiredFrom),
    tin: getField(FIELD_ALIASES.tin, isLikelyTin),
    processingOfficer: getField(FIELD_ALIASES.processingOfficer, isLikelyOfficerName),
    clearanceOfficer: getField(FIELD_ALIASES.clearanceOfficer, isLikelyOfficerName),
    meNumber: getField(FIELD_ALIASES.meNumber, isLikelyMeNumber),
  };
}
