import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel/Supabase integrations may inject PostgreSQL credentials under
 * POSTGRES_PRISMA_URL or POSTGRES_URL instead of DATABASE_URL.
 * Prefer the explicit app variable when present, then fall back automatically.
 *
 * Important: do not throw at module import time when no URL is available.
 * Next.js imports server modules while collecting route metadata during build.
 * Prisma will report a clear connection/configuration error only if a database
 * query is actually executed without a usable connection at runtime.
 */
const rawDatabaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL?.trim();

function normalizeDatabaseUrl(value?: string) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const isSupabaseTransactionPooler =
      url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543";

    if (isSupabaseTransactionPooler) {
      // Supabase transaction pooling requires Prisma to operate in PgBouncer mode.
      // This disables prepared statements that otherwise cause PostgreSQL 42P05
      // errors such as: prepared statement "s0" already exists.
      if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
      if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
    }

    return url.toString();
  } catch {
    // Preserve the original value so Prisma can return the useful validation error.
    return value;
  }
}

const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl);

export const isDatabaseConfigured = Boolean(databaseUrl);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
