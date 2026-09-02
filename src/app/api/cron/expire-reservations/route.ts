import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expireStaleReservations } from "@/lib/stock";
import { getPaymentProvider } from "@/lib/payments";
import { restoreRewardRedemption } from "@/lib/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await expireStaleReservations();
  if (result.expiredOrderIds.length) {
    const payments = await db.payment.findMany({ where: { orderId: { in: result.expiredOrderIds }, providerId: { not: null } }, select: { providerId: true, provider: true } });
    await Promise.all([
      ...payments.map((p) => getPaymentProvider(p.provider).cancelCheckout(p.providerId!)),
      ...result.expiredOrderIds.map((orderId) => restoreRewardRedemption(orderId)),
    ]);
  }
  return NextResponse.json({ expiredOrders: result.expiredOrders, releasedReservations: result.releasedReservations, failed: result.failed });
}
