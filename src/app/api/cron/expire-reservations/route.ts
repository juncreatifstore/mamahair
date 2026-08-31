import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expireStaleReservations } from "@/lib/stock";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron (vercel.json, toutes les 15 min) — libère le stock des commandes non payées expirées,
 * puis ferme la session Stripe correspondante pour qu'aucun paiement tardif ne soit possible.
 * Protégé par CRON_SECRET. Ré-exécutable sans effet de bord (idempotent).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await expireStaleReservations();
  if (result.expiredOrderIds.length) {
    const payments = await db.payment.findMany({ where: { orderId: { in: result.expiredOrderIds }, providerId: { not: null } }, select: { providerId: true, provider: true } });
    await Promise.all(payments.map((p) => getPaymentProvider(p.provider).cancelCheckout(p.providerId!)));
  }
  return NextResponse.json({ expiredOrders: result.expiredOrders, releasedReservations: result.releasedReservations, failed: result.failed });
}
