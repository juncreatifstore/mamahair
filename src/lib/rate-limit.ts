import { headers } from "next/headers";

/**
 * Rate limiting simple (fenêtre glissante en mémoire, par instance).
 * Suffisant pour freiner les abus évidents sur Vercel ; pour une garantie globale,
 * brancher Upstash Redis (UPSTASH_REDIS_REST_URL) dans `check()` sans changer les appels.
 */
const buckets = new Map<string, number[]>();

export async function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(id) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return { ok: false as const, retryAfterMs: windowMs - (now - hits[0]) };
  hits.push(now);
  buckets.set(id, hits);
  if (buckets.size > 5000) buckets.clear(); // garde-fou mémoire
  return { ok: true as const };
}
