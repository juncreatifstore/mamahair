import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAbandonedCart } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Relance de panier abandonné : paniers inactifs depuis 3 h à 7 jours, non convertis,
 * une seule relance par panier. Utilise cart.email ou, à défaut, l'email du compte client.
 * Les clients bloqués sont exclus. Code promo optionnel via ABANDONED_CART_CODE.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const carts = await db.cart.findMany({
    where: {
      convertedAt: null,
      recoveryEmailSentAt: null,
      lastActivityAt: { lt: new Date(now - 3 * 3600_000), gt: new Date(now - 7 * 86400_000) },
      items: { some: {} },
      OR: [
        { email: { not: null } },
        { user: { is: { email: { not: "" }, isBlocked: false } } },
      ],
    },
    include: {
      user: { select: { email: true, isBlocked: true } },
      items: {
        include: {
          variant: {
            include: {
              image: true,
              product: { select: { name: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
            },
          },
        },
      },
    },
    take: 50,
  });

  let sent = 0;
  let skipped = 0;
  for (const c of carts) {
    if (c.user?.isBlocked) { skipped++; continue; }
    const email = c.email ?? c.user?.email ?? null;
    if (!email) { skipped++; continue; }

    await sendAbandonedCart(
      email,
      c.items.map((i) => ({
        productName: i.variant.product.name,
        variantName: i.variant.name,
        quantity: i.quantity,
        imageUrl: i.variant.image?.url ?? i.variant.product.images[0]?.url ?? null,
      })),
      process.env.ABANDONED_CART_CODE,
    );
    await db.cart.update({ where: { id: c.id }, data: { recoveryEmailSentAt: new Date() } });
    sent++;
  }

  return NextResponse.json({ sent, skipped });
}
