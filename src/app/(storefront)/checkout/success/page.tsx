import Image from "next/image";
import { ArrowRight, Check, CreditCard, Mail, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/payments/stripe";
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

async function resolveAuthorizedOrderId(sessionId?: string, legacyOrderId?: string) {
  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const orderId = session.metadata?.orderId || session.client_reference_id || null;
      if (orderId) return { orderId, sessionId };
    } catch {
      return { orderId: null, sessionId: null };
    }
  }

  if (legacyOrderId) {
    const user = await getCurrentUser();
    if (!user) return { orderId: null, sessionId: null };
    const owned = await db.order.findFirst({ where: { id: legacyOrderId, userId: user.id }, select: { id: true } });
    if (owned) return { orderId: owned.id, sessionId: null };
  }

  return { orderId: null, sessionId: null };
}

/** Le statut affiché vient de la base (webhook), jamais du simple redirect Stripe. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string; order?: string }> }) {
  const sp = await searchParams;
  const access = await resolveAuthorizedOrderId(sp.session_id, sp.order);

  let order = access.orderId
    ? await db.order.findUnique({
        where: { id: access.orderId },
        include: {
          items: true,
          payment: true,
          shipment: true,
          shippingRate: { select: { name: true, minDays: true, maxDays: true } },
        },
      })
    : null;

  if (order && access.sessionId && order.payment?.providerId !== access.sessionId) order = null;

  const pending = order?.status === "PENDING_PAYMENT";
  const paid = order?.payment?.status === "SUCCEEDED";
  const shipped = !!order?.shipment?.trackingNumber;
  const address = (order?.shippingAddress ?? {}) as ShippingAddress;

  return (
    <div className="pb-20">
      {pending && <meta httpEquiv="refresh" content="5" />}

      <section className="border-b border-sand/70 bg-[linear-gradient(135deg,#fbf6f1_0%,#f6e7dc_52%,#faefe7_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-cocoa text-cream shadow-[0_14px_35px_rgba(74,27,12,.18)]">
            <PackageCheck className="size-7" />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-flame">MAMAHAIR ORDER CONFIRMATION</p>
          <h1 className="mt-2 text-4xl leading-tight text-cocoa sm:text-5xl lg:text-6xl">Thank you for your order.</h1>
          {order ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
              Order <strong className="text-cocoa">#{order.number}</strong>{" "}
              {pending
                ? "was received. We are confirming your payment now and this page refreshes automatically."
                : "is confirmed and moving through our fulfillment process."}{" "}
              A confirmation is sent to <strong className="text-cocoa">{order.email}</strong>.
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-ink-soft">
              Your checkout was completed. For privacy, order details are only shown from a valid payment session or inside the customer account.
            </p>
          )}

          {order && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Badge tone={statusTone[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
              {order.payment && <Badge tone={order.payment.status === "SUCCEEDED" ? "green" : order.payment.status === "FAILED" ? "red" : "neutral"}>{PAYMENT_LABELS[order.payment.status] ?? order.payment.status}</Badge>}
              {shipped && <Badge tone="honey">Tracking available</Badge>}
            </div>
          )}
        </div>
      </section>

      {order ? (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <section className="rounded-[1.75rem] border border-sand/70 bg-white p-4 shadow-[0_16px_45px_rgba(74,27,12,.04)] sm:p-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ProgressStep icon={Check} label="Order placed" active done />
              <ProgressStep icon={CreditCard} label={paid ? "Payment confirmed" : "Payment confirmation"} active={paid || pending} done={paid} />
              <ProgressStep icon={PackageCheck} label="Preparation" active={paid && !shipped} done={shipped} />
              <ProgressStep icon={Truck} label="Shipped" active={shipped} done={shipped} />
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <section className="overflow-hidden rounded-[1.85rem] border border-sand/70 bg-white shadow-[0_16px_45px_rgba(74,27,12,.04)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sand/70 px-5 py-5 sm:px-7">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Order summary</p>
                  <h2 className="mt-1 text-2xl text-cocoa sm:text-3xl">#{order.number}</h2>
                </div>
                <div className="text-right text-xs leading-5 text-ink-soft">
                  <span className="block">Placed</span>
                  <strong className="font-semibold text-cocoa">{order.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</strong>
                </div>
              </div>

              <ul className="divide-y divide-sand/70 px-5 sm:px-7">
                {order.items.map((i) => {
                  const options = (i.options ?? {}) as Record<string, string>;
                  return (
                    <li key={i.id} className="flex gap-3 py-5 sm:gap-4">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-petal ring-1 ring-sand/70 sm:size-24">
                        {i.imageUrl ? <Image src={i.imageUrl} alt={i.productName} fill sizes="96px" className="object-cover" /> : <span className="grid h-full place-items-center text-2xl text-cocoa/30">{i.productName.charAt(0)}</span>}
                        <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-cocoa text-[10px] font-bold text-cream">{i.quantity}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold leading-snug text-cocoa">{i.productName}</p>
                            <p className="mt-1 text-xs text-ink-soft">{i.variantName}</p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-cocoa sm:text-base">{formatCents(i.totalCents, order.currency)}</p>
                        </div>
                        {Object.keys(options).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {Object.entries(options).map(([k, v]) => <span key={k} className="rounded-full bg-cream px-2.5 py-1 text-[10px] text-ink-soft">{k === "length" ? `${v}\"` : v}</span>)}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-ink-soft sm:text-xs">
                          <span>SKU {i.sku}</span>
                          <span>{formatCents(i.unitCents, order.currency)} each</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="bg-[#fcf8f5] px-5 py-5 sm:px-7">
                <div className="ml-auto max-w-sm space-y-2.5 text-sm">
                  <AmountRow label="Subtotal" value={formatCents(order.subtotalCents, order.currency)} />
                  {order.discountCents > 0 && <AmountRow label={order.discountCode ? `Discount (${order.discountCode})` : "Discount"} value={`−${formatCents(order.discountCents, order.currency)}`} accent />}
                  <AmountRow label="Shipping" value={order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents, order.currency)} />
                  {order.taxCents > 0 && <AmountRow label="Tax" value={formatCents(order.taxCents, order.currency)} />}
                  <div className="flex justify-between border-t border-sand pt-3 text-lg font-bold text-cocoa"><span>Total</span><span>{formatCents(order.totalCents, order.currency)}</span></div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <InfoCard icon={Mail} eyebrow="Confirmation" title={order.email} text="We send order and shipping updates to this email." />

              <section className="rounded-[1.6rem] border border-sand/70 bg-white p-5">
                <div className="flex items-center gap-2 text-cocoa"><Truck className="size-4 text-flame" /><p className="text-[10px] font-bold uppercase tracking-[.14em]">Delivery</p></div>
                <p className="mt-3 text-sm font-semibold text-cocoa">{order.shippingRate?.name ?? "Shipping method"}</p>
                {order.shippingRate?.minDays && order.shippingRate?.maxDays && <p className="mt-1 text-xs leading-5 text-ink-soft">Estimated {order.shippingRate.minDays}–{order.shippingRate.maxDays} business days after fulfillment.</p>}
                <div className="mt-4 border-t border-sand/70 pt-4 text-sm leading-6">
                  {address.fullName && <p className="font-semibold text-cocoa">{address.fullName}</p>}
                  {address.line1 && <p>{address.line1}</p>}
                  {address.line2 && <p>{address.line2}</p>}
                  <p>{[address.city, address.region, address.postalCode].filter(Boolean).join(", ")}</p>
                  {address.country && <p>{address.country}</p>}
                  {address.phone && <p className="mt-2 text-xs text-ink-soft">{address.phone}</p>}
                </div>
                {order.shipment ? (
                  <div className="mt-4 rounded-2xl bg-cream p-4 text-sm">
                    {order.shipment.carrier && <p><span className="text-ink-soft">Carrier:</span> {order.shipment.carrier}</p>}
                    {order.shipment.trackingNumber && <p className="mt-1"><span className="text-ink-soft">Tracking:</span> {order.shipment.trackingNumber}</p>}
                    {order.shipment.trackingUrl && <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-flame">Track shipment <ArrowRight className="size-3.5" /></a>}
                  </div>
                ) : <p className="mt-3 text-xs leading-5 text-ink-soft">Tracking will appear once your order has been prepared and handed to the carrier.</p>}
              </section>

              {order.payment && (
                <section className="rounded-[1.6rem] border border-sand/70 bg-white p-5">
                  <div className="flex items-center gap-2 text-cocoa"><ShieldCheck className="size-4 text-flame" /><p className="text-[10px] font-bold uppercase tracking-[.14em]">Payment</p></div>
                  <p className="mt-3 text-sm font-semibold text-cocoa">{PAYMENT_LABELS[order.payment.status] ?? order.payment.status}</p>
                  <p className="mt-1 text-xs capitalize text-ink-soft">{order.payment.provider.replace("_", " ")}{order.payment.method ? ` · ${order.payment.method.replace(/_/g, " ")}` : ""}</p>
                  {order.payment.refundedCents > 0 && <p className="mt-2 text-xs text-ink-soft">Refunded: {formatCents(order.payment.refundedCents, order.currency)}</p>}
                </section>
              )}
            </aside>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button href="/account/orders" size="lg" className="justify-center">View my orders</Button>
            <Button href="/shop" size="lg" variant="ghost" className="justify-center">Keep shopping</Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-10 text-center sm:px-6">
          <div className="rounded-[1.75rem] border border-sand bg-white p-7 shadow-[0_16px_45px_rgba(74,27,12,.04)]">
            <ShieldCheck className="mx-auto size-7 text-cocoa" />
            <h2 className="mt-4 text-2xl text-cocoa">Your order details are protected</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Open your account to view your orders, or return to the shop if you checked out without an active confirmation session.</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button href="/account/orders">My orders</Button>
              <Button href="/shop" variant="ghost">Shop</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressStep({ icon: Icon, label, active, done }: { icon: typeof Check; label: string; active?: boolean; done?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-3 text-center transition ${active ? "bg-petal text-cocoa" : "bg-cream text-ink-soft"}`}>
      <span className={`mx-auto grid size-8 place-items-center rounded-full ${done ? "bg-cocoa text-cream" : active ? "bg-white text-flame" : "bg-white text-ink-soft"}`}><Icon className="size-4" /></span>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[.06em] sm:text-[11px]">{label}</p>
    </div>
  );
}

function AmountRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`flex justify-between gap-4 ${accent ? "font-semibold text-flame" : "text-ink-soft"}`}><span>{label}</span><span className={accent ? "" : "text-ink"}>{value}</span></div>;
}

function InfoCard({ icon: Icon, eyebrow, title, text }: { icon: typeof Mail; eyebrow: string; title: string; text: string }) {
  return <section className="rounded-[1.6rem] border border-sand/70 bg-white p-5"><div className="flex items-center gap-2 text-cocoa"><Icon className="size-4 text-flame" /><p className="text-[10px] font-bold uppercase tracking-[.14em]">{eyebrow}</p></div><p className="mt-3 break-all text-sm font-semibold text-cocoa">{title}</p><p className="mt-2 text-xs leading-5 text-ink-soft">{text}</p></section>;
}
