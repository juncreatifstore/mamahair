import Image from "next/image";
import { notFound } from "next/navigation";
import { getMyOrder } from "@/server/orders";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getMyOrder(id);
  if (!o) notFound();
  const a = o.shippingAddress as Record<string, string>;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl text-cocoa">Order #{o.number}</h2><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></div>
      <p className="mt-1 text-sm text-ink-soft">Placed {formatDate(o.createdAt)}</p>
      {o.shipment?.trackingNumber && <div className="mt-5 rounded-2xl bg-petal px-4 py-3 text-sm">{o.shipment.carrier ?? "Tracking"}: {o.shipment.trackingUrl ? <a className="text-flame underline" href={o.shipment.trackingUrl} target="_blank" rel="noreferrer">{o.shipment.trackingNumber}</a> : o.shipment.trackingNumber}</div>}
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
        <ul className="divide-y divide-sand rounded-3xl bg-white text-sm">
          {o.items.map((i) => <li key={i.id} className="flex items-center gap-3 px-5 py-3"><div className="relative size-12 overflow-hidden rounded-lg bg-petal">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="48px" className="object-cover" />}</div><span className="flex-1">{i.productName} <span className="text-ink-soft">· {i.variantName} × {i.quantity}</span></span><span>{formatCents(i.totalCents, o.currency)}</span></li>)}
          <li className="space-y-1 px-5 py-3 text-ink-soft">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(o.subtotalCents, o.currency)}</span></div>
            {o.discountCents > 0 && <div className="flex justify-between"><span>Discount</span><span>−{formatCents(o.discountCents, o.currency)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{formatCents(o.shippingCents, o.currency)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatCents(o.taxCents, o.currency)}</span></div>
            <div className="flex justify-between font-semibold text-ink"><span>Total</span><span>{formatCents(o.totalCents, o.currency)}</span></div>
            {o.refundedCents > 0 && <div className="flex justify-between text-flame"><span>Refunded</span><span>{formatCents(o.refundedCents, o.currency)}</span></div>}
          </li>
        </ul>
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-5 text-sm"><p className="font-semibold">Shipping to</p><p className="mt-2 whitespace-pre-line text-ink-soft">{[a.fullName, a.line1, a.line2, `${a.city}${a.region ? ", " + a.region : ""} ${a.postalCode ?? ""}`, a.country, a.phone].filter(Boolean).join("\n")}</p>{o.shippingRate && <p className="mt-3 text-ink-soft">{o.shippingRate.name}</p>}</div>
          <div className="rounded-3xl bg-white p-5 text-sm"><p className="font-semibold">Timeline</p><ol className="mt-2 space-y-2">{o.history.map((h) => <li key={h.id}><span className="font-medium">{ORDER_STATUS_LABELS[h.status]}</span><span className="block text-xs text-ink-soft">{formatDateTime(h.createdAt)}</span></li>)}</ol></div>
        </div>
      </div>
    </div>
  );
}
