import type { OcrWord } from "./types";
import { FIELD_ALIASES } from "./constants";
import { extractAroundLabel, findRightText, findBelowText, extractExaminerBlock } from "./extractors";
import { isLabelLine, toCanonical } from "./normalize";
import {
  isLikelyNhqPid,
  isLikelyOwnerName,
  isLikelyMakeBrand,
  isLikelyColor,
  isLikelyPlate,
  isLikelyEngine,
  isLikelyChassis,
  isLikelyOfficerName,
  isLikelyDate,
  isLikelyMvFileNo,
} from "./validators";

function extractMultiLineAddress(lines: string[], aliases: readonly string[]): string {
  const aliasCanonicals = aliases.map((alias) => toCanonical(alias));
  const idx = lines.findIndex((line) => aliasCanonicals.some((canon) => toCanonical(line).includes(canon)));
  if (idx === -1) return "";

  const out: string[] = [];
  for (let i = idx + 1; i < Math.min(lines.length, idx + 6); i++) {
    const candidate = lines[i].trim();
    if (!candidate) continue;
    if (isLabelLine(candidate)) break;
    out.push(candidate);
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/** Scan lines in a window around the COLOR label for known color names.
 *  Handles multi-word colors like "NOT AVAILABLE" and "DARK BLUE". */
function extractColorFromMecLines(lines: string[]): string {
  const colorLabelIndex = lines.findIndex((line) =>
    FIELD_ALIASES.color.some((alias) => toCanonical(line).includes(toCanonical(alias)))
  );
  if (colorLabelIndex === -1) return "";

  const startIdx = Math.max(0, colorLabelIndex - 3);
  const endIdx = Math.min(lines.length, colorLabelIndex + 8);
  const searchWindow = lines.slice(startIdx, endIdx);

  // Prefer color combinations like "RED/BLACK"
  for (const line of searchWindow) {
    const match = line.match(/(?:^|\s)([A-Z]+\/[A-Z]+)(?:\s|$)/);
    if (match && isLikelyColor(match[1])) return match[1];
  }
  // Multi-word colors (e.g. "NOT AVAILABLE", "DARK BLUE")
  for (const line of searchWindow) {
    const twoWordMatch = line.match(/\b([A-Z]+\s+[A-Z]+)\b/g);
    if (twoWordMatch) {
      for (const phrase of twoWordMatch) {
        if (isLikelyColor(phrase)) return phrase;
      }
    }
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

/** Extract MV File No from coordinate-based and line-based search (MEC layout). */
function extractMvFileNoFromMecLines(lines: string[], words: OcrWord[]): string {
  // Coordinate-based first (most reliable for grid layouts)
  const coordResult =
    findRightText(FIELD_ALIASES.mvFileNo, words, isLikelyMvFileNo) ||
    findBelowText(FIELD_ALIASES.mvFileNo, words, isLikelyMvFileNo);
  if (coordResult) return coordResult;

  // Line-based: find MV FILE NO label then grab inline or below value
  const labelIdx = lines.findIndex((line) =>
    FIELD_ALIASES.mvFileNo.some((alias) => toCanonical(line).includes(toCanonical(alias)))
  );
  if (labelIdx === -1) return "";

  // Check inline (same line, value after the label)
  const labelLine = lines[labelIdx];
  for (const alias of FIELD_ALIASES.mvFileNo) {
    const idx = labelLine.toUpperCase().indexOf(alias.toUpperCase());
    if (idx !== -1) {
      const after = labelLine.substring(idx + alias.length).replace(/^[\s:.\-]+/, "");
      const m = after.match(/^([\w\-]+)/);
      if (m && isLikelyMvFileNo(m[1])) return m[1].toUpperCase();
    }
  }
  // Check lines below label
  for (let i = labelIdx + 1; i < Math.min(lines.length, labelIdx + 4); i++) {
    const candidate = lines[i].trim();
    if (!candidate || isLabelLine(candidate)) break;
    if (isLikelyMvFileNo(candidate)) return candidate.toUpperCase();
  }
  return "";
}

export function extractMECFields(lines: string[], words: OcrWord[], pageWidth: number, pageHeight: number) {
  const flat = lines.join("\n").toUpperCase();

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

  // Find MEC Number (above date, or matching standard pattern)
  let mecNo = "";
  const mecNoMatch = flat.match(/\b\d{5,8}\s*-\s*\d{1,4}\b/);
  if (mecNoMatch) {
    mecNo = mecNoMatch[0];
  }

  // Find Date (above DATE label)
  let dateIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const cleanLine = lines[i].trim().toUpperCase();
    if (cleanLine === "DATE") {
      dateIndex = i;
      break;
    }
  }

  let mecDate = "";
  if (dateIndex > 0) {
    const dateLine = lines[dateIndex - 1].trim();
    if (
      /\b\d{1,2}[-/\s]+[A-Za-z]{3,}[-/\s]+\d{2,4}\b/i.test(dateLine) ||
      /\b\d{1,2}[-/\s]+\d{1,2}[-/\s]+\d{2,4}\b/.test(dateLine)
    ) {
      mecDate = dateLine;
    }
  }

  if (!mecDate) {
    const dateMatch = flat.match(/\b\d{1,2}[-/\s]+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-/\s]+\d{4}\b/i);
    if (dateMatch) {
      mecDate = dateMatch[0];
    }
  }

  if (!mecNo && dateIndex > 0) {
    for (let offset = 2; offset <= 4; offset++) {
      const idx = dateIndex - offset;
      if (idx >= 0) {
        const line = lines[idx].trim();
        const numMatch = line.match(/\b\d{5,10}(?:\s*-\s*\d{1,4})?\b/);
        if (numMatch) {
          mecNo = numMatch[0];
          break;
        }
      }
    }
  }

  return {
    nhqPid:
      mecNo ||
      getField(FIELD_ALIASES.nhqPid, isLikelyNhqPid),
    date:
      mecDate ||
      getField(FIELD_ALIASES.date, isLikelyDate),
    ownerName: getField(["OWNER", "OWNER NAME", "REGISTERED OWNER", ...FIELD_ALIASES.ownerName], isLikelyOwnerName),
    address: extractMultiLineAddress(lines, ["OWNER", "ADDRESS", ...FIELD_ALIASES.acquiredFrom]),
    makeBrand: getGridField(["MAKE/TYPE", "MAKE TYPE", "MAKE/BRAND", "MAKE BRAND", ...FIELD_ALIASES.makeBrand], isLikelyMakeBrand),
    // Color: coordinate/label-based first, then line-scan fallback
    color:
      getGridField(FIELD_ALIASES.color, isLikelyColor) ||
      extractColorFromMecLines(lines),
    plateNo: getGridField(FIELD_ALIASES.plateNo, isLikelyPlate),
    engineNo: getGridField(FIELD_ALIASES.engineNo, isLikelyEngine),
    chassisNo: getGridField(FIELD_ALIASES.chassisNo, isLikelyChassis),
    // MV File No: same extraction logic as MVCC, applied to MEC layout
    mvFileNo: extractMvFileNoFromMecLines(lines, words),
    examinedBy: extractExaminerBlock(words, pageWidth, pageHeight) || getField(FIELD_ALIASES.examinedBy, isLikelyOfficerName),
    notedBy: getField(FIELD_ALIASES.notedBy, isLikelyOfficerName),
  };
}
