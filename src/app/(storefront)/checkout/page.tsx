import Image from "next/image";
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

function variantOptions(options: unknown) {
  const o = (options ?? {}) as Record<string, string>;
  return Object.entries(o).filter(([, value]) => value).map(([key, value]) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    value: key === "length" ? `${value}\"` : value,
  }));
}

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
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_420px]">
        <CheckoutForm countries={commerce.enabledCountries.map((code) => ({ code, name: COUNTRY_NAMES[code] ?? code }))} ratesByCountry={ratesByCountry} subtotalCents={totals.subtotalCents - totals.discountCents} currency={cart.currency} freeShipping={totals.freeShipping} defaultEmail={user?.email} defaultAddress={defaultAddress} loggedIn={!!user} t={t.checkout} />
        <aside className="h-fit rounded-3xl border border-sand bg-white p-6 shadow-sm lg:sticky lg:top-32">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl text-cocoa">{t.checkout.summary}</h2>
            <span className="rounded-pill bg-petal px-3 py-1 text-xs font-medium text-cocoa">{totals.count} item{totals.count === 1 ? "" : "s"}</span>
          </div>

          <ul className="mt-5 divide-y divide-sand">
            {cart.items.map((i) => {
              const img = i.variant.image?.url ?? i.variant.product.images[0]?.url;
              const opts = variantOptions(i.variant.options);
              const available = Math.max(0, (i.variant.inventory?.quantity ?? 0) - (i.variant.inventory?.reserved ?? 0));
              return (
                <li key={i.id} className="flex gap-3 py-4 first:pt-0">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-petal">
                    {img && <Image src={img} alt={i.variant.product.name} fill sizes="80px" className="object-cover" />}
                    <span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-cocoa text-[11px] font-semibold text-cream">{i.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium leading-snug">{i.variant.product.name}</p>
                      <span className="shrink-0 text-sm font-semibold text-cocoa">{formatCents(i.variant.priceCents * i.quantity, cart.currency)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">{i.variant.name} · SKU {i.variant.sku}</p>
                    {opts.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{opts.map((o) => <span key={o.key} className="rounded-pill bg-cream px-2 py-1 text-[11px] text-ink-soft">{o.label}: <span className="font-medium text-ink">{o.value}</span></span>)}</div>}
                    {available <= 5 && <p className={`mt-2 text-[11px] ${available === 0 ? "text-red-700" : "text-amber-700"}`}>{available === 0 ? "Currently out of stock" : `Only ${available} available`}</p>}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 border-t border-sand pt-4 text-sm">
            <div className="flex justify-between"><span>{t.cart.subtotal}</span><span>{formatCents(totals.subtotalCents, cart.currency)}</span></div>
            {totals.discountCents > 0 && <div className="flex justify-between text-flame"><span>{cart.discount?.code}</span><span>−{formatCents(totals.discountCents, cart.currency)}</span></div>}
            <div className="flex justify-between text-ink-soft"><span>{t.checkout.shipping}</span><span>{totals.freeShipping ? "Free" : "Selected before payment"}</span></div>
            <div className="flex justify-between text-ink-soft"><span>{t.checkout.tax}</span><span>{t.checkout.taxNote}</span></div>
            <div className="flex justify-between border-t border-sand pt-3 text-base font-semibold text-cocoa"><span>{t.cart.total}</span><span>{formatCents(totals.subtotalCents - totals.discountCents, cart.currency)} + shipping/tax</span></div>
          </div>

          <div className="mt-5 rounded-2xl bg-petal/60 p-3 text-xs leading-relaxed text-ink-soft">
            Prices and stock are revalidated on the server before payment. Your items are reserved only when the payment session is created.
          </div>
        </aside>
      </div>
    </div>
  );
}
