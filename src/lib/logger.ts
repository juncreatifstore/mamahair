/**
 * Logger serveur. Masque les secrets. Envoie à Sentry si configuré (voir lib/sentry.ts).
 */
const SECRET_KEYS = /pass(word)?|secret|token|service_role|authorization|card|cvv|cvc|apikey|api_key/i;

export function redact(input: unknown, depth = 0): unknown {
  if (depth > 4 || input == null) return input;
  if (typeof input === "string") return input.length > 500 ? input.slice(0, 500) + "…" : input;
  if (Array.isArray(input)) return input.map((v) => redact(v, depth + 1));
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) out[k] = SECRET_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1);
    return out;
  }
  return input;
}

function emit(level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...(meta ? (redact(meta) as object) : {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: async (msg: string, err?: unknown, meta?: Record<string, unknown>) => {
    emit("error", msg, { ...meta, error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack?.split("\n").slice(0, 5) } : err });
    const { captureException } = await import("./sentry");
    captureException(err instanceof Error ? err : new Error(msg), meta);
  },
};
