import { useState, useEffect, useRef } from "react";
import { runOcr as runPaddleOcrEngine } from "../ocr/engine";
import { preprocessImageToCanvas } from "../ocr/imagePreprocessor";

/**
 * Normalizes spelling mistakes & cleans punctuation.
 */
const cleanField = (str) => {
  if (!str) return "";
  
  // Replace typical letter-number swaps caused by OCR
  let s = str
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/6/g, "G");
    
  // Strip non-alphabetical/non-space/non-hyphen characters
  s = s.replace(/[^A-Za-z\s-]/g, "");
  
  // Remove duplicate spaces
  return s.replace(/\s+/g, " ").trim();
};

/**
 * Parse OCR text into structured fields: firstName, middleName, lastName, fullName.
 */
export const parseIdFields = (rawText) => {
  let firstName = "";
  let middleName = "";
  let lastName = "";
  let fullName = "";

  // Split lines and normalize whitespace
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // 1. Try to find PH standard header: "Last Name, First Name, Middle Name"
  const nameHeaderIndex = lines.findIndex((line) =>
    /last\s*name/i.test(line) && /first\s*name/i.test(line)
  );

  if (nameHeaderIndex !== -1 && nameHeaderIndex + 1 < lines.length) {
    const nameLine = lines[nameHeaderIndex + 1];
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
    }
  }

  // 2. Try matching comma-separated lines directly: "LASTNAME, FIRSTNAME [MIDDLENAME]"
  if (!firstName && !lastName) {
    for (const line of lines) {
      if (/last\s*name/i.test(line)) continue;
      const commaMatch = line.match(/^([A-Za-z0-9\s.'-]{2,40}),\s*([A-Za-z0-9\s.'-]{2,40})$/);
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
  }

  // 3. Fallback to standard key-value matchers (e.g. "GIVEN NAME: ANGELO")
  if (!firstName && !lastName) {
    const givenMatch = rawText.match(/(?:GIVEN\s*NAME|FIRST\s*NAME|GIVEN|FIRST)\s*[:\-]?\s*([A-Za-z0-9\s.,'-]{2,40})/i);
    if (givenMatch?.[1]) {
      const givenParts = givenMatch[1].trim().split(/\s+/);
      if (givenParts.length > 1) {
        middleName = givenParts[givenParts.length - 1];
        firstName = givenParts.slice(0, -1).join(" ");
      } else {
        firstName = givenParts[0] || "";
      }
    }

    const surnameMatch = rawText.match(/(?:SURNAME|LAST\s*NAME|FAMILY\s*NAME|SUR|LAST)\s*[:\-]?\s*([A-Za-z0-9\s.,'-]{2,40})/i);
    if (surnameMatch?.[1]) {
      lastName = surnameMatch[1].trim();
    }
  }

  // Clean and normalize final outputs
  firstName = cleanField(firstName);
  middleName = cleanField(middleName);
  lastName = cleanField(lastName);

  if (firstName || lastName) {
    fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  }

  return { firstName, middleName, lastName, fullName };
};

/**
 * React hook to execute preprocessed PaddleOCR in the browser.
 */
export const usePaddleOcr = () => {
  const [status, setStatus] = useState("idle"); // idle, preprocessing, extracting, success, error
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

    setStatus("preprocessing");
    setError(null);

    try {
      // 1. Preprocess image to HTMLCanvasElement
      const preprocessedCanvas = await preprocessImageToCanvas(file);
      
      if (!isMounted.current) return;
      setStatus("extracting");

      // 2. Run client-side PaddleOCR
      const items = await runPaddleOcrEngine(preprocessedCanvas);
      
      if (!isMounted.current) return;

      const rawText = items.map((item) => item.text).filter(Boolean).join("\n");
      const parsedFields = parseIdFields(rawText);

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
