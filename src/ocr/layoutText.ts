import type { OcrWord } from "./types";

/**
 * Groups words into logical rows based on vertical proximity,
 * then renders each row as space-padded columns — preserving the
 * visual layout of tables, two-column forms, and side-by-side fields.
 *
 * @param words     Sorted OcrWord array from buildWords()
 * @param pageWidth Canvas pixel width (used to size the character grid)
 * @param cols      Target character-width of the output (default 100)
 */
export function buildLayoutText(
  words: OcrWord[],
  pageWidth: number,
  cols = 100,
): string {
  if (!words.length) return "";

  // ── 1. Cluster words into rows ──────────────────────────────────────────
  // Two words belong to the same row when their vertical centres are within
  // one "row height" of each other.  We use the median word height as the
  // tolerance so the heuristic adapts to font size.
  const heights = words.map((w) => w.height).sort((a, b) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)];
  const rowTolerance = medianH * 0.65;

  const rows: OcrWord[][] = [];
  for (const word of words) {
    const cy = word.y + word.height / 2;
    const existing = rows.find((row) => {
      const rowCy = row[0].y + row[0].height / 2;
      return Math.abs(cy - rowCy) <= rowTolerance;
    });
    if (existing) {
      existing.push(word);
    } else {
      rows.push([word]);
    }
  }
  // Sort rows top-to-bottom, words left-to-right within each row
  rows.sort((a, b) => a[0].y - b[0].y);
  for (const row of rows) row.sort((a, b) => a.x - b.x);

  // ── 2. Detect table-like rows ───────────────────────────────────────────
  // A row is "table-like" if it has ≥2 words with a large horizontal gap
  // between any two consecutive words (relative to median word spacing).
  const allGaps: number[] = [];
  for (const row of rows) {
    for (let i = 1; i < row.length; i++) {
      allGaps.push(row[i].x - (row[i - 1].x + row[i - 1].width));
    }
  }
  allGaps.sort((a, b) => a - b);
  const medianGap = allGaps[Math.floor(allGaps.length / 2)] ?? 0;
  const columnGapThreshold = Math.max(medianGap * 3, pageWidth * 0.04);

  // ── 3. Render each row ──────────────────────────────────────────────────
  const scale = cols / pageWidth; // pixel → char-column ratio
  const outputLines: string[] = [];

  const splitRowIntoCells = (row: OcrWord[]): string[] => {
    if (!row.length) return [];
    const cells: string[] = [];
    let bucket: OcrWord[] = [row[0]];
    for (let i = 1; i < row.length; i++) {
      const prev = row[i - 1];
      const cur = row[i];
      const gap = cur.x - (prev.x + prev.width);
      if (gap > columnGapThreshold) {
        cells.push(bucket.map((w) => w.text).join(" ").trim());
        bucket = [cur];
      } else {
        bucket.push(cur);
      }
    }
    cells.push(bucket.map((w) => w.text).join(" ").trim());
    return cells.filter(Boolean);
  };

  for (const row of rows) {
    const isTableRow =
      row.length >= 2 &&
      row.some((w, i) => {
        if (i === 0) return false;
        return w.x - (row[i - 1].x + row[i - 1].width) > columnGapThreshold;
      });

    if (isTableRow) {
      // Use explicit cell separators for better debug readability.
      const cells = splitRowIntoCells(row);
      if (cells.length >= 2) {
        outputLines.push(`| ${cells.join(" | ")} |`);
        outputLines.push(`| ${cells.map(() => "---").join(" | ")} |`);
      } else {
        outputLines.push(`| ${cells[0] ?? row.map((w) => w.text).join(" ")} |`);
      }
    } else {
      // Single-column or narrow rows: just join words naturally.
      outputLines.push(row.map((w) => w.text).join(" "));
    }
  }

  // ── 4. Collapse excessive blank lines ──────────────────────────────────
  return outputLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Detects column boundaries across multiple rows to emit a clean
 * pipe-delimited table string for any block of rows that share
 * consistent x-alignment (e.g. LTO certificate grids).
 *
 * Returns null if the rows don't look tabular enough.
 */
export function tryBuildPipeTable(rows: OcrWord[][]): string | null {
  if (rows.length < 2) return null;

  // Collect all distinct left-edge x positions (rounded to nearest 10px)
  const xBuckets = new Map<number, number>(); // rounded x → count
  for (const row of rows) {
    for (const w of row) {
      const bx = Math.round(w.x / 10) * 10;
      xBuckets.set(bx, (xBuckets.get(bx) ?? 0) + 1);
    }
  }

  // Keep only columns that appear in ≥40 % of rows (genuine columns)
  const minCount = rows.length * 0.4;
  const colXs = [...xBuckets.entries()]
    .filter(([, count]) => count >= minCount)
    .map(([x]) => x)
    .sort((a, b) => a - b);

  if (colXs.length < 2) return null;

  const tableLines = rows.map((row) => {
    const cells = colXs.map((cx) => {
      // Find the word whose left edge is closest to this column bucket
      const word = row.reduce<OcrWord | null>((best, w) => {
        const bx = Math.round(w.x / 10) * 10;
        if (!best) return Math.abs(bx - cx) < 20 ? w : null;
        return Math.abs(bx - cx) < Math.abs(Math.round(best.x / 10) * 10 - cx) ? w : best;
      }, null);
      return (word?.text ?? "").padEnd(16);
    });
    return "| " + cells.join(" | ") + " |";
  });

  const separator = "| " + colXs.map(() => "----------------").join(" | ") + " |";
  return [tableLines[0], separator, ...tableLines.slice(1)].join("\n");
}