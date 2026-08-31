import Link from "next/link";
import { LockKeyhole, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { getCart, cartTotals, estimateShipping } from "@/server/cart";
import { CartLine } from "@/components/storefront/cart-line";
import { PromoForm } from "@/components/storefront/promo-form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatCents } from "@/lib/money";
import { getT } from "@/i18n/server";

export async function generateMetadata() { return { title: (await getT()).cart.title, robots: { index: false } }; }

export default async function CartPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const [cart, sp, t] = await Promise.all([getCart(), searchParams, getT()]);
  const totals = await cartTotals(cart);
  const est = await estimateShipping();
  const c = t.cart;
  const afterDiscount = totals.subtotalCents - totals.discountCents;

  return (
    <div className="pb-20">
      <section className="border-b border-sand bg-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-flame">YOUR BAG</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl text-cocoa sm:text-5xl">{c.title}</h1>
              <p className="mt-3 text-sm text-ink-soft">Review your selections before secure checkout.</p>
            </div>
            {totals.count > 0 && <span className="rounded-full bg-petal px-4 py-2 text-sm font-semibold text-cocoa">{totals.count} item{totals.count === 1 ? "" : "s"}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {sp.cancelled && <Alert tone="info">{c.cancelled}</Alert>}
        {totals.discountError && <Alert className={sp.cancelled ? "mt-4" : ""}>{totals.discountError}</Alert>}

        {!cart || cart.items.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-[32px] border border-dashed border-sand bg-white p-12 text-center shadow-[0_18px_60px_rgba(74,27,12,0.04)]">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-petal text-2xl">♡</div>
            <h2 className="mt-5 text-3xl text-cocoa">Your bag is waiting</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">{c.empty}</p>
            <Button href="/shop" className="mt-7">{c.continue}</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-10">
              <div>
                <div className="rounded-[28px] border border-sand bg-white px-5 sm:px-7">
                  <div className="divide-y divide-sand">{cart.items.map((item) => <CartLine key={item.id} item={item} currency={cart.currency} labels={{ remove: c.remove, wishlist: c.moveToWishlist }} />)}</div>
                </div>
                <Link href="/shop" className="mt-5 inline-flex items-center text-sm font-semibold text-cocoa underline decoration-sand underline-offset-4 hover:text-flame">← {c.continue}</Link>
              </div>

              <aside className="h-fit lg:sticky lg:top-32">
                <div className="rounded-[28px] border border-sand bg-white p-6 shadow-[0_18px_60px_rgba(74,27,12,0.06)] sm:p-7">
                  <div className="flex items-center justify-between border-b border-sand pb-4">
                    <h2 className="text-2xl text-cocoa">Order summary</h2>
                    <LockKeyhole className="size-5 text-flame" />
                  </div>

                  <div className="mt-5"><PromoForm current={cart.discount?.code ?? null} labels={{ promo: c.promo, apply: c.apply }} /></div>

                  <div className="mt-6 space-y-3 text-sm">
                    <Row label={c.subtotal} value={formatCents(totals.subtotalCents, cart.currency)} />
                    {totals.discountCents > 0 && <Row label={`${c.discount} (${cart.discount?.code})`} value={`−${formatCents(totals.discountCents, cart.currency)}`} accent />}
                    {est && <Row label={`${c.shippingEstimate} (${est.country})`} value={est.shippingCents == null ? "—" : est.shippingCents === 0 ? "Free" : formatCents(est.shippingCents, cart.currency)} muted />}
                    {est?.taxCents != null && <Row label={c.taxEstimate} value={formatCents(est.taxCents, cart.currency)} muted />}
                    <div className="flex justify-between border-t border-sand pt-4 text-lg font-semibold text-cocoa"><span>{c.total}</span><span>{formatCents(afterDiscount + (est?.shippingCents ?? 0) + (est?.taxCents ?? 0), cart.currency)}</span></div>
                  </div>

                  <Button href="/checkout" size="lg" className="mt-6 w-full">{c.checkout}</Button>
                  <p className="mt-3 text-center text-[11px] leading-5 text-ink-soft">Shipping and taxes are confirmed before payment.</p>
                </div>

                <div className="mt-4 grid gap-2">
                  <Trust icon={ShieldCheck} title="Secure checkout" text="Protected payment flow" />
                  <Trust icon={Truck} title="Tracked delivery" text="Shipping updates when available" />
                  <Trust icon={RefreshCcw} title="Order support" text="Help before and after purchase" />
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return <div className={`flex justify-between gap-4 ${accent ? "font-medium text-flame" : muted ? "text-ink-soft" : ""}`}><span>{label}</span><span className="text-right">{value}</span></div>;
}

function Trust({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-sand bg-white px-4 py-3"><div className="grid size-9 place-items-center rounded-full bg-petal text-cocoa"><Icon className="size-4" /></div><div><p className="text-xs font-semibold text-cocoa">{title}</p><p className="text-[11px] text-ink-soft">{text}</p></div></div>;
}
