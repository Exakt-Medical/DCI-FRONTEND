import type { OcrItem } from "./types";

type PaddleOcrInstance = {
  predict: (canvas: HTMLCanvasElement) => Promise<Array<{ items?: OcrItem[] }>>;
  dispose?: () => Promise<void> | void;
};

let instance: PaddleOcrInstance | null = null;
let loadPromise: Promise<PaddleOcrInstance> | null = null;

/**
 * Detects the fastest ONNX Runtime backend supported by this browser.
 * WebGPU ≫ WebGL ≫ WASM (in terms of inference speed).
 */
function detectBestBackend(): string {
  if (typeof navigator !== "undefined" && "gpu" in navigator) return "webgpu";
  try {
    const c = document.createElement("canvas");
    if (c.getContext("webgl2") || c.getContext("webgl")) return "webgl";
  } catch { /* ignore */ }
  return "wasm";
}

function buildOrtOptions(backend: string) {
  return {
    backend,
    ...(backend === "wasm"
      ? { wasmPaths: "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/" }
      : {}),
    numThreads: 1,
  };
}

async function createEngine(): Promise<PaddleOcrInstance> {
  try {
    const ort = await import("onnxruntime-web");
    ort.env.logLevel = "error";
    ort.env.wasm.numThreads = 1;
  } catch {
    /* optional peer — ignore if not hoisted */
  }
  const { PaddleOCR } = await import("@paddleocr/paddleocr-js");
  const backend = detectBestBackend();

  // Try the best backend; if it throws, fall back to WASM.
  try {
    return await PaddleOCR.create({
      lang: "en",
      ocrVersion: "PP-OCRv5",
      useAngleCls: true,
      ortOptions: buildOrtOptions(backend),
    });
  } catch {
    if (backend === "wasm") throw new Error("OCR engine failed to initialise.");
    return await PaddleOCR.create({
      lang: "en",
      ocrVersion: "PP-OCRv5",
      useAngleCls: true,
      ortOptions: buildOrtOptions("wasm"),
    });
  }
}

/** Returns the singleton engine, loading it once. Deduplicates concurrent calls. */
export function getOcrEngine(): Promise<PaddleOcrInstance> {
  if (instance) return Promise.resolve(instance);
  if (!loadPromise) {
    loadPromise = createEngine().then((eng) => {
      instance = eng;
      return eng;
    });
  }
  return loadPromise;
}

/** Call as early as possible (e.g. on component mount) to hide load latency. */
export function prewarmOcrEngine(): void {
  getOcrEngine().catch(() => { /* silently retry on actual use */ });
}

export async function runOcr(canvas: HTMLCanvasElement): Promise<OcrItem[]> {
  const eng     = await getOcrEngine();
  const results = await eng.predict(canvas);
  return results[0]?.items ?? [];
}

export function disposeOcrEngine(): void {
  if (instance?.dispose) void instance.dispose();
  instance    = null;
  loadPromise = null;
}
