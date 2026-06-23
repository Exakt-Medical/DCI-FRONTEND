import { useClearanceRequestFlow } from "../../hooks/useClearanceRequestFlow";
import {
  isDocumentComplete,
  OR_EXPECTED_FIELDS,
  CR_EXPECTED_FIELDS,
  getMissingFieldsText,
} from "./utils/clearanceHelpers";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  Upload,
  FileText,
  CreditCard,
  Ticket,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  X,
} from "lucide-react";
import { VOUCHER_INVENTORY_STATUS } from "../../constants/voucherInventoryStatus";
import {
  AGENT_STEPS,
  CITIZEN_STEPS,
  HPG_STATUS,
  VALIDATION_STATE,
} from "../../constants/clearanceRequestConfig";
import { voucherInventoryService } from "../../services/voucherInventoryService";
import {
  MvcMecUploadCard,
  VehicleDocumentUploadCard,
} from "./components/FlowFormCards";
import { AgentQueueStaging } from "./components/AgentQueueStaging";
import { CertificateActionButtons } from "./components/CertificateActionButtons";
import {
  CLEARANCE_OCR_DOCUMENT_TYPE,
  extractClearanceDocumentData,
  formatOcrHint,
  OCR_STATUS,
} from "../../hooks/useOcrForm";
import { generateClearanceCertificatePDF } from "./utils/generateClearanceCertificatePDF";
import { verificationService } from "../../services/verificationService";
import { useAlert } from "../../hooks/useAlert";
import paymentsService from "../../services/paymentsService";
import merchantCallbackService from "../../services/merchantCallbackService";
import { transferVoucherService } from "../../services/transferVoucherService";

export const ClearanceRequestFlow = () => {
  const {
    showError,
    role,
    availableVoucherRequests,
    setAvailableVoucherRequests,
    loadAllRequests,
    location,
    navigate,
    searchParams,
    idFromQuery,
    paymentTransactionId,
    selectedRequest,
    onCancel,
    isAgent,
    flowSteps,
    maxStep,
    handledPaymentTransactionRef,
    id,
    setId,
    step,
    setStep,
    requestStatus,
    setRequestStatus,
    dateCreated,
    orPreview,
    setOrPreview,
    orNumber,
    setOrNumber,
    orCr,
    setOrCr,
    crPreview,
    setCrPreview,
    crNumber,
    setCrNumber,
    crCr,
    setCrCr,
    processingPayment,
    setProcessingPayment,
    isVerifyingDocuments,
    setIsVerifyingDocuments,
    paymentDone,
    setPaymentDone,
    issuingVoucher,
    setIssuingVoucher,
    fetchVoucherFailed,
    setFetchVoucherFailed,
    voucherCode,
    setVoucherCode,
    voucherAssigned,
    setVoucherAssigned,
    hpgVerified,
    setHpgVerified,
    mvcPreview,
    setMvcPreview,
    mvcFileName,
    setMvcFileName,
    mvcData,
    setMvcData,
    mecPreview,
    setMecPreview,
    mecFileName,
    setMecFileName,
    mecData,
    setMecData,
    agentMvcPreview,
    setAgentMvcPreview,
    agentMvcFileName,
    setAgentMvcFileName,
    agentMvcData,
    setAgentMvcData,
    agentMecPreview,
    setAgentMecPreview,
    agentMecFileName,
    setAgentMecFileName,
    agentMecData,
    setAgentMecData,
    agentMvcMecId,
    setAgentMvcMecId,
    isIssuingBulk,
    setIsIssuingBulk,
    isIssuingCertificate,
    setIsIssuingCertificate,
    certificateNo,
    setCertificateNo,
    selectedMvcMecIds,
    setSelectedMvcMecIds,
    citizenValidationState,
    setCitizenValidationState,
    citizenValidationMessage,
    setCitizenValidationMessage,
    ocrUploadState,
    setOcrUploadState,
    ocrUploadVersionRef,
    queueRows,
    setQueueRows,
    getMismatches,
    mismatches,
    hasMismatch,
    updateOrCr,
    updateCrCr,
    isResume,
    fallbackRows,
    certificationQueue,
    pendingMvcMecRows,
    selectableMvcMecRows,
    getQueueTimestamp,
    clearOrCrForm,
    nextOcrVersion,
    isCurrentOcrVersion,
    setOcrState,
    persistRow,
    saveCitizenRequest,
    handleOrUpload,
    handleCrUpload,
    updateVoucherInventory,
    setHpgForRow,
    setHpgForAll,
    uploadMvcMecForRow,
    uploadMvcMecForAll,
    validateMvcMecForRow,
    validateSelectedMvcMecRows,
    toggleSelectedMvcMecRow,
    toggleSelectAllMvcMecRows,
    selectedMvcMecRows,
    allMvcMecSelectableSelected,
    hasSelectedMvcMecRows,
    clearAgentMvcMecForm,
    handleAgentMvcUpload,
    handleAgentMecUpload,
    handleAddAgentMvcMecToQueue,
    validateCitizenMvcMecStep,
    issueCertificatesForAll,
    handleProceedToPayment,
    handleMvcUpload,
    handleMecUpload,
    handleDownload,
    verifyCitizenDocuments,
    isAddingToQueue,
    handleAddToQueue
  } = useClearanceRequestFlow();

  const canNext = () => {
    if (isAgent) {
      if (step === 1) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every((row) => Boolean(row.voucherId))
        );
      }
      if (step === 2) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every(
            (row) => row.hpgStatus === HPG_STATUS.APPROVED,
          )
        );
      }
      if (step === 3) {
        return (
          certificationQueue.length > 0 &&
          certificationQueue.every(
            (row) => row.mvcMecValidationState === VALIDATION_STATE.PASSED,
          )
        );
      }
      return false;
    }

    if (step === 1) {
      const orOk = isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && orNumber && orNumber !== "Extracting...";
      const crOk = isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && crNumber && crNumber !== "Extracting...";
      return Boolean(orOk && crOk && !hasMismatch);
    }
    if (step === 2) return paymentDone;
    if (step === 3) return voucherAssigned;
    if (step === 4) return hpgVerified;
    if (step === 5)
      return (
        isDocumentComplete(mvcData) &&
        isDocumentComplete(mecData) &&
        voucherAssigned
      );
    return false;
  };

  const nextStep = async () => {
    if (step >= maxStep || !canNext()) return;

    if (!isAgent && step === 1) {
      await verifyCitizenDocuments();
      return;
    }

    if (!isAgent && step === 5) {
      await validateCitizenMvcMecStep();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const canPrev = () => {
    if (isAgent) return step > 1;

    if (certificateNo) return false;
    if (processingPayment) return false;
    if (step >= 2) return false;
    return step > 1;
  };

  const prevStep = () => {
    if (!canPrev()) return;
    setStep((prev) => prev - 1);
  };

  const finishBulk = () => {
    onComplete?.({ rows: certificationQueue });
    navigate("/dci-access/requests");
  };

  const finishCitizen = () => {
    onComplete?.({
      id,
      voucherCode,
      certificateNo,
      vehicle: orCr,
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orCr,
      crCr,
      orNumber,
      crNumber,
      dateCreated,
      currentStep: 6,
      status: "CERTIFICATE_ISSUED",
      voucherStatus: "VOUCHER_ISSUED",
      clearanceStatus: "CERTIFICATE_ISSUED",
      clearanceReferenceNo: certificateNo,
      voucherReferenceNo: voucherCode,
    });
    navigate("/dci-access/requests");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">Clearance Request</span>
            <span className="text-xs text-gray-500 ml-auto">
              {role === "agent_fixer" ? "Agent / Fixer" : "Citizen"}
            </span>
          </div>

          <div className="px-6 py-4 bg-[#0059b5]">
            <div className="flex items-center justify-between gap-2">
              {flowSteps.map((label, index) => {
                const idx = index + 1;
                const isCompleted = step > idx;
                const isActive = step === idx;
                return (
                  <div
                    key={label}
                    className="flex-1 text-center relative min-w-0"
                  >
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold
                      ${isCompleted ? "bg-white text-[#0059b5]" : ""}
                      ${isActive ? "bg-white text-[#0059b5] ring-4 ring-white/30" : ""}
                      ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx}
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs mt-2 truncate ${
                        isActive ? "text-white font-medium" : "text-white/60"
                      }`}
                    >
                      {label}
                    </p>
                    {index < flowSteps.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                          isCompleted ? "bg-white" : "bg-white/30"
                        }`}
                        style={{
                          width: "calc(100% - 2rem)",
                          left: "calc(50% + 1rem)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {isAgent && step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <VehicleDocumentUploadCard
                  title="OR"
                  uploadLabel="Upload Official Receipt"
                  onFile={handleOrUpload}
                  preview={orPreview}
                  uploadHint={formatOcrHint(ocrUploadState.or)}
                  numberLabel="OR Number"
                  numberValue={orNumber}
                  onNumberChange={(e) => setOrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from OR"
                  extraInputs={[]}
                  vehicleLabel="Vehicle Details (from OR)"
                  vehicleValues={orCr}
                  vehicleFieldSet="or"
                  onVehicleChange={updateOrCr}
                />

                <VehicleDocumentUploadCard
                  title="CR"
                  uploadLabel="Upload Certificate of Registration"
                  onFile={handleCrUpload}
                  preview={crPreview}
                  uploadHint={formatOcrHint(ocrUploadState.cr)}
                  numberLabel="CR Number"
                  numberValue={crNumber}
                  onNumberChange={(e) => setCrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from CR"
                  vehicleLabel="Vehicle Details (from CR)"
                  vehicleValues={crCr}
                  vehicleFieldSet="cr"
                  onVehicleChange={updateCrCr}
                />
              </div>

              {hasMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Mismatched fields: <strong>{mismatches.join(", ")}</strong>. OR and CR details must match to add queue entry.
                  </p>
                </div>
              )}

              <AgentQueueStaging
                orCr={orCr}
                crCr={crCr}
                orNumber={orNumber}
                crNumber={crNumber}
                hasMismatch={hasMismatch}
                ocrUploadState={ocrUploadState}
                handleAddToQueue={handleAddToQueue}
                certificationQueue={certificationQueue}
              />
            </div>
          )}

          {isAgent && step === 2 && (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    HPG Portal (Bulk)
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setHpgForAll(HPG_STATUS.INSPECTION)}
                  >
                    Mark All Under Inspection
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setHpgForAll(HPG_STATUS.APPROVED)}
                  >
                    Mark All Approved
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Plate
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        HPG Status
                      </th>
                      <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificationQueue.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-2 font-mono text-xs text-gray-700">
                          {row.id}
                        </td>
                        <td className="py-2 text-gray-700">
                          {row.plateNumber || "-"}
                        </td>
                        <td className="py-2 text-gray-700">
                          {row.hpgStatus || HPG_STATUS.PENDING}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setHpgForRow(
                                  row.id,
                                  HPG_STATUS.INSPECTION,
                                )
                              }
                            >
                              Inspection
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                setHpgForRow(row.id, HPG_STATUS.APPROVED)
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                setHpgForRow(row.id, HPG_STATUS.REJECTED)
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {isAgent && step === 3 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Upload size={18} className="text-[#0059b5]" />
                    <h3 className="text-base font-bold text-gray-900">
                      Upload MVCC/MEC (Bulk)
                    </h3>
                  </div>
                  <Button onClick={uploadMvcMecForAll} variant="secondary">
                    Auto Fill All
                  </Button>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                    Select Request
                  </label>
                  <select
                    value={agentMvcMecId}
                    onChange={(e) => setAgentMvcMecId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select request for MVCC/MEC upload</option>
                    {selectableMvcMecRows.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.id} - {row.plateNumber || "NO_PLATE"}
                      </option>
                    ))}
                  </select>
                </div>

                {!agentMvcMecId && (
                  <p className="mb-4 text-xs text-amber-700">
                    No selectable request found. Add a queue entry in step 1
                    first.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MvcMecUploadCard
                    title="MVCC"
                    uploadLabel="Upload Motor Vehicle Clearance Certificate"
                    onFile={handleAgentMvcUpload}
                    preview={agentMvcPreview}
                    uploadHint={formatOcrHint(ocrUploadState.agentMvc)}
                    fields={[
                      {
                      key: "agent-mvc-mvccNo",
                      label: "MVCC Number",
                      value: agentMvcData.mvccNo,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          mvccNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-mvccIssueDate",
                      label: "MVCC Issue Date",
                      value: agentMvcData.mvccIssueDate,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          mvccIssueDate: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-mvccStatus",
                      label: "MVCC Status",
                      value: agentMvcData.mvccStatus,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          mvccStatus: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-remarks",
                      label: "Remarks",
                      value: agentMvcData.remarks,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-mvFileNo",
                      label: "MV File No",
                      value: agentMvcData.mvFileNo,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          mvFileNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-makeType",
                      label: "Make / Type",
                      value: agentMvcData.makeType,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          makeType: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-ownerName",
                      label: "Owner Name",
                      value: agentMvcData.ownerName,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          ownerName: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-ownerAddress",
                      label: "Owner Address",
                      value: agentMvcData.ownerAddress,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          ownerAddress: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-ownerContact",
                      label: "Owner Contact",
                      value: agentMvcData.ownerContact,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          ownerContact: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-engineNo",
                      label: "Engine Number",
                      value: agentMvcData.engineNo,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          engineNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-chassisNo",
                      label: "Chassis Number",
                      value: agentMvcData.chassisNo,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          chassisNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                      {
                      key: "agent-mvc-plateNo",
                      label: "Plate Number",
                      value: agentMvcData.plateNo,
                      onChange: (e) =>
                        setAgentMvcData((prev) => ({
                          ...prev,
                          plateNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    ]}
                  />

                  <MvcMecUploadCard
                    title="MEC"
                    uploadLabel="Upload Motor Vehicle Emission Certificate"
                    onFile={handleAgentMecUpload}
                    preview={agentMecPreview}
                    uploadHint={formatOcrHint(ocrUploadState.agentMec)}
                    fields={[
                      {
                        key: "agent-mec-engineNoStencilled",
                        label: "Engine Number",
                        value: agentMecData.engineNoStencilled,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            engineNoStencilled: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-chassisNoStencilled",
                        label: "Chassis Number",
                        value: agentMecData.chassisNoStencilled,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            chassisNoStencilled: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-plateNo",
                        label: "Plate Number",
                        value: agentMecData.plateNo,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            plateNo: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-color",
                        label: "Color",
                        value: agentMecData.color,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            color: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                      {
                        key: "agent-mec-makeType",
                        label: "Make / Type",
                        value: agentMecData.makeType,
                        onChange: (e) =>
                          setAgentMecData((prev) => ({
                            ...prev,
                            makeType: e.target.value,
                          })),
                        placeholder: "Auto-extracted from MEC",
                      },
                    ]}
                  />
                </div>

                <div className="mt-4">
                  {(!agentMvcMecRequestId || !isDocumentComplete(agentMvcData) || !isDocumentComplete(agentMecData)) && (
                    <div className="mb-3 flex justify-end">
                      <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right">
                        {!agentMvcMecRequestId && <p>• Please select a request from the dropdown</p>}
                        {getMissingFieldsText(agentMvcData, "MVCC")}
                        {getMissingFieldsText(agentMecData, "MEC")}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={validateSelectedMvcMecRows}
                      disabled={!hasSelectedMvcMecRows}
                    >
                      Validate
                    </Button>
                    <Button
                      onClick={handleAddAgentMvcMecToQueue}
                      disabled={
                        !agentMvcMecRequestId ||
                        !isDocumentComplete(agentMvcData) ||
                        !isDocumentComplete(agentMecData)
                      }
                    >
                      Add To MVC/MEC Queue
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    MVC/MEC Upload Queue
                  </h3>
                </div>
                {certificationQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active requests available in queue.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="pb-2 pr-3 w-10">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#0059b5] focus:ring-[#0059b5]"
                              checked={allMvcMecSelectableSelected}
                              onChange={toggleSelectAllMvcMecRows}
                              aria-label="Select all MVC and MEC rows"
                            />
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Request
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Plate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            MVC
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            MEC
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            DCI Validation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 align-middle pr-3">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-[#0059b5] focus:ring-[#0059b5]"
                                checked={selectedMvcMecIds.includes(
                                  row.id,
                                )}
                                onChange={() =>
                                  toggleSelectedMvcMecRow(row.id)
                                }
                                disabled={!row.mvcMecUploaded}
                                aria-label={`Select MVC and MEC row for ${row.id}`}
                              />
                            </td>
                            <td className="py-2 font-mono text-xs text-gray-700">
                              {row.id}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.plateNumber || "-"}
                            </td>
                            <td className="py-2 text-gray-700 font-mono text-xs">
                              {row.mvcData?.mvcNo || "-"}
                            </td>
                            <td className="py-2 text-gray-700 font-mono text-xs">
                              {row.mecData?.engineNoStencilled || "-"}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.mvcMecValidationState ||
                                VALIDATION_STATE.PENDING}
                              {row.mvcMecValidationMessage
                                ? ` - ${row.mvcMecValidationMessage}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {isAgent && step === 4 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Certificate Issuance (Bulk)
                </h3>
              </div>

              {isIssuingBulk ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">
                    DCI portal is issuing certificates...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Certificates are automatically issued by DCI once all
                    MVC/MEC uploads are validated.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="pb-2 w-28" />
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Request
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Plate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Certificate
                          </th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificationQueue.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-2 align-middle">
                              <CertificateActionButtons row={row} />
                            </td>
                            <td className="py-2 font-mono text-xs text-gray-700">
                              {row.id}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.plateNumber || "-"}
                            </td>
                            <td className="py-2 font-mono text-xs font-semibold text-gray-900">
                              {row.certificateNo || "-"}
                            </td>
                            <td className="py-2 text-gray-700">
                              {row.certificateNo
                                ? "CERTIFICATE_ISSUED"
                                : "READY"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {certificationQueue.every((row) => row.certificateNo) && (
                    <Button onClick={finishBulk}>
                      <CheckCircle size={16} /> Complete
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {!isAgent && step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <VehicleDocumentUploadCard
                  title="OR"
                  uploadLabel="Upload Official Receipt"
                  onFile={handleOrUpload}
                  preview={orPreview}
                  uploadHint={formatOcrHint(ocrUploadState.or)}
                  numberLabel="OR Number"
                  numberValue={orNumber}
                  onNumberChange={(e) => setOrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from OR"
                  extraInputs={[]}
                  vehicleLabel="Vehicle Details (from OR)"
                  vehicleValues={orCr}
                  vehicleFieldSet="or"
                  onVehicleChange={updateOrCr}
                />

                <VehicleDocumentUploadCard
                  title="CR"
                  uploadLabel="Upload Certificate of Registration"
                  onFile={handleCrUpload}
                  preview={crPreview}
                  uploadHint={formatOcrHint(ocrUploadState.cr)}
                  numberLabel="CR Number"
                  numberValue={crNumber}
                  onNumberChange={(e) => setCrNumber(e.target.value)}
                  numberPlaceholder="Auto-extracted from CR"
                  vehicleLabel="Vehicle Details (from CR)"
                  vehicleValues={crCr}
                  vehicleFieldSet="cr"
                  onVehicleChange={updateCrCr}
                />
              </div>
              {hasMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">
                    Mismatched fields: <strong>{mismatches.join(", ")}</strong>. OR and CR details must match to proceed.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isAgent && step === 2 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <CreditCard size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Payment</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                <p className="text-sm text-gray-500 mb-1">
                  Certificate Request Fee
                </p>
                <p className="text-3xl font-bold text-gray-900">PHP 60.00</p>
                <p className="text-xs text-gray-500 mt-1">
                  Single payment covers the whole request.
                </p>
              </div>
              {processingPayment ? (
                <div className="text-center py-4">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">
                    Processing payment...
                  </p>
                </div>
              ) : paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle
                    size={24}
                    className="text-green-600 mx-auto mb-2"
                  />
                  <p className="font-semibold text-green-700">
                    Payment Completed
                  </p>
                </div>
              ) : (
                <Button onClick={handleProceedToPayment} className="w-full">
                  <CreditCard size={16} /> Proceed to Payment
                </Button>
              )}
            </Card>
          )}

          {!isAgent && step === 3 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Ticket size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Issue Voucher
                </h3>
              </div>
              {issuingVoucher ? (
                <div className="text-center py-5">
                  <Spinner size="md" />
                  <p className="text-sm text-gray-500 mt-2">
                    Generating voucher...
                  </p>
                </div>
              ) : voucherAssigned ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle
                      size={40}
                      className="text-green-600 mx-auto mb-3"
                    />
                    <p className="font-semibold text-green-700 text-lg">
                      Voucher Issued
                    </p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-2">
                      {voucherCode}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Plate: {orCr.plateNumber}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">
                    Voucher issues automatically after payment.
                  </p>
                </div>
              )}
            </Card>
          )}

            {!isAgent && step === 4 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    HPG Verification Status
                  </h3>
                </div>
                {hpgVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-3 animate-bounce" />
                    <p className="font-bold text-green-700 text-lg">
                      HPG Verified
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your vehicle has been successfully verified by HPG.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Voucher Code: <span className="font-mono font-semibold">{voucherCode}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                      <Spinner size="md" className="text-amber-600" />
                    </div>
                    <p className="font-bold text-amber-700 text-lg">
                      Verify your voucher code to HPG
                    </p>
                    <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                      Please present your voucher code to the HPG officer for physical inspection and verification.
                    </p>
                    <div className="mt-4 inline-block bg-white border border-amber-300 rounded-lg px-4 py-2 shadow-sm">
                      <span className="text-xs text-gray-500 block">VOUCHER CODE</span>
                      <span className="text-base font-mono font-bold text-gray-900 tracking-wider">
                        {voucherCode}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 animate-pulse">
                      Waiting for HPG officer verification...
                    </p>
                  </div>
                )}
              </Card>
            )}

          {!isAgent && step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MvcMecUploadCard
                  title="MVCC"
                  uploadLabel="Upload Motor Vehicle Clearance Certificate"
                  onFile={handleMvcUpload}
                  preview={mvcPreview}
                  uploadHint={formatOcrHint(ocrUploadState.mvc)}
                  fields={[
                    {
                      key: "citizen-mvc-mvccNo",
                      label: "MVCC Number",
                      value: mvcData.mvccNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvccNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                                        {
                      key: "citizen-mvc-engineNo",
                      label: "Engine Number",
                      value: mvcData.engineNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          engineNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-chassisNo",
                      label: "Chassis Number",
                      value: mvcData.chassisNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          chassisNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-plateNo",
                      label: "Plate Number",
                      value: mvcData.plateNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          plateNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-mvccIssueDate",
                      label: "MVCC Issue Date",
                      value: mvcData.mvccIssueDate,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvccIssueDate: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-mvccStatus",
                      label: "MVCC Status",
                      value: mvcData.mvccStatus,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvccStatus: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-remarks",
                      label: "Remarks",
                      value: mvcData.remarks,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-mvFileNo",
                      label: "MV File No",
                      value: mvcData.mvFileNo,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          mvFileNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-makeType",
                      label: "Make / Type",
                      value: mvcData.makeType,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          makeType: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-color",
                      label: "Color",
                      value: mvcData.color,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-ownerName",
                      label: "Owner Name",
                      value: mvcData.ownerName,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          ownerName: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-ownerAddress",
                      label: "Owner Address",
                      value: mvcData.ownerAddress,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          ownerAddress: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                    {
                      key: "citizen-mvc-ownerContact",
                      label: "Owner Contact",
                      value: mvcData.ownerContact,
                      onChange: (e) =>
                        setMvcData((prev) => ({
                          ...prev,
                          ownerContact: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MVCC",
                    },
                  ]}
                />

                <MvcMecUploadCard
                  title="MEC"
                  uploadLabel="Upload Motor Vehicle Emission Certificate"
                  onFile={handleMecUpload}
                  preview={mecPreview}
                  uploadHint={formatOcrHint(ocrUploadState.mec)}
                  fields={[
                    {
                      key: "citizen-mec-engineNoStencilled",
                      label: "Engine Number",
                      value: mecData.engineNoStencilled,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          engineNoStencilled: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-chassisNoStencilled",
                      label: "Chassis Number",
                      value: mecData.chassisNoStencilled,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          chassisNoStencilled: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-plateNo",
                      label: "Plate Number",
                      value: mecData.plateNo,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          plateNo: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-color",
                      label: "Color",
                      value: mecData.color,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                    {
                      key: "citizen-mec-makeType",
                      label: "Make / Type",
                      value: mecData.makeType,
                      onChange: (e) =>
                        setMecData((prev) => ({
                          ...prev,
                          makeType: e.target.value,
                        })),
                      placeholder: "Auto-extracted from MEC",
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {!isAgent && step === 6 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Issue Certificate
                </h3>
              </div>
              {isIssuingCertificate ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">
                    DCI portal is issuing certificate...
                  </p>
                </div>
              ) : certificateNo ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle
                    size={40}
                    className="text-green-600 mx-auto mb-3"
                  />
                  <p className="font-semibold text-green-700 text-lg">
                    Certificate Issued
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">
                    {certificateNo}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Plate: {orCr.plateNumber}
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={handleDownload} variant="outline">
                      <Download size={16} /> Download
                    </Button>
                    <Button onClick={finishCitizen}>
                      <CheckCircle size={16} /> Complete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Certificate issuance starts automatically after successful
                    MVC/MEC validation.
                  </p>
                </div>
              )}
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <div>
              {step === 1 && (
                <Button variant="ghost" onClick={onCancel}>
                  <X size={16} /> Cancel
                </Button>
              )}
            </div>
            {step < flowSteps.length ? (
              <div className="flex items-center gap-3">
                {!canNext() && step === 1 && !isAgent && (ocrUploadState?.or?.status !== OCR_STATUS.IDLE || ocrUploadState?.cr?.status !== OCR_STATUS.IDLE) && (
                  <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                    {(!orNumber || orNumber === "Extracting...") && <p>• Missing OR Number</p>}
                    {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS)}</p>}
                    {(!crNumber || crNumber === "Extracting...") && <p>• Missing CR Number</p>}
                    {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS)}</p>}
                  </div>
                )}
                {!canNext() && step === 5 && !isAgent && (ocrUploadState?.mvc?.status !== OCR_STATUS.IDLE || ocrUploadState?.mec?.status !== OCR_STATUS.IDLE) && (
                  <div className="text-[11px] text-red-600 space-y-0.5 font-medium text-right mr-2">
                    {getMissingFieldsText(mvcData, "MVCC") && <p>• {getMissingFieldsText(mvcData, "MVCC")}</p>}
                    {getMissingFieldsText(mecData, "MEC") && <p>• {getMissingFieldsText(mecData, "MEC")}</p>}
                  </div>
                )}
                <Button onClick={nextStep} disabled={!canNext() || isVerifyingDocuments}>
                  {isVerifyingDocuments ? "Verifying..." : "Next"} <ChevronRight size={16} />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
