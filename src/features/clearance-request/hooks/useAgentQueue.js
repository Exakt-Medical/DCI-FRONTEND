import { useEffect, useMemo, useState } from "react";
import { voucherInventoryService } from "../../../services/voucherInventoryService";
import { VOUCHER_INVENTORY_STATUS } from "../../../constants/voucherInventoryStatus";
import { HPG_STATUS, VALIDATION_STATE } from "../../../constants/clearanceRequestConfig";
import { isDocumentComplete, evaluateMvcMecValidation } from "../utils/clearanceRequestUtils";

/**
 * useAgentQueue
 *
 * Owns all agent-side certification queue state and operations:
 *  - Staging queue rows (add, persist, HPG status, MVC/MEC upload, validate, issue)
 *  - Voucher auto-assignment from inventory
 *  - MVC/MEC row selection management
 */
export const useAgentQueue = ({
  isAgent,
  role,
  step,
  selectedRequest,
  availableVoucherRequests,
  voucherInventory,
  setVoucherInventory,
  onSaveRequest,
  showError,
  orCr,
  crCr,
  orNumber,
  crNumber,
  orPreview,
  crPreview,
  hasMismatch,
  setOrPreview,
  setCrPreview,
  setOrNumber,
  setCrNumber,
  setOrCr,
  setCrCr,
  setOcrUploadState,
  emptyOcrUploadState,
  clearOrCrFormCallback,   // called after clearing OR/CR form; can be null
}) => {
  // ── Queue rows state ────────────────────────────────────────────────────────

  const [queueRows, setQueueRows] = useState(() => {
    if (!isAgent) return [];
    if (selectedRequest?.id) {
      return [
        {
          ...selectedRequest,
          hpgStatus: selectedRequest.hpgStatus || HPG_STATUS.PENDING,
          mvcMecUploaded: Boolean(
            selectedRequest.mvcData?.mvcNo && selectedRequest.mecData?.engineNoStencilled
          ),
        },
      ];
    }
    return [];
  });

  const [selectedMvcMecIds, setSelectedMvcMecIds] = useState([]);
  const [isIssuingBulk, setIsIssuingBulk] = useState(false);

  // ── Derived queue data ──────────────────────────────────────────────────────

  const fallbackRows = useMemo(() => {
    if (!isAgent || !selectedRequest?.id) return [];
    return availableVoucherRequests
      .filter(
        (item) =>
          item.status !== "CERTIFICATE_ISSUED" &&
          item.clearanceStatus !== "CERTIFICATE_ISSUED"
      )
      .map((item) => ({
        ...item,
        hpgStatus: item.hpgStatus || HPG_STATUS.PENDING,
        mvcMecUploaded: Boolean(item.mvcData?.mvcNo && item.mecData?.engineNoStencilled),
      }));
  }, [availableVoucherRequests, isAgent, selectedRequest?.id]);

  const certificationQueue = queueRows.length > 0 ? queueRows : fallbackRows;

  const pendingMvcMecRows = useMemo(
    () => certificationQueue.filter((row) => !row.mvcMecUploaded),
    [certificationQueue]
  );

  const selectableMvcMecRows = useMemo(
    () =>
      certificationQueue.filter(
        (row) =>
          row.status !== "CERTIFICATE_ISSUED" &&
          row.clearanceStatus !== "CERTIFICATE_ISSUED"
      ),
    [certificationQueue]
  );

  const getQueueTimestamp = (row) => {
    const requestTs = Number(String(row?.id || "").split("-")[1]);
    if (Number.isFinite(requestTs)) return requestTs;
    const createdTs = Date.parse(row?.dateCreated || "");
    if (Number.isFinite(createdTs)) return createdTs;
    return Number.MAX_SAFE_INTEGER;
  };

  const selectedMvcMecRows = certificationQueue.filter((row) =>
    selectedMvcMecIds.includes(row.id)
  );
  const allMvcMecSelectableSelected =
    certificationQueue.some((row) => row.mvcMecUploaded) &&
    certificationQueue
      .filter((row) => row.mvcMecUploaded)
      .every((row) => selectedMvcMecIds.includes(row.id));
  const hasSelectedMvcMecRows = selectedMvcMecRows.length > 0;

  // Keep selectedMvcMecIds valid when queue changes
  useEffect(() => {
    const validIds = new Set(certificationQueue.map((row) => row.id));
    setSelectedMvcMecIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [certificationQueue]);

  // ── Persist helper ──────────────────────────────────────────────────────────

  const persistRow = async (row) => {
    if (onSaveRequest) {
      const resObj = await onSaveRequest({
        ...row,
        id: row.id,
        plateNumber: row.plateNumber || row.orCr?.plateNumber || "",
        voucherReferenceNo: row.voucherReferenceNo || "",
        voucherStatus: row.voucherId ? "VOUCHER_ISSUED" : "PENDING_ASSIGNMENT",
        hpgVerified: row.hpgStatus === HPG_STATUS.APPROVED,
        mvcData: row.mvcData || {},
        mecData: row.mecData || {},
        currentStep: row.currentStep || step,
        status: row.status || "OR_CR_UPLOADED",
        clearanceStatus: row.clearanceStatus || "",
        certificateNo: row.certificateNo || "",
      });
      const savedId = resObj?.id || resObj;
      if (resObj?.certificateNo && row.certificateNo !== resObj.certificateNo) {
        setQueueRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, certificateNo: resObj.certificateNo, clearanceReferenceNo: resObj.certificateNo, clearanceStatus: "CERTIFICATE_ISSUED" }
              : r
          )
        );
      }
      return savedId;
    }
    return row.id;
  };

  // ── Voucher inventory helper ─────────────────────────────────────────────────

  const updateVoucherInventory = (updater) => {
    if (!setVoucherInventory) return;
    setVoucherInventory((prev) =>
      updater(Array.isArray(prev) ? prev : voucherInventory)
    );
  };

  // ── Add OR/CR to queue ──────────────────────────────────────────────────────

  const OR_EXPECTED_FIELDS = ["plateNumber","mvFileNumber","classification","vehicleType","fuelType","yearModel","color","ownerName","ownerAddress"];
  const CR_EXPECTED_FIELDS = ["plateNumber","mvFileNumber","engineNumber","chassisNumber","make","series","yearModel","color","ownerName","ownerAddress"];

  const clearOrCrForm = () => {
    setOrPreview(null);
    setOrNumber("");
    setOrCr({ plateNumber:"",mvFileNumber:"",classification:"",vehicleType:"",fuelType:"",engineNumber:"",chassisNumber:"",make:"",series:"",yearModel:"",color:"",ownerName:"",ownerAddress:"" });
    setCrPreview(null);
    setCrNumber("");
    setCrCr({ plateNumber:"",mvFileNumber:"",classification:"",vehicleType:"",fuelType:"",engineNumber:"",chassisNumber:"",make:"",series:"",yearModel:"",color:"",ownerName:"",ownerAddress:"" });
    if (setOcrUploadState) {
      setOcrUploadState((prev) => ({
        ...prev,
        or: emptyOcrUploadState.or,
        cr: emptyOcrUploadState.cr,
      }));
    }
    clearOrCrFormCallback?.();
  };

  const handleAddToQueue = async () => {
    if (!isAgent) return;
    const orOk = isDocumentComplete(orCr, OR_EXPECTED_FIELDS) && orNumber && orNumber !== "Extracting...";
    const crOk = isDocumentComplete(crCr, CR_EXPECTED_FIELDS) && crNumber && crNumber !== "Extracting...";
    if (!(orOk && crOk && !hasMismatch)) return;

    const normalizeStr = (str) => (str || "").trim().toUpperCase();
    const newPlate = normalizeStr(orCr.plateNumber || crCr.plateNumber || "");

    const isDuplicate = certificationQueue.some((row) => {
      const existingPlate = normalizeStr(row.plateNumber || row.orCr?.plateNumber || row.crCr?.plateNumber || "");
      return newPlate && existingPlate && newPlate === existingPlate;
    });

    if (isDuplicate) {
      await showError("Duplicate Entry", "An entry with the same Plate Number already exists in the staging queue.");
      return;
    }

    const row = {
      role,
      dateCreated: new Date().toISOString().split("T")[0],
      currentStep: 1,
      status: "OR_CR_UPLOADED",
      voucherStatus: "PENDING_ASSIGNMENT",
      clearanceStatus: "",
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orNumber,
      crNumber,
      orCr,
      crCr,
      orPreview,
      crPreview,
      hpgStatus: HPG_STATUS.PENDING,
      mvcMecUploaded: false,
    };

    const newId = await persistRow(row);
    row.id = newId;
    setQueueRows((prev) => [row, ...prev]);
    clearOrCrForm();
  };

  // ── HPG status helpers ──────────────────────────────────────────────────────

  const setHpgForRow = (idForRow, nextStatus) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.id !== idForRow) return row;
        const statusMap = {
          [HPG_STATUS.PENDING]:    "PENDING_HPG",
          [HPG_STATUS.INSPECTION]: "UNDER_INSPECTION",
          [HPG_STATUS.APPROVED]:   "HPG_VERIFIED",
          [HPG_STATUS.REJECTED]:   "HPG_REJECTED",
        };
        const updated = {
          ...row,
          hpgStatus: nextStatus,
          hpgVerified: nextStatus === HPG_STATUS.APPROVED,
          status: statusMap[nextStatus],
          currentStep: 2,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const setHpgForAll = (nextStatus) => {
    certificationQueue.forEach((row) => setHpgForRow(row.id, nextStatus));
  };

  // ── MVC/MEC upload helpers ──────────────────────────────────────────────────

  const uploadMvcMecForRow = (idForRow, uploadPayload = {}) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.id !== idForRow) return row;
        const nextMvcData = {
          engineNo:  row.engineNumber || row.orCr?.engineNumber  || row.crCr?.engineNumber  || "",
          chassisNo: row.chassisNumber|| row.orCr?.chassisNumber || row.crCr?.chassisNumber || "",
          plateNo:   row.plateNumber  || "",
          color:     row.color        || row.orCr?.color         || row.crCr?.color         || "",
        };
        const nextMecData = {
          engineNoStencilled:  row.engineNumber || row.orCr?.engineNumber  || row.crCr?.engineNumber  || "",
          chassisNoStencilled: row.chassisNumber|| row.orCr?.chassisNumber || row.crCr?.chassisNumber || "",
          plateNo: row.plateNumber || "",
          color:   row.color || row.orCr?.color || row.crCr?.color || "",
        };
        const updated = {
          ...row,
          mvcMecUploaded: true,
          mvcMecValidationState: VALIDATION_STATE.PENDING,
          mvcMecValidationMessage: "Awaiting DCI validation.",
          mvcData: nextMvcData,
          mecData: nextMecData,
          mvcPreview:   uploadPayload.mvcPreview   || row.mvcPreview   || null,
          mecPreview:   uploadPayload.mecPreview   || row.mecPreview   || null,
          mvcFileName:  uploadPayload.mvcFileName  || row.mvcFileName  || "",
          mecFileName:  uploadPayload.mecFileName  || row.mecFileName  || "",
          status: "MVC_MEC_VALIDATION_PENDING",
          currentStep: 3,
        };
        persistRow(updated);
        return updated;
      });
    });
  };

  const uploadMvcMecForAll = () => {
    certificationQueue.forEach((row) => uploadMvcMecForRow(row.id));
  };

  // ── MVC/MEC validation ──────────────────────────────────────────────────────

  const validateMvcMecForRow = (idForRow) => {
    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      return source.map((row) => {
        if (row.id !== idForRow) return row;
        const validating = {
          ...row,
          mvcMecValidationState: VALIDATION_STATE.VALIDATING,
          mvcMecValidationMessage: "DCI validation in progress...",
          status: "MVC_MEC_VALIDATING",
        };
        persistRow(validating);
        return validating;
      });
    });

    setTimeout(() => {
      setQueueRows((prev) => {
        const source = prev.length > 0 ? prev : fallbackRows;
        return source.map((row) => {
          if (row.id !== idForRow) return row;
          const targetVehicle = row.orCr || row.crCr || row;
          const validation = evaluateMvcMecValidation(row.mvcData, row.mecData, {
            ...targetVehicle,
            verificationStatus: targetVehicle.verificationStatus || row.verificationStatus,
          });
          const validated = {
            ...row,
            mvcMecValidationState: validation.valid ? VALIDATION_STATE.PASSED : VALIDATION_STATE.FAILED,
            mvcMecValidationMessage: validation.reason,
            status: validation.valid ? "MVC_MEC_VALIDATED" : "MVC_MEC_VALIDATION_PENDING",
            currentStep: 3,
          };
          persistRow(validated);
          return validated;
        });
      });
    }, 1300);
  };

  const validateSelectedMvcMecRows = () => {
    selectedMvcMecIds.forEach((idForRow) => validateMvcMecForRow(idForRow));
    setSelectedMvcMecIds([]);
  };

  // ── MVC/MEC selection helpers ───────────────────────────────────────────────

  const toggleSelectedMvcMecRow = (idForRow) => {
    setSelectedMvcMecIds((prev) =>
      prev.includes(idForRow) ? prev.filter((id) => id !== idForRow) : [...prev, idForRow]
    );
  };

  const toggleSelectAllMvcMecRows = () => {
    const selectableIds = certificationQueue
      .filter((row) => row.mvcMecUploaded)
      .map((row) => row.id);
    setSelectedMvcMecIds((prev) =>
      prev.length === selectableIds.length && selectableIds.length > 0 ? [] : selectableIds
    );
  };

  // ── Add agent MVC/MEC upload to queue ──────────────────────────────────────

  const handleAddAgentMvcMecToQueue = (agentMvcMecId, agentMvcData, agentMecData, agentMvcPreview, agentMecPreview, agentMvcFileName, agentMecFileName, clearFormCb) => {
    if (!agentMvcMecId) return;
    if (!isDocumentComplete(agentMvcData) || !isDocumentComplete(agentMecData)) return;
    uploadMvcMecForRow(agentMvcMecId, {
      mvcData: agentMvcData, mecData: agentMecData,
      mvcPreview: agentMvcPreview, mecPreview: agentMecPreview,
      mvcFileName: agentMvcFileName, mecFileName: agentMecFileName,
    });
    clearFormCb?.();
  };

  // ── Issue certificates for all validated rows ───────────────────────────────

  const issueCertificatesForAll = () => {
    if (isIssuingBulk) return;
    setIsIssuingBulk(true);

    setTimeout(() => {
      setQueueRows((prev) => {
        const source = prev.length > 0 ? prev : fallbackRows;
        const next = source.map((row) => {
          if (row.certificateNo) return row;
          const updated = {
            ...row,
            certificateNo: "",
            clearanceReferenceNo: "",
            clearanceStatus: "CERTIFICATE_ISSUED",
            status: "CERTIFICATE_ISSUED",
            currentStep: 4,
          };
          persistRow(updated);
          return updated;
        });

        updateVoucherInventory((inventoryRows) =>
          next.reduce((acc, row) => {
            if (!row.voucherId) return acc;
            return voucherInventoryService.markVoucherUsed(acc, { voucherId: row.voucherId, id: row.id });
          }, inventoryRows)
        );

        return next;
      });

      setIsIssuingBulk(false);
    }, 1200);
  };

  // ── Auto-issue when all rows validated ─────────────────────────────────────

  useEffect(() => {
    if (!isAgent || step !== 4 || isIssuingBulk) return;
    const allValidated =
      certificationQueue.length > 0 &&
      certificationQueue.every((row) => row.mvcMecValidationState === VALIDATION_STATE.PASSED);
    const hasPendingCert = certificationQueue.some((row) => !row.certificateNo);
    if (allValidated && hasPendingCert) issueCertificatesForAll();
  }, [certificationQueue, isAgent, isIssuingBulk, step]);

  // ── Auto-assign vouchers from inventory ─────────────────────────────────────

  useEffect(() => {
    if (!isAgent) return;

    const rowsInOrder = [...certificationQueue].sort((a, b) => getQueueTimestamp(a) - getQueueTimestamp(b));
    const rowsNeedingVoucher = rowsInOrder.filter((row) => !row.voucherId);
    if (rowsNeedingVoucher.length === 0) return;

    const availableVouchers = [...voucherInventory]
      .filter((item) => item.inventoryStatus === VOUCHER_INVENTORY_STATUS.AVAILABLE)
      .sort((a, b) => Date.parse(a.dateCreated || "") - Date.parse(b.dateCreated || ""));
    if (availableVouchers.length === 0) return;

    const pairCount = Math.min(rowsNeedingVoucher.length, availableVouchers.length);
    const assignments = Array.from({ length: pairCount }, (_, index) => ({
      id:           rowsNeedingVoucher[index].id,
      plateNumber:  rowsNeedingVoucher[index].plateNumber || "",
      voucherId:    availableVouchers[index].voucherId,
      voucherCode:  availableVouchers[index].voucherCode,
    }));
    if (assignments.length === 0) return;

    updateVoucherInventory((prev) =>
      assignments.reduce(
        (inventoryRows, assignment) =>
          voucherInventoryService.assignVoucherToRequest(inventoryRows, {
            voucherId:    assignment.voucherId,
            id:           assignment.id,
            plateNumber:  assignment.plateNumber,
            assignedBy:   role,
          }),
        prev
      )
    );

    const assignmentByRequest = assignments.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

    setQueueRows((prev) => {
      const source = prev.length > 0 ? prev : fallbackRows;
      let changed = false;
      const next = source.map((row) => {
        const assignment = assignmentByRequest[row.id];
        if (!assignment || row.voucherId) return row;
        changed = true;
        const updated = {
          ...row,
          voucherId:          assignment.voucherId,
          voucherReferenceNo: assignment.voucherCode,
          voucherStatus:      "VOUCHER_ISSUED",
          status:             "VOUCHER_ASSIGNED",
          currentStep:        Math.max(row.currentStep || 1, 2),
        };
        persistRow(updated);
        return updated;
      });
      return changed ? next : prev;
    });
  }, [certificationQueue, fallbackRows, isAgent, role, voucherInventory]);

  return {
    // state
    queueRows,
    setQueueRows,
    selectedMvcMecIds,
    setSelectedMvcMecIds,
    isIssuingBulk,
    // derived
    certificationQueue,
    fallbackRows,
    pendingMvcMecRows,
    selectableMvcMecRows,
    selectedMvcMecRows,
    allMvcMecSelectableSelected,
    hasSelectedMvcMecRows,
    // actions
    persistRow,
    clearOrCrForm,
    handleAddToQueue,
    setHpgForRow,
    setHpgForAll,
    uploadMvcMecForRow,
    uploadMvcMecForAll,
    validateMvcMecForRow,
    validateSelectedMvcMecRows,
    toggleSelectedMvcMecRow,
    toggleSelectAllMvcMecRows,
    handleAddAgentMvcMecToQueue,
    issueCertificatesForAll,
    updateVoucherInventory,
    getQueueTimestamp,
  };
};
