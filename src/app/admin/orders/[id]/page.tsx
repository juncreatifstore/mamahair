import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { adminGetOrder, updateOrderStatus, refundOrder, saveInternalNote } from "@/server/admin/orders";
import { PageHeader, Card } from "@/components/admin/ui";
import { Badge, statusTone } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PrintButton } from "@/components/admin/print-button";
import { formatCents, fromCents } from "@/lib/money";
import { formatDateTime, ORDER_STATUS_LABELS } from "@/lib/utils";
import { getBrand } from "@/lib/settings";

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, sp, b] = await Promise.all([params, searchParams, getBrand()]);
  const o = await adminGetOrder(id);
  if (!o) notFound();
  const a = o.shippingAddress as Record<string, string>;
  const refundable = o.payment && ["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(o.payment.status) ? o.payment.amountCents - o.payment.refundedCents : 0;
  const next = { PENDING_PAYMENT: ["CANCELLED"], PAID: ["PROCESSING", "READY_TO_SHIP", "SHIPPED", "CANCELLED"], PROCESSING: ["READY_TO_SHIP", "SHIPPED", "CANCELLED"], READY_TO_SHIP: ["SHIPPED", "PROCESSING", "CANCELLED"], SHIPPED: ["DELIVERED"], DELIVERED: [], CANCELLED: [], REFUNDED: [], PARTIALLY_REFUNDED: ["PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] }[o.status];

  return (
    <>
      <PageHeader title={`Order #${o.number}`} sub={`${formatDateTime(o.createdAt)} · ${o.email}${o.phone ? ` · ${o.phone}` : ""}`}>
        <Badge tone={statusTone[o.status]} className="text-sm">{ORDER_STATUS_LABELS[o.status]}</Badge>
        <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your ${b.storeName} order #${o.number}`)}`} className="rounded-pill border border-sand bg-white px-4 py-2 text-sm">Email customer</a>
        <PrintButton />
      </PageHeader>
      {sp.error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</p>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-sand text-sm">{o.items.map((i) => <li key={i.id} className="flex items-center gap-3 py-2"><div className="relative size-12 overflow-hidden rounded-lg bg-petal">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="48px" className="object-cover" />}</div><span className="flex-1">{i.productName}<span className="block text-xs text-ink-soft">{i.variantName} · {i.sku} · {formatCents(i.unitCents, o.currency)} × {i.quantity}</span></span><span>{formatCents(i.totalCents, o.currency)}</span></li>)}</ul>
            <div className="mt-3 space-y-1 border-t border-sand pt-3 text-sm text-ink-soft">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(o.subtotalCents, o.currency)}</span></div>
              {o.discountCents > 0 && <div className="flex justify-between"><span>Discount {o.discountCode}</span><span>−{formatCents(o.discountCents, o.currency)}</span></div>}
              <div className="flex justify-between"><span>Shipping ({o.shippingRate?.name ?? "—"})</span><span>{formatCents(o.shippingCents, o.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCents(o.taxCents, o.currency)}</span></div>
              <div className="flex justify-between text-base font-semibold text-ink"><span>Total</span><span>{formatCents(o.totalCents, o.currency)}</span></div>
              {o.refundedCents > 0 && <div className="flex justify-between text-flame"><span>Refunded</span><span>{formatCents(o.refundedCents, o.currency)}</span></div>}
            </div>
          </Card>

          <Card title="Update status" className="no-print">
            {next.length === 0 ? <p className="text-sm text-ink-soft">This order is final.</p> : (
              <form action={async (fd) => { "use server"; const r = await updateOrderStatus(id, fd); if (r.error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(r.error)}`); }} className="space-y-4">
                <Field label="New status"><Select name="status" defaultValue={next[0]}>{next.map((k) => <option key={k} value={k}>{ORDER_STATUS_LABELS[k]}</option>)}</Select></Field>
                <p className="text-xs text-ink-soft">Shipped → sends the tracking email. Processing / Delivered → notify the customer. Cancelled → returns stock (no automatic refund; use the refund box).</p>
                <div className="grid gap-4 sm:grid-cols-3"><Field label="Carrier"><Input name="carrier" defaultValue={o.shipment?.carrier ?? ""} placeholder="USPS, UPS, DHL…" /></Field><Field label="Tracking number"><Input name="trackingNumber" defaultValue={o.shipment?.trackingNumber ?? ""} /></Field><Field label="Tracking URL"><Input name="trackingUrl" defaultValue={o.shipment?.trackingUrl ?? ""} /></Field></div>
                <Field label="Note for the timeline"><Input name="note" /></Field>
                <SubmitButton>Update order</SubmitButton>
              </form>
            )}
          </Card>

          <Card title="Internal notes" className="no-print"><form action={async (fd) => { "use server"; await saveInternalNote(id, fd); }} className="space-y-3"><Textarea name="internalNotes" defaultValue={o.internalNotes ?? ""} className="min-h-24" placeholder="Only visible to staff" /><SubmitButton size="sm" variant="ghost">Save notes</SubmitButton></form></Card>
        </div>

        <div className="space-y-6">
          <Card title="Timeline"><ol className="space-y-3 text-sm">{o.history.map((h) => <li key={h.id} className="border-l-2 border-peach pl-3"><span className="font-medium">{ORDER_STATUS_LABELS[h.status]}</span><span className="block text-xs text-ink-soft">{formatDateTime(h.createdAt)}{h.actor ? ` · ${h.actor}` : ""}</span>{h.note && <span className="block text-xs">{h.note}</span>}</li>)}</ol></Card>
          <Card title="Shipping address"><p className="whitespace-pre-line text-sm">{[a.fullName, a.line1, a.line2, `${a.city}${a.region ? ", " + a.region : ""} ${a.postalCode ?? ""}`, a.country, a.phone].filter(Boolean).join("\n")}</p>{o.notes && <p className="mt-3 text-xs text-ink-soft">Customer note: {o.notes}</p>}</Card>
          <Card title="Payment">
            <p className="text-sm">{o.payment?.provider} · {o.payment?.status}{o.payment?.method ? ` · ${o.payment.method}` : ""}</p>
            {o.payment?.intentId && <p className="mt-1 break-all text-xs text-ink-soft">{o.payment.intentId}</p>}
            {o.expiresAt && o.status === "PENDING_PAYMENT" && <p className="mt-1 text-xs text-ink-soft">Reservation expires {formatDateTime(o.expiresAt)}</p>}
            {refundable > 0 && (
              <form action={async (fd) => { "use server"; const r = await refundOrder(id, fd); if (r.error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(r.error)}`); }} className="no-print mt-4 space-y-2">
                <Field label={`Refund amount (max ${fromCents(refundable)} ${o.currency})`} hint="Leave empty for a full refund"><Input name="amount" type="number" step="0.01" min="0.01" max={fromCents(refundable)} /></Field>
                <SubmitButton variant="danger" size="sm" pendingText="Refunding…">Refund</SubmitButton>
              </form>
            )}
          </Card>
          {o.user && <Card title="Customer"><p className="text-sm">{[o.user.firstName, o.user.lastName].filter(Boolean).join(" ") || o.user.email}</p><a href={`/admin/customers/${o.user.id}`} className="text-xs underline">View profile</a></Card>}
        </div>
      </div>
    </>
  );
}
