import { KNOWN_VEHICLE_BRANDS } from "./constants";
import { isLabelLine } from "./normalize";

function hasLettersAndDigits(v: string): boolean {
  return /[A-Z]/.test(v) && /\d/.test(v);
}

// Global regex to detect any of the document's boilerplate text
const BOILERPLATE_REGEX =
  /(REPUBLIC OF THE PHILIPPINES|DEPARTMENT OF THE INTERIOR|NATIONAL POLICE|HEADQUARTERS HIGHWAY|IN VIEW OF THE ABOVE|HEREBY ISSUED|DETERMINING THAT|WANTED\/STOLEN|VALID WITH ERASURES|BLEED THROUGH|MICROPRINT|SERVE AND PROTECT)/i;

export function isLikelyPlate(value: string): boolean {
  const v = value.replace(/\s+/g, "");
  if (!/[A-Z]/.test(v) || !/\d/.test(v)) return false;
  if (/BLACK|WHITE|RED|BLUE|GRAY|GREY|GOLD|SILVER|YELLOW|GREEN/i.test(v))
    return false;
  return /^[A-Z0-9-]{4,10}$/.test(v);
}

export function isLikelyEngine(value: string): boolean {
  const v = value.replace(/\s+/g, "");
  return /^[A-Z0-9-]{8,25}$/.test(v) && hasLettersAndDigits(v);
}

export function isLikelyChassis(value: string): boolean {
  const v = value.replace(/\s+/g, "");
  return /^[A-Z0-9-]{10,25}$/.test(v) && hasLettersAndDigits(v);
}

const KNOWN_COLORS = new Set([
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
]);

export function isLikelyColor(value: string): boolean {
  const v = value.trim().toUpperCase().replace(/\|/g, "/").replace(/\s+/g, " ");
  if (
    !v ||
    /(TYPE|FUEL|CLASSIFICATION|PASSENGER|CAPACITY|TRICYCLE|MOTORCYCLE|SIDECAR|MVCO|MAKE\/?BRAND|MAKE|BRAND)/.test(
      v,
    )
  )
    return false;
  if (BOILERPLATE_REGEX.test(v)) return false;

  if (KNOWN_COLORS.has(v)) return true;

  if (v.includes("/")) {
    const parts = v
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length > 0 && parts.every((part) => KNOWN_COLORS.has(part));
  }

  if (
    /^(DARK|LIGHT|METALLIC|MATTE|GLOSS|BRIGHT|DEEP|PALE|SATIN)\s+[A-Z]{3,15}$/.test(
      v,
    )
  ) {
    const base = v.split(/\s+/).slice(1).join(" ");
    return KNOWN_COLORS.has(base);
  }

  return false;
}

export function isLikelyMvFileNo(value: string): boolean {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return false;
  if (!/^[A-Z0-9-]{8,24}$/.test(compact)) return false;
  if (!/\d{6,}/.test(compact)) return false;
  return true;
}

export function isLikelyYearModel(value: string): boolean {
  if (!/^\d{4}$/.test(value.trim())) return false;
  const y = Number(value.trim());
  return y >= 1980 && y <= 2035;
}

export function isLikelyDate(value: string): boolean {
  if (value.length > 25) return false;
  return (
    /\b\d{1,2}[\/\-\s][A-Za-z]{3,}[\/\-\s]\d{2,4}\b/.test(value) ||
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(value)
  );
}

export function isLikelyControlNo(value: string): boolean {
  const raw = value.trim().toUpperCase();
  const compact = raw.replace(/\s+/g, "");
  if (BOILERPLATE_REGEX.test(raw)) return false;
  return /^[A-Z0-9]{6,30}$/.test(compact);
}

export function isLikelyOwnerName(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (!v || v.length < 4 || v.length > 120) return false;
  if (
    /(ADDRESS|OWNER|REGISTERED|NEW\/REGISTERED|ACQUIREDFROM|TIN|AUTHORITY|CERTIFICATE|HPG CONTROL)/.test(
      v,
    )
  )
    return false;
  if (BOILERPLATE_REGEX.test(v)) return false;
  if (/^[\d\-]+$/.test(v)) return false;
  return /^[A-Z0-9][A-Z0-9 .,'()\-&]{2,}$/.test(v);
}

export function isLikelyMakeBrand(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (!v || isLabelLine(v)) return false;
  if (/^\d[\d\-\/ ]*$/.test(v)) return false;
  if (/^[A-Z0-9-]{8,}$/.test(v) && hasLettersAndDigits(v)) return false;
  if (/(MOTORCYCLE|MOPED|TRICYCLE|SIDECAR|VEHICLE|CATEGORY|WITHOUT)/.test(v))
    return false;
  if (BOILERPLATE_REGEX.test(v)) return false;
  if (KNOWN_VEHICLE_BRANDS.some((b) => v.includes(b))) return true;
  return /^[A-Z][A-Z0-9 .&\-/()]{1,40}$/.test(v);
}

export function isLikelyMvrrNumber(v: string): boolean {
  return /^[A-Z0-9\-]{4,20}$/i.test(v.trim());
}

export function isLikelyCrNumber(v: string): boolean {
  return /^[A-Z0-9\-]{4,20}$/i.test(v.trim());
}

export function isLikelySbrNo(v: string): boolean {
  return /^[A-Z0-9\-]{3,20}$/i.test(v.trim());
}

export function isLikelyTin(v: string): boolean {
  return (
    /^\d{3}-\d{3}-\d{3}(-\d{1,3})?$/.test(v.trim()) ||
    (/^\d{9,12}$/.test(v.trim()) && v.trim().length !== 10)
  );
}

export function isLikelyMeNumber(v: string): boolean {
  return v.trim().length > 3 && /[A-Z0-9]/.test(v.trim());
}

export function isLikelyNhqPid(v: string): boolean {
  return /^[A-Z0-9\-]{3,30}$/i.test(v.trim());
}

export function isLikelyOfficerName(v: string): boolean {
  const raw = v.trim();
  if (!raw) return false;
  const upper = raw.toUpperCase();
  if (
    /(OFFICER|PROCESSING|CLEARANCE|EXAMINED|NOTED|INSPECTED|APPROVED|BY)/.test(
      upper,
    )
  )
    return false;
  if (BOILERPLATE_REGEX.test(upper)) return false;
  return /^[A-Z][A-Z .,'\-IVX]{3,80}$/.test(upper) && /\s+/.test(upper);
}

export function isLikelyFuelType(value: string): boolean {
  const v = value.trim().toUpperCase();
  const known = [
    "GASOLINE",
    "DIESEL",
    "LPG",
    "CNG",
    "ELECTRIC",
    "HYBRID",
    "BIODIESEL",
    "ETHANOL",
    "PETROL",
    "AUTOGAS",
  ];
  if (known.includes(v)) return true;
  return /^[A-Z]{3,15}$/.test(v);
}

export function isLikelyWeight(value: string): boolean {
  return /^\d+(?:\.\d+)?(?:\s*KG)?$/i.test(value.trim());
}

export function isLikelyPersonName(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (v.length < 5 || v.length > 50) return false;

  const words = v.split(/\s+/);
  if (words.length < 2) return false;

  const alphaCount = v.replace(/[^A-Z]/g, "").length;
  if (alphaCount / v.length < 0.6) return false;

  if (/[^A-Z\s.,'-]/.test(v)) return false;

  const invalidKeywords = [
    "NOT TAMPERED",
    "CONCLUSION",
    "FINDINGS",
    "EXAMINED BY",
    "ENGINE NUMBER",
    "CHASSIS NUMBER",
    "VALID FOR",
    "DATE",
    "CERTIFICATE"
  ];
  if (invalidKeywords.some(kw => v.includes(kw))) return false;

  const exactInvalid = [
    "POLICE OFFICER", "POLICE CORPORAL", "POLICE STAFF SERGEANT", 
    "POLICE MASTER SERGEANT", "POLICE LIEUTENANT", "POLICE CAPTAIN", 
    "POLICE MAJOR", "POLICE LIEUTENANT COLONEL", "POLICE COLONEL",
    "PI EXAMINER", "EXAMINER", "STATION HEAD", "INVESTIGATOR"
  ];
  if (exactInvalid.includes(v)) return false;

  return true;
}
