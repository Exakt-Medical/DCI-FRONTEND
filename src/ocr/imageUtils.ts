const MAX_EDGE = 1600;
const PDF_SCALE = 1.5;

export async function imageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src   = url;
  await img.decode();
  URL.revokeObjectURL(url);

  const scale = img.naturalWidth > MAX_EDGE || img.naturalHeight > MAX_EDGE
    ? MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight)
    : 1;

  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(img.naturalWidth  * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function renderPage(
  doc: Awaited<ReturnType<typeof import("pdfjs-dist").getDocument>["promise"]>,
  pageNum: number,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNum);
  const vp   = page.getViewport({ scale: PDF_SCALE });
  const pc   = document.createElement("canvas");
  pc.width   = Math.round(vp.width);
  pc.height  = Math.round(vp.height);
  await page.render({ canvasContext: pc.getContext("2d")!, viewport: vp }).promise;
  return pc;
}

export async function pdfFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc   = await pdfjsLib.getDocument({ data: bytes }).promise;

  const pages = await Promise.all(
    Array.from({ length: doc.numPages }, (_, i) => renderPage(doc, i + 1)),
  );

  const GAP = 16;
  const w   = Math.max(...pages.map((c) => c.width));
  const h   = pages.reduce((s, c) => s + c.height, 0) + GAP * (pages.length - 1);
  const out = document.createElement("canvas");
  out.width  = w;
  out.height = h;
  const ctx  = out.getContext("2d")!;
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, w, h);
  let y = 0;
  for (const pc of pages) { ctx.drawImage(pc, 0, y); y += pc.height + GAP; }
  return out;
}

export function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  return isPdf ? pdfFileToCanvas(file) : imageFileToCanvas(file);
}

export function canvasToPreviewUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.85);
}
