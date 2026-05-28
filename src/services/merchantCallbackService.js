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

export default { fetchSummary };
