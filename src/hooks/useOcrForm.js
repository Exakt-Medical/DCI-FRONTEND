import { useState, useRef, useCallback } from "react";
import { fileToCanvas } from "../ocr/imageUtils";
import { runOcr } from "../ocr/engine";
import { buildWords } from "../ocr/extractors";
import { repairOcrText } from "../ocr/normalize";
import { parseFields } from "../ocr/parser";
import { INITIAL_FIELDS, EMPTY_EXTRACTION } from "../ocr/types";

export const OCR_STATUS = Object.freeze({
  IDLE: "idle",
  EXTRACTING: "extracting",
  SUCCESS: "success",
  ERROR: "error",
});

export const CLEARANCE_OCR_DOCUMENT_TYPE = Object.freeze({
  OR: "or",
  CR: "cr",
  MVC: "mvc",
  MEC: "mec",
});

const OCR_HELP_TEXT = "Supports PDF and image OCR extraction.";

const OCR_REGEX = {
  orNumber: [
    /OFFICIAL\s+RECEIPT\s*(?:NO\.?|NUMBER|#)?\s*[:\-]?\s*([A-Z0-9\-./]{6,30})/im,
    /(?:RECEIPT\s*NO\.?|OR\s*NO\.?|O\.R\.\s*NO\.?)\s*[:\-]?\s*([A-Z0-9\-./]{4,25})/im,
  ],
  crNumber: [
    /(?:C\.?\s*R\.?\s*NO\.?|CR\s*NO\.?)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/im,
    /(?:C\.?\s*R\.?\s*NUMBER|CR\s*NUMBER)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/im,
  ],
  orDate: [
    /(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE|DATE)\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/im,
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
  ],
  amountPaid: [
    /TOTAL\s+AMOUNT\s+PAID\s*:?\s*PHP\s*([\d,]+(?:\.\d{2})?)/im,
    /TOTAL\s+AMOUNT\s+PAID\s*:?\s*([\d,]+(?:\.\d{2})?)/im,
    /AMOUNT\s+PAID\s*:?\s*PHP\s*([\d,]+(?:\.\d{2})?)/im,
  ],
  fuelType: [/(?:TYPE\s*OF\s*FUEL|FUEL\s*TYPE)\s*[:\-]?\s*([A-Z]{3,15})/im],
  grossWeight: [
    /(?:GROSS\s*(?:WT\.?|WEIGHT|VEHICLE\s*WEIGHT)|GVW)\s*[:\-]?\s*([\d,]+(?:\s*KG)?)/im,
  ],
  netWeight: [
    /(?:NET\s*(?:WT\.?|WEIGHT|CAPACITY))\s*[:\-]?\s*([\d,]+(?:\s*KG)?)/im,
  ],
};

export const formatOcrHint = (state) => {
  if (!state || state.status === OCR_STATUS.IDLE) return OCR_HELP_TEXT;
  if (state.status === OCR_STATUS.EXTRACTING) {
    return "Extracting fields from document...";
  }
  if (state.status === OCR_STATUS.SUCCESS) {
    const confidence = Number.isFinite(state.confidence)
      ? Math.round(state.confidence * 100)
      : 0;
    return confidence > 0
      ? `OCR extracted data (${confidence}% confidence). Review before submitting.`
      : "OCR extracted data. Review before submitting.";
  }
  if (state.status === OCR_STATUS.ERROR) {
    return (
      state.error || "OCR extraction failed. You can fill the fields manually."
    );
  }
  return OCR_HELP_TEXT;
};

export const normalizeDateForInput = (value) => {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  const dateOnly = value.replace(/\s+\d{1,2}:\d{2}.*$/, "");
  const slashOrDash = dateOnly.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/,
  );
  if (!slashOrDash) return value;
  const month = slashOrDash[1].padStart(2, "0");
  const day = slashOrDash[2].padStart(2, "0");
  const rawYear = slashOrDash[3];
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${month}/${day}/${year}`;
};

const matchFirst = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().toUpperCase();
  }
  return "";
};

const averageConfidence = (values) => {
  const present = values.filter((value) => Number.isFinite(value) && value > 0);
  if (present.length === 0) return 0;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
};

const buildVehiclePayload = (fields, extras = {}) => ({
  plateNumber: (fields.plateNo || "").toUpperCase(),
  mvFileNumber: (fields.mvFileNo || "").toUpperCase(),
  classification: "",
  vehicleType: "",
  fuelType: extras.fuelType || "",
  airconType: "",
  engineNumber: (fields.engineNo || "").toUpperCase(),
  chassisNumber: (fields.chassisNo || "").toUpperCase(),
  make: (fields.makeBrand || "").toUpperCase(),
  series: "",
  yearModel: (fields.yearModel || "").toUpperCase(),
  color: (fields.color || "").toUpperCase(),
  ownerName: (fields.ownerName || "").toUpperCase(),
  ownerAddress: (fields.address || "").toUpperCase(),
});

const buildTextExtras = (normalizedText) => ({
  orNumber: matchFirst(normalizedText, OCR_REGEX.orNumber),
  crNumber: matchFirst(normalizedText, OCR_REGEX.crNumber),
  orDate: matchFirst(normalizedText, OCR_REGEX.orDate),
  amountPaid: matchFirst(normalizedText, OCR_REGEX.amountPaid),
  fuelType: matchFirst(normalizedText, OCR_REGEX.fuelType),
  grossWeight: matchFirst(normalizedText, OCR_REGEX.grossWeight),
  netWeight: matchFirst(normalizedText, OCR_REGEX.netWeight),
});

export async function runSharedLocalOcr(file) {
  try {
    const canvas = await fileToCanvas(file);
    const items = await runOcr(canvas);
    const words = buildWords(items);
    const normalizedText = repairOcrText(words.map((w) => w.text).join("\n"));
    return {
      ...parseFields(normalizedText, words, canvas.width),
      normalizedText,
    };
  } catch (err) {
    console.warn("OCR pipeline error, returning empty result:", err);
    return {
      fields: { ...INITIAL_FIELDS },
      extraction: { ...EMPTY_EXTRACTION },
      layoutText: "",
      normalizedText: "",
    };
  }
}

export async function extractClearanceDocumentData(file, documentType) {
  const result = await runSharedLocalOcr(file);
  const extras = buildTextExtras(result.normalizedText);
  const { fields, extraction, layoutText } = result;

  const vehicleConfidence = averageConfidence([
    extraction.plateNo?.confidence,
    extraction.ownerName?.confidence,
    extraction.address?.confidence,
    extraction.mvFileNo?.confidence,
    extraction.engineNo?.confidence,
    extraction.chassisNo?.confidence,
    extraction.makeBrand?.confidence,
    extraction.yearModel?.confidence,
    extraction.color?.confidence,
  ]);

  switch (documentType) {
    case CLEARANCE_OCR_DOCUMENT_TYPE.OR:
      return {
        fields: {
          orNumber: extras.orNumber,
          orDate: normalizeDateForInput(extras.orDate || fields.date || ""),
          orAmount: extras.amountPaid,
          vehicle: buildVehiclePayload(fields, extras),
        },
        extraction,
        layoutText,
        confidence: averageConfidence([
          vehicleConfidence,
          extraction.date?.confidence,
          extras.orNumber ? 0.78 : 0,
          extras.amountPaid ? 0.78 : 0,
        ]),
      };
    case CLEARANCE_OCR_DOCUMENT_TYPE.CR:
      return {
        fields: {
          crNumber: (fields.crNumber || extras.crNumber || "").toUpperCase(),
          vehicle: buildVehiclePayload(fields, extras),
        },
        extraction,
        layoutText,
        confidence: averageConfidence([
          vehicleConfidence,
          extraction.crNumber?.confidence,
        ]),
      };
    case CLEARANCE_OCR_DOCUMENT_TYPE.MVC:
      return {
        fields: {
          mvcNo: (
            fields.mvccControlNo ||
            fields.mvrrNumber ||
            ""
          ).toUpperCase(),
          mvcIssueDate: normalizeDateForInput(fields.date || ""),
          mvcValidUntil: "",
          mvcStatus: "",
        },
        extraction,
        layoutText,
        confidence: averageConfidence([
          extraction.mvccControlNo?.confidence,
          extraction.mvrrNumber?.confidence,
          extraction.date?.confidence,
        ]),
      };
    case CLEARANCE_OCR_DOCUMENT_TYPE.MEC:
      return {
        fields: {
          mecNo: (fields.meNumber || fields.nhqPid || "").toUpperCase(),
          mecIssueDate: normalizeDateForInput(fields.date || ""),
          mecValidUntil: "",
          mecCo2: "",
          mecHc: "",
          mecResult: "",
        },
        extraction,
        layoutText,
        confidence: averageConfidence([
          extraction.meNumber?.confidence,
          extraction.nhqPid?.confidence,
          extraction.date?.confidence,
        ]),
      };
    default:
      throw new Error(`Unsupported OCR document type: ${documentType}`);
  }
}

export function useOcrForm(type = "mvcc") {
  const isMvcc = type === "mvcc";

  const [isProcessingDoc1, setIsProcessingDoc1] = useState(false);
  const [isProcessingDoc2, setIsProcessingDoc2] = useState(false);
  const [doc1Uploaded, setDoc1Uploaded] = useState(false);
  const [doc2Uploaded, setDoc2Uploaded] = useState(false);
  const [doc1File, setDoc1File] = useState(null);
  const [doc2File, setDoc2File] = useState(null);
  const [ocrError, setOcrError] = useState("");
  const [doc1Extraction, setDoc1Extraction] = useState(null);
  const [doc2Extraction, setDoc2Extraction] = useState(null);

  const seq1 = useRef(0);
  const seq2 = useRef(0);

  const [formData, setFormData] = useState({
    mvccControlNo: "",
    mvccDateIssued: "",
    hpgOffice: "",
    purpose: "",
    plateNo: "",
    orPlateNo: "",
    ownerName: "",
    address: "",
    mvFileNo: "",
    engineNo: "",
    chassisNo: "",
    hpgTechnician: "",
    makeModel: "",
    orNumber: "",
    orDate: "",
    yearModel: "",
    color: "",
    fuelType: "",
    grossWeight: "",
    netWeight: "",
    amountPaid: "",
    ltoBranch: "",
    crNumber: "",
    crDate: "",
  });

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value.toUpperCase(),
    }));
  };

  const runLocalOcr = runSharedLocalOcr;

  const buildMakeModel = (fields) => {
    const brand = (fields.makeBrand ?? "").trim();
    const yr = (fields.yearModel ?? "").trim();
    const color = (fields.color ?? "").trim();
    const parts = [brand, yr, color].filter(Boolean);
    return parts.join(" ");
  };

  const handleDoc1Upload = async (file) => {
    const seq = ++seq1.current;
    setDoc1File(file);
    setDoc1Uploaded(false);
    setDoc1Extraction(null);
    setOcrError("");
    setIsProcessingDoc1(true);
    try {
      const { fields, extraction } = await runLocalOcr(file);
      if (seq !== seq1.current) return;
      const makeModel = buildMakeModel(fields);
      const commonUpdates = {
        plateNo: (fields.plateNo || "").toUpperCase(),
        orPlateNo: (fields.plateNo || "").toUpperCase(),
        ownerName: (fields.ownerName || "").toUpperCase(),
        address:
          extraction.address?.confidence >= 0.8 && fields.address
            ? fields.address.toUpperCase()
            : "",
        makeModel: makeModel ? makeModel.toUpperCase() : "",
      };
      if (isMvcc) {
        setFormData((prev) => ({
          ...prev,
          ...commonUpdates,
          mvccControlNo: (fields.mvccControlNo || "").toUpperCase(),
          mvccDateIssued: normalizeDateForInput(fields.date) || "",
          mvFileNo: (fields.mvFileNo || "").toUpperCase(),
          hpgOffice: (fields.hpgOffice || "").toUpperCase(),
          purpose: (fields.purpose || "").toUpperCase(),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          orPlateNo: (fields.plateNo || "").toUpperCase(),
          ownerName: (fields.ownerName || "").toUpperCase(),
          address:
            extraction.address?.confidence >= 0.8 && fields.address
              ? fields.address.toUpperCase()
              : "",
          makeModel: makeModel ? makeModel.toUpperCase() : "",
          orNumber: (fields.orNumber || "").toUpperCase(),
          orDate: normalizeDateForInput(fields.orDate || fields.date) || "",
          amountPaid: (fields.amountPaid || "").toUpperCase(),
          ltoBranch: (fields.ltoBranch || "").toUpperCase(),
        }));
      }
      setDoc1Extraction(extraction);
      setDoc1Uploaded(true);
    } catch (error) {
      if (seq !== seq1.current) return;
      const label = isMvcc ? "MVCC" : "OR";
      const msg = error?.message || String(error);
      setOcrError(`${label} OCR failed: ${msg}`);
      console.error(`${label} OCR failed:`, error);
    } finally {
      if (seq === seq1.current) setIsProcessingDoc1(false);
    }
  };

  const handleDoc2Upload = async (file) => {
    const seq = ++seq2.current;
    setDoc2File(file);
    setDoc2Uploaded(false);
    setDoc2Extraction(null);
    setOcrError("");
    setIsProcessingDoc2(true);
    try {
      const { fields, extraction } = await runLocalOcr(file);
      if (seq !== seq2.current) return;
      if (isMvcc) {
        setFormData((prev) => ({
          ...prev,
          engineNo: (fields.engineNo || prev.engineNo).toUpperCase(),
          chassisNo: (fields.chassisNo || prev.chassisNo).toUpperCase(),
          hpgTechnician: (
            fields.hpgTechnician || prev.hpgTechnician
          ).toUpperCase(),
        }));
        setDoc2Extraction(extraction);
        const hasData = !!(fields.engineNo || fields.chassisNo);
        setDoc2Uploaded(hasData);
        if (!hasData)
          setOcrError(
            "MEC OCR could not extract engine or chassis number. Please try a clearer image.",
          );
      } else {
        setFormData((prev) => ({
          ...prev,
          plateNo: fields.plateNo ? fields.plateNo.toUpperCase() : "",
          engineNo: (fields.engineNo || prev.engineNo).toUpperCase(),
          chassisNo: (fields.chassisNo || prev.chassisNo).toUpperCase(),
          makeModel: (
            fields.makeBrand ||
            fields.makeModel ||
            prev.makeModel
          ).toUpperCase(),
          yearModel: (fields.yearModel || prev.yearModel).toUpperCase(),
          color: (fields.color || prev.color).toUpperCase(),
          fuelType: (fields.fuelType || "").toUpperCase(),
          grossWeight: (fields.grossWeight || "").toUpperCase(),
          netWeight: (fields.netWeight || "").toUpperCase(),
          ownerName: (fields.ownerName || prev.ownerName).toUpperCase(),
          address: (fields.address || prev.address).toUpperCase(),
        }));
        setDoc2Extraction(extraction);
        const hasData = !!(
          fields.engineNo ||
          fields.chassisNo ||
          fields.plateNo
        );
        setDoc2Uploaded(hasData);
        if (!hasData)
          setOcrError(
            "CR OCR could not extract data. Please try a clearer image.",
          );
      }
    } catch (error) {
      if (seq !== seq2.current) return;
      const label = isMvcc ? "MEC" : "CR";
      const msg = error?.message || String(error);
      setOcrError(`${label} OCR failed: ${msg}`);
      console.error(`${label} OCR failed:`, error);
    } finally {
      if (seq === seq2.current) setIsProcessingDoc2(false);
    }
  };

  const clearDoc1 = () => {
    seq1.current += 1;
    setDoc1File(null);
    setDoc1Uploaded(false);
    setDoc1Extraction(null);
    setIsProcessingDoc1(false);
    setOcrError("");
    const cleared = isMvcc
      ? {
          mvccControlNo: "",
          mvccDateIssued: "",
          hpgOffice: "",
          purpose: "",
          plateNo: "",
          orPlateNo: "",
          ownerName: "",
          address: "",
          mvFileNo: "",
          makeModel: "",
        }
      : {
          orNumber: "",
          orDate: "",
          amountPaid: "",
          ltoBranch: "",
          orPlateNo: "",
          plateNo: "",
          ownerName: "",
        };
    setFormData((prev) => ({ ...prev, ...cleared }));
  };

  const clearDoc2 = () => {
    seq2.current += 1;
    setDoc2File(null);
    setDoc2Uploaded(false);
    setDoc2Extraction(null);
    setIsProcessingDoc2(false);
    setOcrError("");
    const cleared = isMvcc
      ? { engineNo: "", chassisNo: "", hpgTechnician: "" }
      : {
          plateNo: "",
          engineNo: "",
          chassisNo: "",
          makeModel: "",
          yearModel: "",
          color: "",
          fuelType: "",
          grossWeight: "",
          netWeight: "",
          ownerName: "",
          address: "",
        };
    setFormData((prev) => ({ ...prev, ...cleared }));
  };

  const summarizeExtraction = (extraction, fieldNames) => {
    if (!extraction) return "";
    const entries = fieldNames.map((fn) => extraction[fn]).filter(Boolean);
    if (entries.length === 0) return "";
    const filled = entries.filter((e) => e.selected).length;
    const low = entries.filter((e) => e.selected && e.confidence < 0.65).length;
    const mixed = entries.filter(
      (e) => e.selected && e.confidence >= 0.65 && e.confidence < 0.82,
    ).length;
    if (filled === 0) return "No clear fields found - enter details manually";
    if (low > 0)
      return `${filled}/${entries.length} fields extracted - needs careful review`;
    if (mixed > 0)
      return `${filled}/${entries.length} fields extracted - mixed confidence`;
    return `${filled}/${entries.length} fields extracted - high confidence`;
  };

  const doc1SummaryFields = isMvcc
    ? [
        "plateNo",
        "ownerName",
        "mvccControlNo",
        "date",
        "mvFileNo",
        "hpgOffice",
        "purpose",
        "makeBrand",
      ]
    : ["orNumber", "orDate", "amountPaid", "ltoBranch", "ownerName"];

  const doc2SummaryFields = isMvcc
    ? ["engineNo", "chassisNo", "hpgTechnician"]
    : [
        "plateNo",
        "engineNo",
        "chassisNo",
        "makeBrand",
        "yearModel",
        "color",
        "ownerName",
      ];

  const doc1SummaryLine = summarizeExtraction(
    doc1Extraction,
    doc1SummaryFields,
  );
  const doc2SummaryLine = summarizeExtraction(
    doc2Extraction,
    doc2SummaryFields,
  );

  const reviewLegendTier = [doc1SummaryLine, doc2SummaryLine].some((l) =>
    l.includes("needs careful"),
  )
    ? "low"
    : [doc1SummaryLine, doc2SummaryLine].some((l) => l.includes("mixed"))
      ? "mixed"
      : "high";

  const resetForm = () => {
    seq1.current += 1;
    seq2.current += 1;
    setFormData({
      mvccControlNo: "",
      mvccDateIssued: "",
      hpgOffice: "",
      purpose: "",
      plateNo: "",
      orPlateNo: "",
      ownerName: "",
      address: "",
      mvFileNo: "",
      engineNo: "",
      chassisNo: "",
      hpgTechnician: "",
      makeModel: "",
      orNumber: "",
      orDate: "",
      yearModel: "",
      color: "",
      fuelType: "",
      grossWeight: "",
      netWeight: "",
      amountPaid: "",
      ltoBranch: "",
      crNumber: "",
      crDate: "",
    });
    setDoc1File(null);
    setDoc2File(null);
    setDoc1Uploaded(false);
    setDoc2Uploaded(false);
    setDoc1Extraction(null);
    setDoc2Extraction(null);
    setOcrError("");
  };

  const fieldInputClass = useCallback(
    (fieldName) => {
      const value = (formData[fieldName] ?? "").trim();
      return value ? "" : "ocr-empty";
    },
    [formData],
  );

  return {
    formData,
    ocrError,
    doc1File,
    doc2File,
    doc1Uploaded,
    doc2Uploaded,
    isProcessingDoc1,
    isProcessingDoc2,
    handleDoc1Upload,
    handleDoc2Upload,
    handleMvccUpload: handleDoc1Upload,
    handleMecUpload: handleDoc2Upload,
    clearDoc1,
    clearDoc2,
    handleInputChange,
    resetForm,
    fieldInputClass,
    doc1SummaryLine,
    doc2SummaryLine,
    reviewLegendTier,
    isMvcc,
  };
}
