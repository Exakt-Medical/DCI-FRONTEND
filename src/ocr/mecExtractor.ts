import type { OcrWord } from "./types";
import { FIELD_ALIASES } from "./constants";
import { extractAroundLabel, findRightText, extractExaminerBlock } from "./extractors";
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

export function extractMECFields(lines: string[], words: OcrWord[], pageWidth: number, pageHeight: number) {
  const flat = lines.join("\n").toUpperCase();

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
    if (/\b\d{1,2}[-/\s]+[A-Za-z]{3,}[-/\s]+\d{2,4}\b/i.test(dateLine) || /\b\d{1,2}[-/\s]+\d{1,2}[-/\s]+\d{2,4}\b/.test(dateLine)) {
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
      mecNo
      || extractAroundLabel(lines, FIELD_ALIASES.nhqPid, isLikelyNhqPid)
      || findRightText(FIELD_ALIASES.nhqPid, words, isLikelyNhqPid),
    date: mecDate,
    ownerName:
      extractAroundLabel(lines, ["OWNER", "OWNER NAME", "REGISTERED OWNER"], isLikelyOwnerName)
      || findRightText(["OWNER", "OWNER NAME", "REGISTERED OWNER"], words, isLikelyOwnerName),
    address: extractMultiLineAddress(lines, ["OWNER", "ADDRESS"]),
    makeBrand: extractAroundLabel(lines, ["MAKE/TYPE", "MAKE TYPE", "MAKE/BRAND", "MAKE BRAND"], isLikelyMakeBrand),
    color: extractAroundLabel(lines, FIELD_ALIASES.color, isLikelyColor),
    plateNo: extractAroundLabel(lines, FIELD_ALIASES.plateNo, isLikelyPlate),
    engineNo: extractAroundLabel(lines, FIELD_ALIASES.engineNo, isLikelyEngine),
    chassisNo: extractAroundLabel(lines, FIELD_ALIASES.chassisNo, isLikelyChassis),
    examinedBy: extractExaminerBlock(words, pageWidth, pageHeight) || extractAroundLabel(lines, FIELD_ALIASES.examinedBy, isLikelyOfficerName),
    notedBy: extractAroundLabel(lines, FIELD_ALIASES.notedBy, isLikelyOfficerName),
  };
}
