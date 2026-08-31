import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyOrder } from "@/server/orders";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getMyOrder(id);
  if (!o) notFound();

  const a = (o.shippingAddress ?? {}) as Record<string, string | undefined>;
  const paymentTone = o.payment?.status === "SUCCEEDED" ? "green" : o.payment?.status === "FAILED" ? "red" : "neutral";

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-ink-soft hover:text-flame">← Back to orders</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl text-cocoa">Order #{o.number}</h2>
          <p className="mt-1 text-sm text-ink-soft">Placed {formatDate(o.createdAt)} · {o.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
          {o.payment && <Badge tone={paymentTone}>Payment {o.payment.status}</Badge>}
        </div>
      </div>

      {o.shipment?.trackingNumber && (
        <div className="mt-6 rounded-2xl border border-sand bg-petal px-4 py-4 text-sm">
          <p className="font-medium text-cocoa">Shipment tracking</p>
          <p className="mt-1 text-ink-soft">{o.shipment.carrier ?? "Carrier"} · {o.shipment.trackingNumber}</p>
          {o.shipment.trackingUrl && <a className="mt-2 inline-block font-medium text-flame underline" href={o.shipment.trackingUrl} target="_blank" rel="noreferrer">Track package</a>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <ul className="divide-y divide-sand rounded-3xl bg-white text-sm">
            {o.items.map((i) => {
              const options = (i.options ?? {}) as Record<string, string>;
              return (
                <li key={i.id} className="flex gap-4 px-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-petal">
                    {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{i.productName}</p>
                        <p className="text-ink-soft">{i.variantName}</p>
                      </div>
                      <p className="font-semibold text-cocoa">{formatCents(i.totalCents, o.currency)}</p>
                    </div>
                    {Object.keys(options).length > 0 && <p className="mt-2 text-xs text-ink-soft">{Object.entries(options).map(([k, v]) => `${k}: ${k === "length" ? `${v}\"` : v}`).join(" · ")}</p>}
                    <p className="mt-1 text-xs text-ink-soft">SKU {i.sku} · Qty {i.quantity} · {formatCents(i.unitCents, o.currency)} each</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="rounded-3xl bg-white p-5 text-sm">
            <p className="font-semibold">Order total</p>
            <div className="mt-3 space-y-2 text-ink-soft">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(o.subtotalCents, o.currency)}</span></div>
              {o.discountCents > 0 && <div className="flex justify-between text-flame"><span>Discount{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{formatCents(o.discountCents, o.currency)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{formatCents(o.shippingCents, o.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCents(o.taxCents, o.currency)}</span></div>
              <div className="flex justify-between border-t border-sand pt-2 text-base font-semibold text-ink"><span>Total</span><span>{formatCents(o.totalCents, o.currency)}</span></div>
              {o.refundedCents > 0 && <div className="flex justify-between font-medium text-flame"><span>Refunded</span><span>{formatCents(o.refundedCents, o.currency)}</span></div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-5 text-sm">
            <p className="font-semibold">Shipping to</p>
            <p className="mt-2 whitespace-pre-line text-ink-soft">{[
              a.fullName,
              a.line1,
              a.line2,
              [a.city, a.region, a.postalCode].filter(Boolean).join(", "),
              a.country,
              a.phone,
            ].filter(Boolean).join("\n")}</p>
            {o.shippingRate && <p className="mt-3 border-t border-sand pt-3 text-ink-soft">Delivery: {o.shippingRate.name}</p>}
          </div>

          {o.payment && (
            <div className="rounded-3xl bg-white p-5 text-sm">
              <p className="font-semibold">Payment</p>
              <div className="mt-2 space-y-1 text-ink-soft">
                <p>Status: <span className="font-medium text-ink">{o.payment.status}</span></p>
                <p>Provider: {o.payment.provider}</p>
                {o.payment.method && <p>Method: {o.payment.method}</p>}
                <p>Amount: {formatCents(o.payment.amountCents, o.payment.currency)}</p>
              </div>
            </div>
          )}

          <div className="rounded-3xl bg-white p-5 text-sm">
            <p className="font-semibold">Timeline</p>
            <ol className="mt-3 space-y-4">
              {o.history.map((h, index) => (
                <li key={h.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2.5 rounded-full bg-cocoa" />
                  {index < o.history.length - 1 && <span className="absolute left-[4px] top-4 h-[calc(100%+0.5rem)] w-px bg-sand" />}
                  <span className="font-medium">{ORDER_STATUS_LABELS[h.status]}</span>
                  <span className="block text-xs text-ink-soft">{formatDateTime(h.createdAt)}</span>
                  {h.note && <span className="mt-1 block text-xs text-ink-soft">{h.note}</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
