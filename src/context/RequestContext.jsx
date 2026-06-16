import { createContext, useContext, useState, useEffect } from "react";
import { fetchMyRequests, upsertRequest } from "../services/userRequestRecordService";
import { useAuth } from "./AuthContext";

const RequestContext = createContext(null);

export function RequestProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [requestRecords, setRequestRecords] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);


  const [voucherInventory, setVoucherInventory] = useState(() => {
    const saved = localStorage.getItem("voucherInventory");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyRequests()
        .then((data) => {
          setRequestRecords(data || []);
          setIsInitializing(false);
        })
        .catch((err) => {
          console.error("Failed to fetch requests", err);
          setIsInitializing(false);
        });
    } else {
      setRequestRecords([]);
      setIsInitializing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("voucherInventory", JSON.stringify(voucherInventory));
  }, [voucherInventory]);

  const upsertRequestRecord = (record) => {
    if (!record.id) {
      console.warn("Cannot upsert request record without an id.");
      return;
    }

    setRequestRecords((prev) => {
      const next = prev.some((item) => item.id === record.id)
        ? prev.map((item) => (item.id === record.id ? { ...item, ...record } : item))
        : [record, ...prev];
      return next;
    });

    if (isAuthenticated) {
      upsertRequest(record).catch(err => console.error("Failed to sync request to backend", err));
    }
  };

  const handleRequestSave = async (record) => {
    if (isAuthenticated) {
      try {
        const res = await upsertRequest(record);
        if (res?.id) {
          const newRecord = { ...record, id: res.id };
          setRequestRecords((prev) => [newRecord, ...prev]);
          return res.id;
        }
      } catch (err) {
        console.error("Failed to save request:", err);
      }
    } else {
      const id = record.id || Date.now();
      const newRecord = { ...record, id };
      setRequestRecords((prev) => [newRecord, ...prev]);
      return id;
    }
    return null;
  };

  const handleVoucherRequestComplete = (payload) => {
    if (payload?.rows?.length) {
      payload.rows.forEach((row) => {
        if (!row?.id) return;
        upsertRequestRecord(row);
      });
    } else if (payload?.id) {
      upsertRequestRecord(payload);
    }
  };

  const handleClearanceRequestComplete = (payload) => {
    if (payload?.rows?.length) {
      payload.rows.forEach((row) => {
        if (!row?.id) return;
        upsertRequestRecord({
          ...row,
          id: row.id,
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

    if (!payload?.id) return;
    upsertRequestRecord({
      id: payload.id,
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
        isInitializing,
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
