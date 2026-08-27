type LogContext = Record<string, string | number | boolean | undefined>;

function write(level: "info" | "warn" | "error", event: string, context: LogContext = {}) {
  const payload = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined)),
  });
  if (level === "error") {
    console.error(payload);
    void captureException(new Error(event), context);
  }
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}

export async function captureException(error: unknown, context: LogContext = {}) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.replace(/^\//, "");
    const publicKey = parsed.username;
    if (!projectId || !publicKey) return;
    const endpoint = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/?sentry_version=7&sentry_key=${encodeURIComponent(publicKey)}`;
    await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: crypto.randomUUID().replaceAll("-", ""), timestamp: Date.now() / 1000, platform: "node", level: "error", message: error instanceof Error ? error.message : String(error), extra: context }), cache: "no-store" });
  } catch {
    // Observability must never change the response path.
  }
}

export const logger = {
  info(event: string, context?: LogContext) { write("info", event, context); },
  warn(event: string, context?: LogContext) { write("warn", event, context); },
  error(event: string, context?: LogContext) { write("error", event, context); },
};
