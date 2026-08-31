import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAbandonedCart } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Relance de panier abandonné : paniers avec email, inactifs depuis 3 h à 7 jours, non convertis,
 * une seule relance par panier. Code promo optionnel via ABANDONED_CART_CODE.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = Date.now();
  const carts = await db.cart.findMany({
    where: { email: { not: null }, convertedAt: null, recoveryEmailSentAt: null, lastActivityAt: { lt: new Date(now - 3 * 3600_000), gt: new Date(now - 7 * 86400_000) }, items: { some: {} } },
    include: { items: { include: { variant: { include: { product: { select: { name: true } } } } } } },
    take: 50,
  });
  let sent = 0;
  for (const c of carts) {
    await sendAbandonedCart(c.email!, c.items.map((i) => ({ productName: i.variant.product.name, variantName: i.variant.name, quantity: i.quantity })), process.env.ABANDONED_CART_CODE);
    await db.cart.update({ where: { id: c.id }, data: { recoveryEmailSentAt: new Date() } });
    sent++;
  }
  return NextResponse.json({ sent });
}
