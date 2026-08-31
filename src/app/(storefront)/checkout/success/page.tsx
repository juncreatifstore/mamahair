import Image from "next/image";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { Badge, statusTone } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

export const metadata = { title: "Order received", robots: { index: false } };

type ShippingAddress = {
  fullName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Payment pending",
  SUCCEEDED: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

/** Le statut affiché vient de la base (webhook), jamais du simple redirect Stripe. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: id } = await searchParams;
  const order = id
    ? await db.order.findUnique({
        where: { id },
        include: {
          items: true,
          payment: true,
          shipment: true,
          shippingRate: { select: { name: true, minDays: true, maxDays: true } },
        },
      })
    : null;

  const pending = order?.status === "PENDING_PAYMENT";
  const address = (order?.shippingAddress ?? {}) as ShippingAddress;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      {pending && <meta httpEquiv="refresh" content="5" />}

      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-green-50 text-2xl text-green-700">✓</div>
        <h1 className="mt-5 text-4xl text-cocoa sm:text-5xl">Thank you</h1>
        {order ? (
          <p className="mt-4 text-ink-soft">
            Order <strong className="text-ink">#{order.number}</strong>{" "}
            {pending
              ? "was received. We're confirming your payment now; this page refreshes automatically."
              : "has been received successfully."}{" "}
            A confirmation is sent to <strong className="text-ink">{order.email}</strong>.
          </p>
        ) : (
          <p className="mt-4 text-ink-soft">Your payment was received. A confirmation email is on its way.</p>
        )}
      </div>

      {order && (
        <>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Badge tone={statusTone[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
            {order.payment && <Badge tone={order.payment.status === "SUCCEEDED" ? "green" : order.payment.status === "FAILED" ? "red" : "neutral"}>{PAYMENT_LABELS[order.payment.status] ?? order.payment.status}</Badge>}
            {order.shipment?.trackingNumber && <Badge tone="honey">Tracking available</Badge>}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-3xl bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Order</p>
                  <h2 className="mt-1 text-2xl text-cocoa">#{order.number}</h2>
                </div>
                <p className="text-right text-xs text-ink-soft">Placed<br />{order.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
              </div>

              <ul className="mt-5 divide-y divide-sand">
                {order.items.map((i) => {
                  const options = (i.options ?? {}) as Record<string, string>;
                  return (
                    <li key={i.id} className="flex gap-4 py-4">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-petal">
                        {i.imageUrl ? <Image src={i.imageUrl} alt={i.productName} fill sizes="80px" className="object-cover" /> : <span className="grid h-full place-items-center text-2xl text-cocoa/30">{i.productName.charAt(0)}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink">{i.productName}</p>
                            <p className="text-sm text-ink-soft">{i.variantName}</p>
                          </div>
                          <p className="shrink-0 font-semibold text-cocoa">{formatCents(i.totalCents, order.currency)}</p>
                        </div>
                        {Object.keys(options).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                            {Object.entries(options).map(([k, v]) => <span key={k}><span className="capitalize">{k}</span>: {k === "length" ? `${v}\"` : v}</span>)}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
                          <span>SKU {i.sku}</span>
                          <span>Qty {i.quantity}</span>
                          <span>{formatCents(i.unitCents, order.currency)} each</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 space-y-2 border-t border-sand pt-4 text-sm">
                <AmountRow label="Subtotal" value={formatCents(order.subtotalCents, order.currency)} />
                {order.discountCents > 0 && <AmountRow label={order.discountCode ? `Discount (${order.discountCode})` : "Discount"} value={`−${formatCents(order.discountCents, order.currency)}`} />}
                <AmountRow label="Shipping" value={order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents, order.currency)} />
                {order.taxCents > 0 && <AmountRow label="Tax" value={formatCents(order.taxCents, order.currency)} />}
                <div className="flex justify-between border-t border-sand pt-3 text-lg font-semibold text-cocoa"><span>Total</span><span>{formatCents(order.totalCents, order.currency)}</span></div>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="rounded-3xl bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Shipping address</p>
                <div className="mt-3 text-sm leading-6">
                  {address.fullName && <p className="font-semibold">{address.fullName}</p>}
                  {address.line1 && <p>{address.line1}</p>}
                  {address.line2 && <p>{address.line2}</p>}
                  <p>{[address.city, address.region, address.postalCode].filter(Boolean).join(", ")}</p>
                  {address.country && <p>{address.country}</p>}
                  {address.phone && <p className="mt-2 text-ink-soft">{address.phone}</p>}
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Delivery</p>
                <p className="mt-3 text-sm font-semibold">{order.shippingRate?.name ?? "Shipping method"}</p>
                {order.shippingRate?.minDays && order.shippingRate?.maxDays && <p className="mt-1 text-xs text-ink-soft">Estimated {order.shippingRate.minDays}–{order.shippingRate.maxDays} business days after fulfillment.</p>}
                {order.shipment ? (
                  <div className="mt-4 border-t border-sand pt-4 text-sm">
                    {order.shipment.carrier && <p><span className="text-ink-soft">Carrier:</span> {order.shipment.carrier}</p>}
                    {order.shipment.trackingNumber && <p className="mt-1"><span className="text-ink-soft">Tracking:</span> {order.shipment.trackingNumber}</p>}
                    {order.shipment.trackingUrl && <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-flame underline">Track shipment</a>}
                  </div>
                ) : <p className="mt-3 text-xs text-ink-soft">Tracking will appear here once your order ships.</p>}
              </section>

              {order.payment && (
                <section className="rounded-3xl bg-white p-5 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Payment</p>
                  <p className="mt-3 font-semibold">{PAYMENT_LABELS[order.payment.status] ?? order.payment.status}</p>
                  <p className="mt-1 text-ink-soft">{order.payment.provider.replace("_", " ")}{order.payment.method ? ` · ${order.payment.method.replace(/_/g, " ")}` : ""}</p>
                  {order.payment.refundedCents > 0 && <p className="mt-2 text-ink-soft">Refunded: {formatCents(order.payment.refundedCents, order.currency)}</p>}
                </section>
              )}
            </aside>
          </div>
        </>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button href="/shop">Keep shopping</Button>
        <Button href="/account/orders" variant="ghost">My orders</Button>
      </div>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-ink-soft">{label}</span><span>{value}</span></div>;
}
