import type { OcrWord } from "./types";

export type IdOcrResult = {
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  idType: "driver_license" | "philid" | "umid" | "tin" | "unknown";
};

const cleanField = (str: string): string => {
  if (!str) return "";
  return str.replace(/[^A-Za-z\s-]/g, "").replace(/\s+/g, " ").trim();
};

const LAST_NAME_RE = /surname|last\s*name|family\s*name|apelyido/i;
const FIRST_NAME_RE = /given\s*names?|first\s*name|pangalan/i;
const MIDDLE_NAME_RE = /middle\s*name|gitnang/i;
const SKIP_LINE_RE = /^(\d+|sex|birth|date|address|nationality|civil|citizenship|height|weight|blood|eye|lic\.\s*no|license|tax|id\s*no)/i;

export function parseIdFields(rawText: string, words: OcrWord[]): IdOcrResult {
  let firstName = "";
  let middleName = "";
  let lastName = "";
  let fullName = "";

  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let idType: IdOcrResult["idType"] = "unknown";

  if (lines.some(l => /driver|license|land\s*transportation|lto/i.test(l))) {
    idType = "driver_license";
  } else if (lines.some(l => /unified\s*multi|umid|social\s*security|gsis|sss/i.test(l))) {
    idType = "umid";
  } else if (lines.some(l => /philsys|national\s*id|philid|citizen|identification/i.test(l))) {
    idType = "philid";
  } else if (lines.some(l => /tax\s*identification|tin\b|internal\s*revenue|bir/i.test(l))) {
    idType = "tin";
  }

  const isLabel = (line: string): boolean =>
    LAST_NAME_RE.test(line) || FIRST_NAME_RE.test(line) || MIDDLE_NAME_RE.test(line);

  const findValueFor = (labelRe: RegExp): string => {
    for (let i = 0; i < lines.length; i++) {
      if (!labelRe.test(lines[i])) continue;

      const parts = lines[i].split(/[:\-]/);
      if (parts.length > 1 && parts[1].trim().length > 1) {
        const val = parts[1].trim();
        if (!SKIP_LINE_RE.test(val) && !isLabel(val)) return val;
      }

      if (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (!SKIP_LINE_RE.test(next) && !isLabel(next)) return next;
      }
    }
    return "";
  };

  const isCombinedHeader = (line: string): boolean => {
    const l = line.toLowerCase();
    const hasLast = l.includes("last name") || l.includes("surname") || l.includes("apelyido");
    const hasFirst = l.includes("first name") || l.includes("given name") || l.includes("pangalan") || l.includes("given names");
    const hasMiddle = l.includes("middle name") || l.includes("gitnang");
    return (hasLast && hasFirst) || (hasLast && hasMiddle) || (hasFirst && hasMiddle);
  };

  const combinedHeaderIndex = lines.findIndex(isCombinedHeader);
  if (combinedHeaderIndex !== -1 && combinedHeaderIndex + 1 < lines.length) {
    const nameLine = lines[combinedHeaderIndex + 1];
    if (!SKIP_LINE_RE.test(nameLine) && !isLabel(nameLine)) {
      const parts = nameLine.split(",");
      if (parts.length >= 2) {
        lastName = parts[0].trim();
        const givenParts = parts[1].trim().split(/\s+/);
        if (givenParts.length > 1) {
          middleName = givenParts[givenParts.length - 1];
          firstName = givenParts.slice(0, -1).join(" ");
        } else {
          firstName = givenParts[0] || "";
        }
      } else {
        const nameParts = nameLine.trim().split(/\s+/);
        if (nameParts.length === 2) {
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else if (nameParts.length === 3) {
          firstName = nameParts[0];
          middleName = nameParts[1];
          lastName = nameParts[2];
        } else if (nameParts.length >= 4) {
          const lastTwo = nameParts.slice(-2).join(" ").toUpperCase();
          const compoundSurnames = ["DELA CRUZ", "DE LA", "DELOS SANTOS", "DE LEON", "SAN BUENAVENTURA", "SAN JUAN", "STA ANA"];
          if (compoundSurnames.some(compound => lastTwo.includes(compound) || compound.includes(lastTwo))) {
            lastName = nameParts.slice(-2).join(" ");
            middleName = nameParts[nameParts.length - 3];
            firstName = nameParts.slice(0, -3).join(" ");
          } else {
            lastName = nameParts[nameParts.length - 1];
            middleName = nameParts[nameParts.length - 2];
            firstName = nameParts.slice(0, -2).join(" ");
          }
        }
      }
    }
  }

  if (!firstName && !lastName) {
    lastName = findValueFor(LAST_NAME_RE);
    firstName = findValueFor(FIRST_NAME_RE);
    middleName = findValueFor(MIDDLE_NAME_RE);
  }

  if (!firstName && !lastName) {
    for (const line of lines) {
      if (isLabel(line)) continue;
      const commaMatch = line.match(/^([A-Za-z\s.'-]{2,40}),\s*([A-Za-z\s.'-]{2,40})$/);
      if (commaMatch) {
        lastName = commaMatch[1].trim();
        const givenParts = commaMatch[2].trim().split(/\s+/);
        if (givenParts.length > 1) {
          middleName = givenParts[givenParts.length - 1];
          firstName = givenParts.slice(0, -1).join(" ");
        } else {
          firstName = givenParts[0] || "";
        }
        break;
      }
    }

    if (!firstName && !lastName) {
      const givenMatch = rawText.match(/(?:GIVEN\s*NAME|GIVEN\s*NAMES|FIRST\s*NAME|PANGALAN)\s*[:\-]?\s*([A-Za-z\s.,'-]{2,40})/i);
      if (givenMatch?.[1]) {
        const givenParts = givenMatch[1].trim().split(/\s+/);
        if (givenParts.length > 1) {
          middleName = givenParts[givenParts.length - 1];
          firstName = givenParts.slice(0, -1).join(" ");
        } else {
          firstName = givenParts[0] || "";
        }
      }

      const surnameMatch = rawText.match(/(?:SURNAME|LAST\s*NAME|FAMILY\s*NAME|APELYIDO)\s*[:\-]?\s*([A-Za-z\s.,'-]{2,40})/i);
      if (surnameMatch?.[1]) {
        lastName = surnameMatch[1].trim();
      }
    }
  }

  firstName = cleanField(firstName);
  middleName = cleanField(middleName);
  lastName = cleanField(lastName);

  if (firstName || lastName) {
    fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  }

  return { firstName, middleName, lastName, fullName, idType };
}
