"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type AdminCustomerFilter = "" | "active" | "blocked" | "abandoned";

export async function adminListCustomersEnhanced(opts: { q?: string; filter?: AdminCustomerFilter } = {}) {
  await requireAdmin();
  const q = opts.q?.trim();
  const filter = opts.filter ?? "";
  const abandonedBefore = new Date(Date.now() - 60 * 60 * 1000);

  return db.user.findMany({
    where: {
      role: "CLIENT",
      ...(filter === "active" ? { isBlocked: false } : {}),
      ...(filter === "blocked" ? { isBlocked: true } : {}),
      ...(filter === "abandoned"
        ? { cart: { is: { convertedAt: null, items: { some: {} }, lastActivityAt: { lt: abandonedBefore } } } }
        : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } },
        select: { totalCents: true, refundedCents: true, currency: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      cart: {
        include: {
          items: {
            include: {
              variant: { select: { priceCents: true } },
            },
          },
        },
      },
      _count: { select: { wishlist: true, reviews: true } },
    },
    take: 300,
  });
}
