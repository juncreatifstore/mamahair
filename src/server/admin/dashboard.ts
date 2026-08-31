import { db } from "@/lib/db";

const SOLD: ("PAID" | "PROCESSING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "PARTIALLY_REFUNDED")[] = ["PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "PARTIALLY_REFUNDED"];

export async function getDashboardStats(currency = "USD") {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const week = new Date(day.getTime() - 6 * 86400_000);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const sold = { status: { in: SOLD }, currency };

  const [today, thisWeek, thisMonth, toProcess, newCustomers, lowStock, outOfStock, recent, topProducts, refunds, dailyRaw, pendingReviews, wishlistTop] = await Promise.all([
    db.order.aggregate({ where: { ...sold, createdAt: { gte: day } }, _sum: { totalCents: true }, _count: true }),
    db.order.aggregate({ where: { ...sold, createdAt: { gte: week } }, _sum: { totalCents: true }, _count: true }),
    db.order.aggregate({ where: { ...sold, createdAt: { gte: month } }, _sum: { totalCents: true }, _count: true, _avg: { totalCents: true } }),
    db.order.count({ where: { status: { in: ["PAID", "PROCESSING", "READY_TO_SHIP"] } } }),
    db.user.count({ where: { role: "CLIENT", createdAt: { gte: month } } }),
    db.inventory.findMany({ where: { quantity: { gt: 0, lte: db.inventory.fields.lowStockAt }, variant: { isActive: true } }, include: { variant: { include: { product: { select: { name: true, id: true } } } } }, take: 10 }),
    db.inventory.findMany({ where: { quantity: 0, variant: { isActive: true, product: { status: "ACTIVE" } } }, include: { variant: { include: { product: { select: { name: true, id: true } } } } }, take: 10 }),
    db.order.findMany({ where: { status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, take: 8, include: { items: true, payment: { select: { status: true, method: true } } } }),
    db.orderItem.groupBy({ by: ["productName"], _sum: { quantity: true, totalCents: true }, where: { order: { ...sold, createdAt: { gte: month } } }, orderBy: { _sum: { totalCents: "desc" } }, take: 5 }),
    db.order.aggregate({ where: { currency, refundedCents: { gt: 0 }, createdAt: { gte: month } }, _sum: { refundedCents: true }, _count: true }),
    db.$queryRaw<{ d: Date; total: bigint; n: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS d, COALESCE(SUM("totalCents"),0)::bigint AS total, COUNT(*)::bigint AS n
      FROM "Order" WHERE "status"::text = ANY(${SOLD}) AND "currency" = ${currency} AND "createdAt" >= ${new Date(day.getTime() - 29 * 86400_000)}
      GROUP BY 1 ORDER BY 1`,
    db.review.count({ where: { isApproved: false } }),
    db.wishlistItem.groupBy({ by: ["productId"], _count: true, orderBy: { _count: { productId: "desc" } }, take: 3 }),
  ]);

  const daily: { date: string; cents: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(day.getTime() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    const row = dailyRaw.find((r) => new Date(r.d).toISOString().slice(0, 10) === key);
    daily.push({ date: key, cents: Number(row?.total ?? 0), orders: Number(row?.n ?? 0) });
  }

  return {
    currency,
    todayCents: today._sum.totalCents ?? 0, todayCount: today._count,
    weekCents: thisWeek._sum.totalCents ?? 0, weekCount: thisWeek._count,
    monthCents: thisMonth._sum.totalCents ?? 0, monthCount: thisMonth._count, avgOrderCents: Math.round(thisMonth._avg.totalCents ?? 0),
    toProcess, newCustomers, lowStock, outOfStock, recent, topProducts,
    refundedCents: refunds._sum.refundedCents ?? 0, refundCount: refunds._count,
    daily, pendingReviews, wishlistTop,
  };
}
