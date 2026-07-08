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
    color: getGridField(FIELD_ALIASES.color, isLikelyColor),
    plateNo: getGridField(FIELD_ALIASES.plateNo, isLikelyPlate),
    engineNo: getGridField(FIELD_ALIASES.engineNo, isLikelyEngine),
    chassisNo: getGridField(FIELD_ALIASES.chassisNo, isLikelyChassis),
    date: getField(FIELD_ALIASES.date, isLikelyDate),
    mvFileNo: getGridField(FIELD_ALIASES.mvFileNo, isLikelyMvFileNo),
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
