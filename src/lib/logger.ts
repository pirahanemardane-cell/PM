type LogLevel = "info" | "warn" | "error" | "debug";
const isDev = process.env.NODE_ENV === "development";
type LogMeta = Record<string, unknown> | unknown;

function normalizeMeta(meta?: LogMeta): Record<string, unknown> | undefined {
  if (meta === undefined || meta === null) return undefined;
  if (typeof meta === "object" && !Array.isArray(meta)) return meta as Record<string, unknown>;
  return { value: meta };
}

function log(level: LogLevel, message: string, meta?: LogMeta, requestId?: string) {
  const base = normalizeMeta(meta) || {};
  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  if (requestId) entry.requestId = requestId;
  if (Object.keys(base).length) entry.meta = base;
  const line = JSON.stringify(entry);
  if (level === "error") { console.error(line); return; }
  if (level === "warn") { console.warn(line); return; }
  if (isDev || level === "info") console.log(line);
}

export const logger = {
  info: (message: string, meta?: LogMeta, requestId?: string) => log("info", message, meta, requestId),
  warn: (message: string, meta?: LogMeta, requestId?: string) => log("warn", message, meta, requestId),
  error: (message: string, meta?: LogMeta, requestId?: string) => log("error", message, meta, requestId),
  debug: (message: string, meta?: LogMeta, requestId?: string) => {
    if (isDev) log("debug", message, meta, requestId);
  },
  withRequestId(requestId: string) {
    return {
      info: (message: string, meta?: LogMeta) => log("info", message, meta, requestId),
      warn: (message: string, meta?: LogMeta) => log("warn", message, meta, requestId),
      error: (message: string, meta?: LogMeta) => log("error", message, meta, requestId),
      debug: (message: string, meta?: LogMeta) => {
        if (isDev) log("debug", message, meta, requestId);
      },
    };
  },
};
