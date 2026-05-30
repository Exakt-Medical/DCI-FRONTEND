const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchSummary(transactionId, { timeout = 10000 } = {}) {
  if (!transactionId) throw new Error("Missing transactionId");

  const url = `${API_BASE}/api/merchant-callback/summary/${encodeURIComponent(
    transactionId,
  )}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(id);

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = json?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return json;
  } finally {
    clearTimeout(id);
  }
}

function streamPaymentResult(transactionId, { onMessage, onError, timeoutMs = 15000 } = {}) {
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
