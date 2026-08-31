import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel/Supabase integrations may inject PostgreSQL credentials under
 * POSTGRES_PRISMA_URL or POSTGRES_URL instead of DATABASE_URL.
 * Prefer the explicit app variable when present, then fall back automatically.
 */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_PRISMA_URL?.trim() ||
  process.env.POSTGRES_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "Database connection is not configured. Expected DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL."
  );
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
