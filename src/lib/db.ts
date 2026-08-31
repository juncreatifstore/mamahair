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
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL?.trim();

export const isDatabaseConfigured = Boolean(databaseUrl);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
