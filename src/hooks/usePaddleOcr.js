import { useState, useEffect, useRef } from "react";
import { runOcr as runPaddleOcrEngine } from "../ocr/engine";
import { fileToCanvas } from "../ocr/imageUtils";
import { buildWords } from "../ocr/extractors";
import { repairOcrText } from "../ocr/normalize";
import { parseIdFields } from "../ocr/idExtractor";

/**
 * React hook to execute preprocessed PaddleOCR in the browser.
 */
export const usePaddleOcr = () => {
  const [status, setStatus] = useState("idle"); // idle, extracting, success, error
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runOcr = async (file) => {
    if (!file) return;

    setStatus("extracting");
    setError(null);

    try {
      // Use standard imageUtils fileToCanvas which handles rotation and scale natively
      const canvas = await fileToCanvas(file);
      if (!isMounted.current) return;

      // Run client-side PaddleOCR
      const items = await runPaddleOcrEngine(canvas);
      if (!isMounted.current) return;

      const words = buildWords(items);
      const rawText = repairOcrText(words.map((w) => w.text).join("\n"));
      const parsedFields = parseIdFields(rawText, words);

      setExtractedData(parsedFields);
      setStatus("success");
      
      return {
        success: true,
        data: parsedFields,
      };
    } catch (err) {
      console.error("PaddleOCR pipeline error: ", err);
      if (isMounted.current) {
        setError(err.message || "Failed to process image.");
        setStatus("error");
      }
      return { success: false, error: err.message };
    }
  };

  const resetOcr = () => {
    setStatus("idle");
    setExtractedData(null);
    setError(null);
  };

  return {
    runOcr,
    resetOcr,
    status,
    extractedData,
    error,
  };
};
