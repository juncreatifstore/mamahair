import Image from "next/image";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck, Truck } from "lucide-react";
import { getCart, cartTotals } from "@/server/cart";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSection } from "@/lib/settings";
import { getRewardRules, getRewardSummary } from "@/lib/rewards";
import { getRatesForCountry } from "@/lib/shipping";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { formatCents } from "@/lib/money";
import { COUNTRY_NAMES } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata() { return { title: (await getT()).checkout.title, robots: { index: false } }; }

function variantOptions(options: unknown) {
  const o = (options ?? {}) as Record<string, string>;
  return Object.entries(o).filter(([, value]) => value).map(([key, value]) => ({ key, label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()), value: key === "length" ? `${value}\"` : value }));
}

export default async function CheckoutPage() {
  const [cart, user, commerce, t, rewardRules] = await Promise.all([getCart(), getCurrentUser(), getSection("commerce"), getT(), getRewardRules()]);
  if (!cart || cart.items.length === 0) redirect("/cart");
  const totals = await cartTotals(cart);
  const ratesByCountry: Record<string, Awaited<ReturnType<typeof getRatesForCountry>>> = {};
  await Promise.all(commerce.enabledCountries.map(async (c) => { ratesByCountry[c] = await getRatesForCountry(c, cart.currency, totals.weightGrams); }));
  const [saved, rewards] = await Promise.all([
    user ? db.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }) : null,
    user && rewardRules.enabled ? getRewardSummary(user.id) : null,
  ]);
  const defaultAddress = saved ? { fullName: saved.fullName, line1: saved.line1, line2: saved.line2, city: saved.city, region: saved.region, postalCode: saved.postalCode, country: saved.country, phone: saved.phone ?? user?.phone } : user ? { phone: user.phone } : undefined;

  return (
    <div className="pb-20">
      <section className="border-b border-sand bg-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-flame">SECURE CHECKOUT</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div><h1 className="text-4xl text-cocoa sm:text-5xl">{t.checkout.title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">Complete your delivery and payment details. Your prices and stock are validated again before payment.</p></div>
            <div className="flex items-center gap-2 rounded-full border border-sand bg-cream px-4 py-2 text-xs font-semibold text-cocoa"><LockKeyhole className="size-4 text-flame" /> Encrypted checkout</div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_430px] xl:gap-14">
          <div className="rounded-[30px] border border-sand bg-white p-5 shadow-[0_18px_60px_rgba(74,27,12,0.04)] sm:p-7">
            <CheckoutForm
              countries={commerce.enabledCountries.map((code) => ({ code, name: COUNTRY_NAMES[code] ?? code }))}
              ratesByCountry={ratesByCountry}
              subtotalCents={totals.subtotalCents - totals.discountCents}
              currency={cart.currency}
              freeShipping={totals.freeShipping}
              defaultEmail={user?.email}
              defaultAddress={defaultAddress}
              loggedIn={!!user}
              rewardBalance={rewards?.points ?? 0}
              rewardRules={{ enabled: rewardRules.enabled, minRedeemPoints: rewardRules.minRedeemPoints, pointsPerPercent: rewardRules.pointsPerPercent, maxRedeemPercent: rewardRules.maxRedeemPercent }}
              t={t.checkout}
            />
          </div>

          <aside className="h-fit lg:sticky lg:top-32">
            <div className="rounded-[30px] border border-sand bg-white p-6 shadow-[0_18px_60px_rgba(74,27,12,0.06)]">
              <div className="flex items-center justify-between gap-3 border-b border-sand pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-flame">Your order</p><h2 className="mt-1 text-2xl text-cocoa">{t.checkout.summary}</h2></div><span className="rounded-full bg-petal px-3 py-1 text-xs font-semibold text-cocoa">{totals.count} item{totals.count === 1 ? "" : "s"}</span></div>
              <ul className="mt-5 divide-y divide-sand">
                {cart.items.map((i) => {
                  const img = i.variant.image?.url ?? i.variant.product.images[0]?.url;
                  const opts = variantOptions(i.variant.options);
                  const available = Math.max(0, (i.variant.inventory?.quantity ?? 0) - (i.variant.inventory?.reserved ?? 0));
                  return <li key={i.id} className="flex gap-3 py-4 first:pt-0"><div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-petal ring-1 ring-sand/70">{img && <Image src={img} alt={i.variant.product.name} fill sizes="80px" className="object-cover" />}<span className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-cocoa text-[11px] font-semibold text-cream">{i.quantity}</span></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="font-medium leading-snug">{i.variant.product.name}</p><span className="shrink-0 text-sm font-semibold text-cocoa">{formatCents(i.variant.priceCents * i.quantity, cart.currency)}</span></div><p className="mt-1 text-[11px] text-ink-soft">SKU {i.variant.sku}</p>{opts.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{opts.slice(0, 3).map((o) => <span key={o.key} className="rounded-full bg-cream px-2 py-1 text-[10px] text-ink-soft">{o.value}</span>)}</div>}{available <= 5 && <p className={`mt-2 text-[11px] ${available === 0 ? "text-red-700" : "text-amber-700"}`}>{available === 0 ? "Currently out of stock" : `Only ${available} available`}</p>}</div></li>;
                })}
              </ul>
              <div className="mt-4 space-y-3 border-t border-sand pt-4 text-sm"><div className="flex justify-between"><span className="text-ink-soft">{t.cart.subtotal}</span><span>{formatCents(totals.subtotalCents, cart.currency)}</span></div>{totals.discountCents > 0 && <div className="flex justify-between font-medium text-flame"><span>{cart.discount?.code || "Discount"}</span><span>−{formatCents(totals.discountCents, cart.currency)}</span></div>}<div className="flex justify-between text-ink-soft"><span>{t.checkout.shipping}</span><span>{totals.freeShipping ? "Free" : "Selected before payment"}</span></div><div className="flex justify-between text-ink-soft"><span>{t.checkout.tax}</span><span>{t.checkout.taxNote}</span></div><div className="flex justify-between border-t border-sand pt-4 text-lg font-semibold text-cocoa"><span>{t.cart.total}</span><span>{formatCents(totals.subtotalCents - totals.discountCents, cart.currency)} + shipping/tax</span></div></div>
              <div className="mt-5 grid gap-2"><MiniTrust icon={ShieldCheck} text="Secure payment processing" /><MiniTrust icon={Truck} text="Tracked shipping when available" /><MiniTrust icon={LockKeyhole} text="Stock revalidated before payment" /></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MiniTrust({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) { return <div className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs text-ink-soft"><Icon className="size-4 text-cocoa" /><span>{text}</span></div>; }
