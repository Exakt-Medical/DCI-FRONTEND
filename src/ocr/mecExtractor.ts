import type { OcrWord } from "./types";
import { FIELD_ALIASES } from "./constants";
import { extractAroundLabel, findRightText } from "./extractors";
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

export function extractMECFields(lines: string[], words: OcrWord[]) {
  return {
    nhqPid:
      extractAroundLabel(lines, FIELD_ALIASES.nhqPid, isLikelyNhqPid)
      || findRightText(FIELD_ALIASES.nhqPid, words, isLikelyNhqPid),
    ownerName:
      extractAroundLabel(lines, ["OWNER", "OWNER NAME", "REGISTERED OWNER"], isLikelyOwnerName)
      || findRightText(["OWNER", "OWNER NAME", "REGISTERED OWNER"], words, isLikelyOwnerName),
    address: extractMultiLineAddress(lines, ["OWNER", "ADDRESS"]),
    makeBrand: extractAroundLabel(lines, ["MAKE/TYPE", "MAKE TYPE", "MAKE/BRAND", "MAKE BRAND"], isLikelyMakeBrand),
    color: extractAroundLabel(lines, FIELD_ALIASES.color, isLikelyColor),
    plateNo: extractAroundLabel(lines, FIELD_ALIASES.plateNo, isLikelyPlate),
    engineNo: extractAroundLabel(lines, FIELD_ALIASES.engineNo, isLikelyEngine),
    chassisNo: extractAroundLabel(lines, FIELD_ALIASES.chassisNo, isLikelyChassis),
    examinedBy: extractAroundLabel(lines, FIELD_ALIASES.examinedBy, isLikelyOfficerName),
    notedBy: extractAroundLabel(lines, FIELD_ALIASES.notedBy, isLikelyOfficerName),
  };
}
