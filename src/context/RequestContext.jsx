import { createContext, useContext, useState, useEffect } from "react";

const RequestContext = createContext(null);

export function RequestProvider({ children }) {
  const [requestRecords, setRequestRecords] = useState(() => {
    const saved = localStorage.getItem("certificateRequests");
    return saved ? JSON.parse(saved) : [];
  });

  const [voucherInventory, setVoucherInventory] = useState(() => {
    const saved = localStorage.getItem("voucherInventory");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("certificateRequests", JSON.stringify(requestRecords));
  }, [requestRecords]);

  useEffect(() => {
    localStorage.setItem("voucherInventory", JSON.stringify(voucherInventory));
  }, [voucherInventory]);

  const upsertRequestRecord = (record) => {
    setRequestRecords((prev) => {
      const next = prev.some((item) => item.requestId === record.requestId)
        ? prev.map((item) => (item.requestId === record.requestId ? { ...item, ...record } : item))
        : [record, ...prev];
      return next;
    });
  };

  const handleRequestSave = (record) => {
    if (!record?.requestId) return;
    upsertRequestRecord(record);
  };

  const handleVoucherRequestComplete = (payload) => {
    if (payload?.rows?.length) {
      payload.rows.forEach((row) => {
        if (!row?.requestId) return;
        upsertRequestRecord(row);
      });
    } else if (payload?.requestId) {
      upsertRequestRecord(payload);
    }
  };

  const handleClearanceRequestComplete = (payload) => {
    if (payload?.rows?.length) {
      payload.rows.forEach((row) => {
        if (!row?.requestId) return;
        upsertRequestRecord({
          ...row,
          requestId: row.requestId,
          plateNumber: row.plateNumber || row.vehicle?.plateNumber || "",
          clearanceReferenceNo: row.certificateNo || row.clearanceReferenceNo || "",
          clearanceStatus: "CERTIFICATE_ISSUED",
          status: "CERTIFICATE_ISSUED",
          certificateNo: row.certificateNo || "",
          currentStep: 5,
          hpgVerified: true,
        });
      });
      return;
    }

    if (!payload?.requestId) return;
    upsertRequestRecord({
      requestId: payload.requestId,
      plateNumber: payload.vehicle?.plateNumber || payload.plateNumber || "",
      clearanceReferenceNo: payload.certificateNo || "",
      clearanceStatus: "CERTIFICATE_ISSUED",
      status: "CERTIFICATE_ISSUED",
      certificateNo: payload.certificateNo || "",
      currentStep: 5,
      hpgVerified: true,
    });
  };

  return (
    <RequestContext.Provider
      value={{
        requestRecords,
        setRequestRecords,
        voucherInventory,
        setVoucherInventory,
        upsertRequestRecord,
        handleRequestSave,
        handleVoucherRequestComplete,
        handleClearanceRequestComplete,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export const useRequest = () => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error("useRequest must be used within RequestProvider");
  }
  return context;
};
