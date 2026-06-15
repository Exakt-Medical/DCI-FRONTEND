import type { OcrWord } from "./types";
import { FIELD_ALIASES } from "./constants";
import { extractAroundLabel, findRightText } from "./extractors";
import { isLabelLine, toCanonical } from "./normalize";
import {
  isLikelyMvrrNumber,
  isLikelyCrNumber,
  isLikelySbrNo,
  isLikelyTin,
  isLikelyMeNumber,
  isLikelyOfficerName,
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

export function extractMVCCFields(lines: string[], words: OcrWord[]) {
  return {
    mvrrNumber:
      extractAroundLabel(lines, FIELD_ALIASES.mvrrNumber, isLikelyMvrrNumber)
      || findRightText(FIELD_ALIASES.mvrrNumber, words, isLikelyMvrrNumber),
    crNumber:
      extractAroundLabel(lines, FIELD_ALIASES.crNumber, isLikelyCrNumber)
      || findRightText(FIELD_ALIASES.crNumber, words, isLikelyCrNumber),
    sbrNo:
      extractAroundLabel(lines, FIELD_ALIASES.sbrNo, isLikelySbrNo)
      || findRightText(FIELD_ALIASES.sbrNo, words, isLikelySbrNo),
    acquiredFrom: extractMultiLineAddress(lines, FIELD_ALIASES.acquiredFrom),
    tin:
      extractAroundLabel(lines, FIELD_ALIASES.tin, isLikelyTin)
      || findRightText(FIELD_ALIASES.tin, words, isLikelyTin),
    processingOfficer: extractAroundLabel(lines, FIELD_ALIASES.processingOfficer, isLikelyOfficerName),
    clearanceOfficer: extractAroundLabel(lines, FIELD_ALIASES.clearanceOfficer, isLikelyOfficerName),
    meNumber: extractAroundLabel(lines, FIELD_ALIASES.meNumber, isLikelyMeNumber),
  };
}
