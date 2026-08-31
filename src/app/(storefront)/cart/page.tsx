import Link from "next/link";
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl text-cocoa">{c.title}</h1>
      {sp.cancelled && <Alert tone="info" className="mt-6">{c.cancelled}</Alert>}
      {totals.discountError && <Alert className="mt-6">{totals.discountError}</Alert>}
      {!cart || cart.items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-sand p-12 text-center"><p className="text-ink-soft">{c.empty}</p><Button href="/shop" className="mt-6">{c.continue}</Button></div>
      ) : (
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_340px]">
          <div className="divide-y divide-sand">{cart.items.map((item) => <CartLine key={item.id} item={item} currency={cart.currency} labels={{ remove: c.remove, wishlist: c.moveToWishlist }} />)}</div>
          <aside className="h-fit space-y-5 rounded-3xl bg-white p-6 md:sticky md:top-32">
            <PromoForm current={cart.discount?.code ?? null} labels={{ promo: c.promo, apply: c.apply }} />
            <div className="space-y-2 text-sm">
              <Row label={c.subtotal} value={formatCents(totals.subtotalCents, cart.currency)} />
              {totals.discountCents > 0 && <Row label={`${c.discount} (${cart.discount?.code})`} value={`−${formatCents(totals.discountCents, cart.currency)}`} accent />}
              {est && <Row label={`${c.shippingEstimate} (${est.country})`} value={est.shippingCents == null ? "—" : est.shippingCents === 0 ? "Free" : formatCents(est.shippingCents, cart.currency)} muted />}
              {est?.taxCents != null && <Row label={c.taxEstimate} value={formatCents(est.taxCents, cart.currency)} muted />}
              <div className="flex justify-between border-t border-sand pt-2 text-base font-semibold"><span>{c.total}</span><span>{formatCents(afterDiscount + (est?.shippingCents ?? 0) + (est?.taxCents ?? 0), cart.currency)}</span></div>
            </div>
            <Button href="/checkout" size="lg" className="w-full">{c.checkout}</Button>
            <Link href="/shop" className="block text-center text-sm underline">{c.continue}</Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return <div className={`flex justify-between ${accent ? "text-flame" : muted ? "text-ink-soft" : ""}`}><span>{label}</span><span>{value}</span></div>;
}
