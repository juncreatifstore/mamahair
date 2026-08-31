import { redirect } from "next/navigation";
import { getCart, cartTotals } from "@/server/cart";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSection } from "@/lib/settings";
import { getRatesForCountry } from "@/lib/shipping";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { formatCents } from "@/lib/money";
import { COUNTRY_NAMES } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata() { return { title: (await getT()).checkout.title, robots: { index: false } }; }

export default async function CheckoutPage() {
  const [cart, user, commerce, t] = await Promise.all([getCart(), getCurrentUser(), getSection("commerce"), getT()]);
  if (!cart || cart.items.length === 0) redirect("/cart");
  const totals = await cartTotals(cart);
  const ratesByCountry: Record<string, Awaited<ReturnType<typeof getRatesForCountry>>> = {};
  await Promise.all(commerce.enabledCountries.map(async (c) => { ratesByCountry[c] = await getRatesForCountry(c, cart.currency, totals.weightGrams); }));
  const saved = user ? await db.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }) : null;
  const defaultAddress = saved ? { fullName: saved.fullName, line1: saved.line1, line2: saved.line2, city: saved.city, region: saved.region, postalCode: saved.postalCode, country: saved.country, phone: saved.phone ?? user?.phone } : user ? { phone: user.phone } : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl text-cocoa">{t.checkout.title}</h1>
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px]">
        <CheckoutForm countries={commerce.enabledCountries.map((code) => ({ code, name: COUNTRY_NAMES[code] ?? code }))} ratesByCountry={ratesByCountry} subtotalCents={totals.subtotalCents - totals.discountCents} currency={cart.currency} freeShipping={totals.freeShipping} defaultEmail={user?.email} defaultAddress={defaultAddress} loggedIn={!!user} t={t.checkout} />
        <aside className="h-fit rounded-3xl bg-white p-6 lg:sticky lg:top-32">
          <h2 className="text-xl text-cocoa">{t.checkout.summary}</h2>
          <ul className="mt-4 divide-y divide-sand text-sm">{cart.items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-2.5"><span>{i.variant.product.name} <span className="text-ink-soft">· {i.variant.name} × {i.quantity}</span></span><span className="shrink-0">{formatCents(i.variant.priceCents * i.quantity, cart.currency)}</span></li>)}</ul>
          <div className="mt-4 space-y-1.5 border-t border-sand pt-4 text-sm">
            <div className="flex justify-between"><span>{t.cart.subtotal}</span><span>{formatCents(totals.subtotalCents, cart.currency)}</span></div>
            {totals.discountCents > 0 && <div className="flex justify-between text-flame"><span>{cart.discount?.code}</span><span>−{formatCents(totals.discountCents, cart.currency)}</span></div>}
            <div className="flex justify-between text-ink-soft"><span>{t.checkout.shipping}</span><span>{totals.freeShipping ? "Free" : "Selected in step 3"}</span></div>
            <div className="flex justify-between text-ink-soft"><span>{t.checkout.tax}</span><span>{t.checkout.taxNote}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
