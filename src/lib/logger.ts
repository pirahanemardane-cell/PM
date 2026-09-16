type LogLevel = "info" | "warn" | "error" | "debug";

const isDev = process.env.NODE_ENV === "development";

function log(level: LogLevel, message: string, meta?: unknown) {
  const entry = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  if (isDev || level === "info") {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
  debug: (message: string, meta?: unknown) => {
    if (isDev) log("debug", message, meta);
  },
};
