import Link from "next/link";
import { LockKeyhole, RefreshCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
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
  const estimatedTotal = afterDiscount + (est?.shippingCents ?? 0) + (est?.taxCents ?? 0);

  return (
    <div className="pb-20">
      <section className="border-b border-sand bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-flame">YOUR BAG</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl text-cocoa sm:text-5xl">{c.title}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">Review your hair selections, options and quantities before secure checkout.</p>
            </div>
            {totals.count > 0 && <span className="inline-flex items-center gap-2 rounded-full bg-petal px-4 py-2 text-sm font-semibold text-cocoa"><ShoppingBag className="size-4" />{totals.count} item{totals.count === 1 ? "" : "s"}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        {sp.cancelled && <Alert tone="info">{c.cancelled}</Alert>}
        {totals.discountError && <Alert className={sp.cancelled ? "mt-4" : ""}>{totals.discountError}</Alert>}

        {!cart || cart.items.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-[32px] border border-dashed border-sand bg-white p-9 text-center shadow-[0_18px_60px_rgba(74,27,12,0.04)] sm:p-12">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-petal text-cocoa"><ShoppingBag className="size-7" /></div>
            <h2 className="mt-5 text-3xl text-cocoa">Your bag is waiting</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-soft">{c.empty}</p>
            <Button href="/shop" size="lg" className="mt-7">{c.continue}</Button>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-10">
            <div>
              <div className="overflow-hidden rounded-[26px] border border-sand bg-white px-4 sm:px-7">
                <div className="divide-y divide-sand">{cart.items.map((item) => <CartLine key={item.id} item={item} currency={cart.currency} labels={{ remove: c.remove, wishlist: c.moveToWishlist }} />)}</div>
              </div>
              <Link href="/shop" className="mt-5 inline-flex items-center text-sm font-semibold text-cocoa underline decoration-sand underline-offset-4 hover:text-flame">← {c.continue}</Link>
            </div>

            <aside className="h-fit lg:sticky lg:top-32">
              <div className="rounded-[26px] border border-sand bg-white p-5 shadow-[0_18px_60px_rgba(74,27,12,0.06)] sm:p-7">
                <div className="flex items-center justify-between border-b border-sand pb-4">
                  <div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-flame">Secure order</p><h2 className="mt-1 text-2xl text-cocoa">Order summary</h2></div>
                  <LockKeyhole className="size-5 text-flame" />
                </div>

                <div className="mt-5"><PromoForm current={cart.discount?.code ?? null} labels={{ promo: c.promo, apply: c.apply }} /></div>

                <div className="mt-6 space-y-3 text-sm">
                  <Row label={c.subtotal} value={formatCents(totals.subtotalCents, cart.currency)} />
                  {totals.discountCents > 0 && <Row label={`${c.discount} (${cart.discount?.code})`} value={`−${formatCents(totals.discountCents, cart.currency)}`} accent />}
                  {est && <Row label={`${c.shippingEstimate} (${est.country})`} value={est.shippingCents == null ? "—" : est.shippingCents === 0 ? "Free" : formatCents(est.shippingCents, cart.currency)} muted />}
                  {est?.taxCents != null && <Row label={c.taxEstimate} value={formatCents(est.taxCents, cart.currency)} muted />}
                  <div className="flex justify-between border-t border-sand pt-4 text-lg font-semibold text-cocoa"><span>{c.total}</span><span>{formatCents(estimatedTotal, cart.currency)}</span></div>
                </div>

                <Button href="/checkout" size="lg" className="mt-6 w-full shadow-[0_14px_30px_rgba(216,90,48,.2)]">{c.checkout}</Button>
                <p className="mt-3 text-center text-[11px] leading-5 text-ink-soft">Final shipping and taxes are confirmed before payment.</p>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-sand pt-4">
                  <Mini icon={ShieldCheck} label="Secure" />
                  <Mini icon={Truck} label="Tracked" />
                  <Mini icon={RefreshCcw} label="Support" />
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return <div className={`flex justify-between gap-4 ${accent ? "font-medium text-flame" : muted ? "text-ink-soft" : ""}`}><span>{label}</span><span className="text-right">{value}</span></div>;
}

function Mini({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) {
  return <div className="text-center"><span className="mx-auto grid size-8 place-items-center rounded-full bg-petal text-cocoa"><Icon className="size-3.5" /></span><p className="mt-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-ink-soft">{label}</p></div>;
}
