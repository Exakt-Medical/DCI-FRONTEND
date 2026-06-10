import axios from "axios";
import api from "./api";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchSummary(transactionId, { timeout = 10000 } = {}) {
  if (!transactionId) throw new Error("Missing transactionId");

  const controller = new AbortController();

  try {
    const res = await api.get(
      `/api/merchant-callback/summary/${encodeURIComponent(transactionId)}`,
      {
        headers: { Accept: "application/json" },
        timeout,
        signal: controller.signal,
      },
    );

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
        throw new Error("Request timed out");
      }

      const msg =
        error.response?.data?.message ||
        (error.response ? `Request failed (${error.response.status})` : null);

      if (msg) {
        throw new Error(msg);
      }
    }

    throw error;
  } finally {
    controller.abort();
  }
}

function streamPaymentResult(
  transactionId,
  { onMessage, onError, timeoutMs = 15000 } = {},
) {
  if (!transactionId) throw new Error("Missing transactionId");

  const url = `${API_BASE}/api/merchant-callback/stream?transactionId=${encodeURIComponent(transactionId)}`;
  const es = new EventSource(url);

  const timeoutId = setTimeout(() => {
    es.close();
    onError?.(new Error("SSE timeout"));
  }, timeoutMs);

  es.addEventListener("payment-result", (event) => {
    clearTimeout(timeoutId);
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } finally {
      es.close();
    }
  });

  es.onerror = (err) => {
    clearTimeout(timeoutId);
    es.close();
    onError?.(err);
  };

  return () => {
    clearTimeout(timeoutId);
    es.close();
  };
}

export default { fetchSummary, streamPaymentResult };
