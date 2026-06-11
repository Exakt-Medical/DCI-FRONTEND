import type { OcrWord } from "./types";
import { FIELD_ALIASES, VEHICLE_ID_LABEL_CANONICALS } from "./constants";
import { toCanonical, isLabelLine, repairOcrText } from "./normalize";
import {
  isLikelyPlate, isLikelyEngine, isLikelyChassis,
  isLikelyColor, isLikelyYearModel, isLikelyDate, isLikelyMakeBrand,
} from "./validators";

// ─── Word helpers ─────────────────────────────────────────────────────────────

export function buildWords(items: Array<{ text?: string; poly?: number[][] }>): OcrWord[] {
  return items
    .map((item) => {
      const raw = repairOcrText(item.text ?? "").trim();
      const poly = item.poly ?? [];
      if (!raw || poly.length === 0) return null;
      const xs = poly.map((p) => p[0]);
      const ys = poly.map((p) => p[1]);
      return {
        text: raw,
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(1, Math.max(...xs) - Math.min(...xs)),
        height: Math.max(1, Math.max(...ys) - Math.min(...ys)),
      };
    })
    .filter((w): w is OcrWord => Boolean(w))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function isVehicleIdLabel(line: string): boolean {
  return VEHICLE_ID_LABEL_CANONICALS.has(toCanonical(line.trim()));
}

function getLabelWord(aliases: readonly string[], words: OcrWord[]): OcrWord | null {
  const sorted = [...aliases].map((a) => a.toUpperCase()).sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    const found = words.find((w) => w.text.includes(alias));
    if (found) return found;
  }
  return null;
}

// ─── Coordinate-based finders ─────────────────────────────────────────────────

export function findRightText(aliases: readonly string[], words: OcrWord[], validator?: (v: string) => boolean): string {
  const lw = getLabelWord(aliases, words);
  if (!lw) return "";
  const yTol = Math.max(18, lw.height * 1.1);
  const candidates = words
    .filter((w) => Math.abs(w.y - lw.y) <= yTol && w.x > lw.x + lw.width * 0.4 && !isLabelLine(w.text))
    .sort((a, b) => a.x - b.x);
  for (const c of candidates) {
    if (!validator || validator(c.text)) return c.text;
  }
  return "";
}

export function findBelowText(aliases: readonly string[], words: OcrWord[], validator?: (v: string) => boolean): string {
  const lw = getLabelWord(aliases, words);
  if (!lw) return "";
  const xTol = Math.max(90, lw.width * 1.8);
  const candidates = words
    .filter((w) => w.y > lw.y + lw.height * 0.3 && Math.abs(w.x - lw.x) <= xTol && w.y - lw.y < 300)
    .sort((a, b) => a.y - b.y);
  for (const c of candidates) {
    if (isVehicleIdLabel(c.text)) break;
    if (isLabelLine(c.text)) continue;
    if (!validator || validator(c.text)) return c.text;
  }
  return "";
}

export function findAboveText(aliases: readonly string[], words: OcrWord[], validator?: (v: string) => boolean): string {
  const lw = getLabelWord(aliases, words);
  if (!lw) return "";
  const xTol = Math.max(90, lw.width * 1.8);
  const candidates = words
    .filter((w) => w.y < lw.y && Math.abs(w.x - lw.x) <= xTol && lw.y - w.y < 250)
    .sort((a, b) => b.y - a.y);
  for (const c of candidates) {
    if (isLabelLine(c.text)) continue;
    if (!validator || validator(c.text)) return c.text;
  }
  return "";
}

// ─── Line-based extraction ────────────────────────────────────────────────────

export function extractAroundLabel(
  lines: string[],
  labelAliases: readonly string[],
  validator: (v: string) => boolean,
): string {
  const canonicals = labelAliases.map(toCanonical);

  for (let i = 0; i < lines.length; i++) {
    if (!canonicals.some((c) => toCanonical(lines[i]).includes(c))) continue;

    const parts = lines[i].split(/[:\-\|]/);
    if (parts.length > 1) {
      const inline = parts.slice(1).join(" ").trim();
      if (inline && !isLabelLine(inline) && validator(inline)) return inline;
    }

    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const c = lines[j].trim();
      if (!c) continue;
      if (isVehicleIdLabel(c)) break;
      if (isLabelLine(c)) continue;
      if (validator(c)) return c;
    }

    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const c = lines[j].trim();
      if (!c || isLabelLine(c)) continue;
      if (validator(c)) return c;
    }
  }
  return "";
}

// ─── Stacked-block extraction (LTO style) ────────────────────────────────────

export function findStackedVehicleIds(text: string): { plate: string; engine: string; chassis: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const plateIdx = lines.findIndex((l) => /PLATE\s*NO/.test(l));
  if (plateIdx < 0) return { plate: "", engine: "", chassis: "" };
  const engineIdx = lines.findIndex((l, i) => i >= plateIdx && /ENGINE\s*NO|ENGINE\s*NUMBER/.test(l));
  const chassisIdx = lines.findIndex((l, i) => i >= plateIdx && /CHASSIS\s*NO|CHASSIS\s*NUMBER/.test(l));
  if (engineIdx < 0 || chassisIdx < 0) return { plate: "", engine: "", chassis: "" };

  const labels: string[] = [];
  let cursor = plateIdx;
  while (cursor < lines.length && labels.length < 5) {
    if (/PLATE\s*NO|ENGINE\s*NO|ENGINE\s*NUMBER|CHASSIS\s*NO|CHASSIS\s*NUMBER|VIN/.test(lines[cursor])) {
      labels.push(lines[cursor++]);
    } else break;
  }

  const values = lines
    .slice(cursor, cursor + labels.length + 3)
    .map((v) => v.trim())
    .filter((v) => !isLabelLine(v));

  const pick = (re: RegExp): string => {
    const i = labels.findIndex((l) => re.test(l));
    return i >= 0 ? (values[i] ?? "") : "";
  };

  const plate  = pick(/PLATE\s*NO/);
  const engine = pick(/ENGINE\s*NO|ENGINE\s*NUMBER/);
  const chassis = pick(/CHASSIS\s*NO|CHASSIS\s*NUMBER/);

  return {
    plate:   isLikelyPlate(plate)   ? plate   : "",
    engine:  isLikelyEngine(engine)  ? engine  : "",
    chassis: isLikelyChassis(chassis) ? chassis : "",
  };
}

// ─── Findings-block extraction (PNP cert) ────────────────────────────────────

export function extractFromFindingsBlock(text: string): { engine: string; chassis: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const findingsIdx = lines.findIndex((l) => /FINDINGS/.test(l));
  const scope = findingsIdx >= 0 ? lines.slice(findingsIdx, Math.min(lines.length, findingsIdx + 80)) : lines;
  return {
    engine:  extractAroundLabel(scope, ["ENGINE NUMBER", "ENGINE NO", "ENGINE"], isLikelyEngine),
    chassis: extractAroundLabel(scope, ["CHASSISNUMBER", "CHASSIS NUMBER", "CHASSIS NO", "CHASSIS"], isLikelyChassis),
  };
}

// ─── Layout-specific helpers ─────────────────────────────────────────────────

export function findColorByLayout(words: OcrWord[]): string {
  const label = getLabelWord(FIELD_ALIASES.color, words);
  if (!label) return "";
  const candidates = words
    .filter((w) => {
      if (!isLikelyColor(w.text) || isLabelLine(w.text)) return false;
      const sameRow = Math.abs(w.y - label.y) <= Math.max(18, label.height * 1.2) && w.x > label.x;
      const below   = w.y > label.y && Math.abs(w.x - label.x) <= Math.max(120, label.width * 2.5) && w.y - label.y < 250;
      const above   = w.y < label.y && Math.abs(w.x - label.x) <= Math.max(90, label.width * 1.8) && label.y - w.y < 200;
      return sameRow || below || above;
    })
    .sort((a, b) => Math.abs(a.y - label.y) - Math.abs(b.y - label.y) || a.x - b.x);
  return candidates.find((c) => c.text.includes("/"))?.text ?? candidates[0]?.text ?? "";
}

export function findYearModelByLayout(words: OcrWord[], normalizedText: string): string {
  const label     = getLabelWord(FIELD_ALIASES.yearModel, words);
  const yearWords = words.filter((w) => isLikelyYearModel(w.text));
  if (!yearWords.length) return normalizedText.match(/\b(19[8-9]\d|20[0-2]\d|203[0-5])\b/)?.[0] ?? "";
  if (!label) return yearWords[0].text;
  return (
    yearWords
      .filter((w) => Math.abs(w.y - label.y) < 350)
      .sort(
        (a, b) =>
          Math.abs(a.y - label.y) - Math.abs(b.y - label.y) ||
          Math.abs(a.x - label.x) - Math.abs(b.x - label.x),
      )[0]?.text ?? yearWords[0].text
  );
}

export function findDateByLayout(words: OcrWord[]): string {
  return (
    findRightText(FIELD_ALIASES.date, words, isLikelyDate) ||
    findBelowText(FIELD_ALIASES.date, words, isLikelyDate) ||
    findAboveText(FIELD_ALIASES.date, words, isLikelyDate) ||
    (words.find((w) => isLikelyDate(w.text))?.text ?? "")
  );
}

export function extractColorFromLines(lines: string[]): string {
  const direct = extractAroundLabel(lines, FIELD_ALIASES.color, isLikelyColor);
  if (direct) return direct;
  return lines.find((l) => isLikelyColor(l)) ?? "";
}

export function extractByPatterns(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

// ─── Anchor-based extraction ─────────────────────────────────────────────────

export function findTextNearAnchorWithConstraint(
  targetAliases: readonly string[],
  anchorAliases: readonly string[],
  constraint: 'below' | 'above' | 'rightOf',
  words: OcrWord[],
  targetValidator?: (v: string) => boolean,
): string {
  const anchor = getLabelWord(anchorAliases, words);
  if (!anchor) return "";

  const targetLabels = getLabelWord(targetAliases, words);

  // When the target label exists, look for text beside it, constrained by the anchor.
  if (targetLabels) {
    let candidates: OcrWord[];
    if (constraint === 'rightOf') {
      candidates = words.filter((w) =>
        Math.abs(w.y - anchor.y) <= Math.max(24, anchor.height * 1.5) &&
        w.x > anchor.x + anchor.width &&
        !isLabelLine(w.text)
      );
      const yTol = Math.max(18, targetLabels.height * 1.2);
      candidates = candidates
        .filter((w) => Math.abs(w.y - targetLabels.y) <= yTol && w.x > targetLabels.x + targetLabels.width * 0.3)
        .sort((a, b) => a.x - b.x);
    } else if (constraint === 'above') {
      candidates = words.filter((w) =>
        w.y < anchor.y &&
        Math.abs(w.x - targetLabels.x) <= Math.max(120, targetLabels.width * 2.5) &&
        anchor.y - w.y < 250 &&
        !isLabelLine(w.text)
      );
      const yTol = Math.max(18, targetLabels.height * 1.2);
      candidates = candidates
        .filter((w) => Math.abs(w.y - targetLabels.y) <= yTol && w.x > targetLabels.x + targetLabels.width * 0.3)
        .sort((a, b) => a.x - b.x);
    } else {
      candidates = words.filter((w) =>
        w.y > anchor.y + anchor.height * 0.3 &&
        Math.abs(w.x - targetLabels.x) <= Math.max(120, targetLabels.width * 2.5) &&
        w.y - anchor.y < 400 &&
        !isLabelLine(w.text)
      );
      const yTol = Math.max(18, targetLabels.height * 1.2);
      candidates = candidates
        .filter((w) => Math.abs(w.y - targetLabels.y) <= yTol && w.x > targetLabels.x + targetLabels.width * 0.3)
        .sort((a, b) => a.x - b.x);
    }
    for (const c of candidates) {
      if (!targetValidator || targetValidator(c.text)) return c.text;
    }
  }

  // Fallback: target label not found, scan entire constrained area for valid text
  if (constraint === 'above') {
    const candidates = words
      .filter((w) =>
        w.y < anchor.y &&
        Math.abs(w.x - anchor.x) <= Math.max(200, anchor.width * 3) &&
        anchor.y - w.y < 250 &&
        !isLabelLine(w.text)
      )
      .sort((a, b) => b.y - a.y);
    for (const c of candidates) {
      if (!targetValidator || targetValidator(c.text)) return c.text;
    }
  } else if (constraint === 'below') {
    const candidates = words
      .filter((w) =>
        w.y > anchor.y + anchor.height * 0.3 &&
        Math.abs(w.x - anchor.x) <= Math.max(200, anchor.width * 3) &&
        w.y - anchor.y < 400 &&
        !isLabelLine(w.text)
      )
      .sort((a, b) => a.y - b.y);
    for (const c of candidates) {
      if (!targetValidator || targetValidator(c.text)) return c.text;
    }
  } else {
    const candidates = words
      .filter((w) =>
        Math.abs(w.y - anchor.y) <= Math.max(24, anchor.height * 1.5) &&
        w.x > anchor.x + anchor.width &&
        !isLabelLine(w.text)
      )
      .sort((a, b) => a.x - b.x);
    for (const c of candidates) {
      if (!targetValidator || targetValidator(c.text)) return c.text;
    }
  }

  return "";
}

export function findTextBetweenAnchors(
  targetAliases: readonly string[],
  upperAnchorAliases: readonly string[],
  lowerAnchorAliases: readonly string[],
  words: OcrWord[],
  targetValidator?: (v: string) => boolean,
): string {
  const upperAnchor = getLabelWord(upperAnchorAliases, words);
  const lowerAnchor = getLabelWord(lowerAnchorAliases, words);
  if (!upperAnchor || !lowerAnchor) return "";

  const targetLabel = getLabelWord(targetAliases, words);
  if (!targetLabel) return "";

  if (targetLabel.y < upperAnchor.y || targetLabel.y > lowerAnchor.y) return "";

  const yTol = Math.max(18, targetLabel.height * 1.2);
  const candidates = words
    .filter((w) =>
      Math.abs(w.y - targetLabel.y) <= yTol &&
      w.x > targetLabel.x + targetLabel.width * 0.3 &&
      w.y > upperAnchor.y &&
      w.y < lowerAnchor.y &&
      !isLabelLine(w.text)
    )
    .sort((a, b) => a.x - b.x);

  for (const c of candidates) {
    if (!targetValidator || targetValidator(c.text)) return c.text;
  }
  return "";
}
