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
  let s = str
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/6/g, "G");
  s = s.replace(/[^A-Za-z\s-]/g, "");
  return s.replace(/\s+/g, " ").trim();
};

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

  const isCombinedHeader = (line: string): boolean => {
    const l = line.toLowerCase();
    const hasLast = l.includes("last name") || l.includes("surname") || l.includes("apelyido");
    const hasFirst = l.includes("first name") || l.includes("given name") || l.includes("pangalan") || l.includes("given names");
    const hasMiddle = l.includes("middle name") || l.includes("gitnang");
    return (hasLast && hasFirst) || (hasLast && hasMiddle) || (hasFirst && hasMiddle);
  };

  const getValueForLabel = (labelRegex: RegExp, searchBelow = true): string => {
    for (let i = 0; i < lines.length; i++) {
      if (isCombinedHeader(lines[i])) continue;
      if (labelRegex.test(lines[i])) {
        const parts = lines[i].split(/[:\-]/);
        if (parts.length > 1 && parts[1].trim().length > 1) {
          return parts[1].trim();
        }
        if (searchBelow && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (!/name|birth|sex|address|nationality|date|number|lic\.\s*no/i.test(nextLine)) {
            return nextLine;
          }
        }
      }
    }
    return "";
  };

  // 1. Try combined header parsing first (common on Driver's Licenses, Postal IDs)
  const combinedHeaderIndex = lines.findIndex(isCombinedHeader);
  if (combinedHeaderIndex !== -1 && combinedHeaderIndex + 1 < lines.length) {
    const nameLine = lines[combinedHeaderIndex + 1];
    if (!/birth|sex|address|nationality|date|number|lic\.\s*no/i.test(nameLine)) {
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

  // 2. If name fields are still empty, try label-based extraction (common on PhilSys National IDs)
  if (!firstName && !lastName) {
    if (idType === "driver_license") {
      lastName = getValueForLabel(/surname|last\s*name|apelyido/i);
      firstName = getValueForLabel(/first\s*name|given\s*name|pangalan/i);
      middleName = getValueForLabel(/middle\s*name|gitnang/i);
    } else if (idType === "philid") {
      lastName = getValueForLabel(/last\s*name|apelyido/i);
      firstName = getValueForLabel(/given\s*names?|pangalan/i);
      middleName = getValueForLabel(/middle\s*name|gitnang/i);
    } else if (idType === "umid") {
      lastName = getValueForLabel(/surname|last\s*name|apelyido/i);
      firstName = getValueForLabel(/given\s*names?|first\s*name|pangalan/i);
      middleName = getValueForLabel(/middle\s*name|gitnang/i);
    } else if (idType === "tin") {
      const nameVal = getValueForLabel(/name/i);
      if (nameVal) {
        const parts = nameVal.split(",");
        if (parts.length >= 2) {
          lastName = parts[0];
          const givenParts = parts[1].trim().split(/\s+/);
          if (givenParts.length > 1) {
            middleName = givenParts[givenParts.length - 1];
            firstName = givenParts.slice(0, -1).join(" ");
          } else {
            firstName = givenParts[0];
          }
        }
      }
    }
  }

  // 3. Fallback to general parsing if still empty
  if (!firstName && !lastName) {
    for (const line of lines) {
      if (/last\s*name|first\s*name|surname|given/i.test(line)) continue;
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
      const givenMatch = rawText.match(/(?:GIVEN\s*NAME|FIRST\s*NAME|GIVEN|FIRST|PANGALAN)\s*[:\-]?\s*([A-Za-z\s.,'-]{2,40})/i);
      if (givenMatch?.[1]) {
        const givenParts = givenMatch[1].trim().split(/\s+/);
        if (givenParts.length > 1) {
          middleName = givenParts[givenParts.length - 1];
          firstName = givenParts.slice(0, -1).join(" ");
        } else {
          firstName = givenParts[0] || "";
        }
      }

      const surnameMatch = rawText.match(/(?:SURNAME|LAST\s*NAME|FAMILY\s*NAME|SUR|LAST|APELYIDO)\s*[:\-]?\s*([A-Za-z\s.,'-]{2,40})/i);
      if (surnameMatch?.[1]) {
        lastName = surnameMatch[1].trim();
      }
    }
  }

  // Clean and normalize final outputs
  firstName = cleanField(firstName);
  middleName = cleanField(middleName);
  lastName = cleanField(lastName);

  if (firstName || lastName) {
    fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  }

  return { firstName, middleName, lastName, fullName, idType };
}
