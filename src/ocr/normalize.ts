import type { FormFields } from "./types";
import { LABEL_CANONICALS } from "./constants";

export function toCanonical(input: string): string {
  return input.replace(/[^A-Z0-9]/g, "");
}

export function isLabelLine(line: string): boolean {
  return LABEL_CANONICALS.has(toCanonical(line.trim()));
}

export function normalizeIdForCompare(value: string): string {
  return value.toUpperCase().replace(/[\s\-]/g, "").replace(/[OQD]/g, "0").replace(/[IL]/g, "1");
}

export function cleanFieldValue(field: keyof FormFields, value: string): string {
  const base = value.replace(/\s{2,}/g, " ").trim();
  if (
    field === "engineNo" ||
    field === "chassisNo" ||
    field === "engineNoStencilled" ||
    field === "chassisNoStencilled"
  ) {
    return base.replace(/\s+/g, "").replace(/[|!]/g, "1");
  }
  if (field === "plateNo" || field === "yearModel") {
    return base.replace(/\s+/g, "").replace(/[|!]/g, "1");
  }
  return base;
}

export function repairOcrText(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\bENG0NE\b/g, "ENGINE")
    .replace(/\bCHA5505\b/g, "CHASSIS")
    .replace(/\bV0N\b/g, "VIN")
    .replace(/\bMOT0R\b/g, "MOTOR")
    .replace(/\bBLACKIGOU[D]?\b/g, "BLACK/GOLD")
    .replace(/\bBLACKIWHITE\b/g, "BLACK/WHITE")
    .replace(/\bWHITEIBLACK\b/g, "WHITE/BLACK")
    .replace(/\bSILVERIGRAY\b/g, "SILVER/GRAY")
    .replace(/\bREDIBLACK\b/g, "RED/BLACK")
    .replace(/\bBLUEIWHITE\b/g, "BLUE/WHITE")
    .replace(/\bNPLANPLANPLA\b/g, "NPLA NPLA NPLA")
    .replace(/\b(HONDA|YAMAHA|SUZUKI|KAWASAKI|TOYOTA|MITSUBISHI|ISUZU)(MIC|MC|M\/C|MOTO|MOTOR)\b/g, "$1")
    .replace(/DEPARTMENTOF/g, "DEPARTMENT OF")
    .replace(/PASSENGERCAPACITY/g, "PASSENGER CAPACITY")
    .replace(/PHYSICALIDENTIFICATION/g, "PHYSICAL IDENTIFICATION")
    .replace(/MACROETCHINGCERTIFICATE/g, "MACRO-ETCHING CERTIFICATE")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
