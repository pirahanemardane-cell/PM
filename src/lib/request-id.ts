/** Request ID for log and API tracing */
export const REQUEST_ID_HEADER = "x-request-id";

export function createRequestId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    }
  } catch {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function resolveRequestId(incoming: string | null | undefined): string {
  const v = (incoming || "").trim();
  if (v && /^[a-zA-Z0-9_-]{8,64}$/.test(v)) return v;
  return createRequestId();
}
