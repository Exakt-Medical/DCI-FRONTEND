import { useRef, useState } from "react";
import {
  CLEARANCE_OCR_DOCUMENT_TYPE,
  extractClearanceDocumentData,
  OCR_STATUS,
} from "../../../hooks/useOcrForm";
import {
  emptyVehicle,
  emptyMvc,
  emptyMec,
  emptyOcrUploadState,
  mergeVehicleFields,
} from "../utils/clearanceRequestUtils";

/**
 * useOrCrOcr
 *
 * Manages OCR version-tracking and all six document-upload handlers:
 *   OR, CR, Agent-MVC, Agent-MEC, Citizen-MVC, Citizen-MEC.
 *
 * The caller is responsible for providing state setters so this hook
 * stays stateless apart from `ocrUploadState` and the version ref.
 */
export const useOrCrOcr = ({
  orCr,
  crCr,
  mvcData,
  mecData,
  agentMvcData,
  agentMecData,
  setOrCr,
  setCrCr,
  setMvcData,
  setMecData,
  setAgentMvcData,
  setAgentMecData,
  setOrPreview,
  setCrPreview,
  setMvcPreview,
  setMecPreview,
  setAgentMvcPreview,
  setAgentMecPreview,
  setMvcFileName,
  setMecFileName,
  setAgentMvcFileName,
  setAgentMecFileName,
  setValidationErrors,
  setCitizenValidationState,
  setCitizenValidationMessage,
  saveCitizenRequest,
  VALIDATION_STATE,
  onOrExtracted,
  onCrExtracted,
}) => {
  const [ocrUploadState, setOcrUploadState] = useState(emptyOcrUploadState);
  const ocrUploadVersionRef = useRef({
    or: 0, cr: 0, mvc: 0, mec: 0, agentMvc: 0, agentMec: 0,
  });

  const nextOcrVersion = (key) => {
    const current = (ocrUploadVersionRef.current[key] || 0) + 1;
    ocrUploadVersionRef.current[key] = current;
    return current;
  };

  const isCurrentOcrVersion = (key, version) =>
    ocrUploadVersionRef.current[key] === version;

  const setOcrState = (key, patch) =>
    setOcrUploadState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  // ── OR Upload ───────────────────────────────────────────────────────────────

  const handleOrUpload = async (file, preview) => {
    setOrPreview(preview);
    setValidationErrors({});
    if (!file) {
      setOcrState("or", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("or");
    const previousState = { orCr };
    setOcrState("or", { status: OCR_STATUS.EXTRACTING, confidence: 0, error: "" });

    try {
      const result = await extractClearanceDocumentData(file, CLEARANCE_OCR_DOCUMENT_TYPE.OR);
      if (!isCurrentOcrVersion("or", runId)) return;

      const parsed = result.fields || {};
      const vehicleData = { ...(parsed.vehicle || {}) };
      delete vehicleData.engineNumber;
      delete vehicleData.chassisNumber;
      
      setOrCr(mergeVehicleFields(orCr, vehicleData));
      setOcrState("or", { status: OCR_STATUS.SUCCESS, confidence: result.confidence || 0, error: "" });
      if (onOrExtracted) onOrExtracted(vehicleData);
    } catch (error) {
      if (!isCurrentOcrVersion("or", runId)) return;
      setOrCr(previousState.orCr || emptyVehicle);
      setOcrState("or", { status: OCR_STATUS.ERROR, confidence: 0, error: error?.message || "Unable to extract OR details." });
    }
  };

  // ── CR Upload ───────────────────────────────────────────────────────────────

  const handleCrUpload = async (file, preview) => {
    setCrPreview(preview);
    setValidationErrors({});
    if (!file) {
      setOcrState("cr", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("cr");
    const previousState = { crCr };
    setOcrState("cr", { status: OCR_STATUS.EXTRACTING, confidence: 0, error: "" });

    try {
      const result = await extractClearanceDocumentData(file, CLEARANCE_OCR_DOCUMENT_TYPE.CR);
      if (!isCurrentOcrVersion("cr", runId)) return;

      const parsed = result.fields || {};
      setCrCr(mergeVehicleFields(crCr, parsed.vehicle || {}));
      setOcrState("cr", { status: OCR_STATUS.SUCCESS, confidence: result.confidence || 0, error: "" });
      if (onCrExtracted) onCrExtracted(parsed.vehicle || {});
    } catch (error) {
      if (!isCurrentOcrVersion("cr", runId)) return;
      setCrCr(previousState.crCr || emptyVehicle);
      setOcrState("cr", { status: OCR_STATUS.ERROR, confidence: 0, error: error?.message || "Unable to extract CR details." });
    }
  };

  // ── Citizen MVC Upload ──────────────────────────────────────────────────────

  const handleMvcUpload = async (file, preview) => {
    setMvcPreview(preview);
    setMvcFileName(file?.name || "");
    setCitizenValidationState(VALIDATION_STATE.PENDING);
    setCitizenValidationMessage("Awaiting DCI validation.");
    if (!file) {
      setOcrState("mvc", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("mvc");
    const previousState = { ...mvcData };
    setOcrState("mvc", { status: OCR_STATUS.EXTRACTING, confidence: 0, error: "" });

    try {
      const result = await extractClearanceDocumentData(file, CLEARANCE_OCR_DOCUMENT_TYPE.MVC);
      if (!isCurrentOcrVersion("mvc", runId)) return;

      const parsed = result.fields || {};
      const next = {
        mvcNo:     String(parsed.mvcNo     || previousState.mvcNo     || "").toUpperCase(),
        issueDate: String(parsed.mvcIssueDate || previousState.issueDate || "").toUpperCase(),
        engineNo:  String(parsed.engineNo  || parsed.engineNumber  || previousState.engineNo  || "").toUpperCase(),
        chassisNo: String(parsed.chassisNo || parsed.chassisNumber || previousState.chassisNo || "").toUpperCase(),
        plateNo:   String(parsed.plateNo   || parsed.plateNumber   || previousState.plateNo   || "").toUpperCase(),
        mvFileNo:  String(parsed.mvFileNo  || parsed.mvFileNumber  || previousState.mvFileNo  || "").toUpperCase(),
        color:     String(parsed.color     || previousState.color  || "").toUpperCase(),
      };
      setMvcData(next);
      setOcrState("mvc", { status: OCR_STATUS.SUCCESS, confidence: result.confidence || 0, error: "" });
      saveCitizenRequest({
        currentStep: 5,
        status: "MVC_MEC_VALIDATION_PENDING",
        mvcData: next,
        mvcMecValidationState: VALIDATION_STATE.PENDING,
        mvcMecValidationMessage: "Awaiting DCI validation.",
        mvcPreview: preview,
        mvcFileName: file.name,
      });
    } catch (error) {
      if (!isCurrentOcrVersion("mvc", runId)) return;
      setMvcData(previousState);
      setOcrState("mvc", { status: OCR_STATUS.ERROR, confidence: 0, error: error?.message || "Unable to extract MVC details." });
    }
  };

  // ── Citizen MEC Upload ──────────────────────────────────────────────────────

  const handleMecUpload = async (file, preview) => {
    setMecPreview(preview);
    setMecFileName(file?.name || "");
    setCitizenValidationState(VALIDATION_STATE.PENDING);
    setCitizenValidationMessage("Awaiting DCI validation.");
    if (!file) {
      setOcrState("mec", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("mec");
    const previousState = { ...mecData };
    setOcrState("mec", { status: OCR_STATUS.EXTRACTING, confidence: 0, error: "" });

    try {
      const result = await extractClearanceDocumentData(file, CLEARANCE_OCR_DOCUMENT_TYPE.MEC);
      if (!isCurrentOcrVersion("mec", runId)) return;

      const parsed = result.fields || {};
      const next = {
        engineNoStencilled:  String(parsed.engineNoStencilled  || parsed.engineNo  || parsed.engineNumber  || previousState.engineNoStencilled  || "").toUpperCase(),
        chassisNoStencilled: String(parsed.chassisNoStencilled || parsed.chassisNo || parsed.chassisNumber || previousState.chassisNoStencilled || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        color:   String(parsed.color   || previousState.color || "").toUpperCase(),
      };
      setMecData(next);
      setOcrState("mec", { status: OCR_STATUS.SUCCESS, confidence: result.confidence || 0, error: "" });
      saveCitizenRequest({
        currentStep: 5,
        status: "MVC_MEC_VALIDATION_PENDING",
        mecData: next,
        mvcMecValidationState: VALIDATION_STATE.PENDING,
        mvcMecValidationMessage: "Awaiting DCI validation.",
        mecPreview: preview,
        mecFileName: file.name,
      });
    } catch (error) {
      if (!isCurrentOcrVersion("mec", runId)) return;
      setMecData(previousState);
      setOcrState("mec", { status: OCR_STATUS.ERROR, confidence: 0, error: error?.message || "Unable to extract MEC details." });
    }
  };

  // ── Agent MVC Upload ────────────────────────────────────────────────────────

  const handleAgentMvcUpload = async (file, preview) => {
    setAgentMvcPreview(preview);
    setAgentMvcFileName(file?.name || "");
    if (!file) {
      setOcrState("agentMvc", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("agentMvc");
    const previousState = { ...agentMvcData };
    setOcrState("agentMvc", { status: OCR_STATUS.EXTRACTING, confidence: 0, error: "" });

    try {
      const result = await extractClearanceDocumentData(file, CLEARANCE_OCR_DOCUMENT_TYPE.MVC);
      if (!isCurrentOcrVersion("agentMvc", runId)) return;

      const parsed = result.fields || {};
      setAgentMvcData({
        mvcNo:     String(parsed.mvcNo     || previousState.mvcNo     || "").toUpperCase(),
        issueDate: String(parsed.mvcIssueDate || previousState.issueDate || "").toUpperCase(),
        engineNo:  String(parsed.engineNo  || parsed.engineNumber  || previousState.engineNo  || "").toUpperCase(),
        chassisNo: String(parsed.chassisNo || parsed.chassisNumber || previousState.chassisNo || "").toUpperCase(),
        plateNo:   String(parsed.plateNo   || parsed.plateNumber   || previousState.plateNo   || "").toUpperCase(),
        mvFileNo:  String(parsed.mvFileNo  || parsed.mvFileNumber  || previousState.mvFileNo  || "").toUpperCase(),
        color:     String(parsed.color     || previousState.color  || "").toUpperCase(),
      });
      setOcrState("agentMvc", { status: OCR_STATUS.SUCCESS, confidence: result.confidence || 0, error: "" });
    } catch (error) {
      if (!isCurrentOcrVersion("agentMvc", runId)) return;
      setAgentMvcData(previousState);
      setOcrState("agentMvc", { status: OCR_STATUS.ERROR, confidence: 0, error: error?.message || "Unable to extract MVC details." });
    }
  };

  // ── Agent MEC Upload ────────────────────────────────────────────────────────

  const handleAgentMecUpload = async (file, preview) => {
    setAgentMecPreview(preview);
    setAgentMecFileName(file?.name || "");
    if (!file) {
      setOcrState("agentMec", { status: OCR_STATUS.IDLE, confidence: 0, error: "" });
      return;
    }

    const runId = nextOcrVersion("agentMec");
    const previousState = { ...agentMecData };
    setOcrState("agentMec", { status: OCR_STATUS.EXTRACTING, confidence: 0, error: "" });

    try {
      const result = await extractClearanceDocumentData(file, CLEARANCE_OCR_DOCUMENT_TYPE.MEC);
      if (!isCurrentOcrVersion("agentMec", runId)) return;

      const parsed = result.fields || {};
      setAgentMecData({
        engineNoStencilled:  String(parsed.engineNoStencilled  || parsed.engineNo  || parsed.engineNumber  || previousState.engineNoStencilled  || "").toUpperCase(),
        chassisNoStencilled: String(parsed.chassisNoStencilled || parsed.chassisNo || parsed.chassisNumber || previousState.chassisNoStencilled || "").toUpperCase(),
        plateNo: String(parsed.plateNo || parsed.plateNumber || previousState.plateNo || "").toUpperCase(),
        color:   String(parsed.color   || previousState.color || "").toUpperCase(),
      });
      setOcrState("agentMec", { status: OCR_STATUS.SUCCESS, confidence: result.confidence || 0, error: "" });
    } catch (error) {
      if (!isCurrentOcrVersion("agentMec", runId)) return;
      setAgentMecData(previousState);
      setOcrState("agentMec", { status: OCR_STATUS.ERROR, confidence: 0, error: error?.message || "Unable to extract MEC details." });
    }
  };

  return {
    ocrUploadState,
    setOcrState,
    nextOcrVersion,
    isCurrentOcrVersion,
    handleOrUpload,
    handleCrUpload,
    handleMvcUpload,
    handleMecUpload,
    handleAgentMvcUpload,
    handleAgentMecUpload,
  };
};
