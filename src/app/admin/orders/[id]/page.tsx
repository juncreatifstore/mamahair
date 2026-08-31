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
  const paymentAmount = o.payment?.amountCents ?? o.totalCents;
  const paymentRefunded = o.payment?.refundedCents ?? o.refundedCents;
  const netCollected = Math.max(0, paymentAmount - paymentRefunded);
  const itemCount = o.items.reduce((sum, item) => sum + item.quantity, 0);
  const next = { PENDING_PAYMENT: ["CANCELLED"], PAID: ["PROCESSING", "READY_TO_SHIP", "SHIPPED", "CANCELLED"], PROCESSING: ["READY_TO_SHIP", "SHIPPED", "CANCELLED"], READY_TO_SHIP: ["SHIPPED", "PROCESSING", "CANCELLED"], SHIPPED: ["DELIVERED"], DELIVERED: [], CANCELLED: [], REFUNDED: [], PARTIALLY_REFUNDED: ["PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] }[o.status];
  const options = (value: unknown) => Object.entries((value ?? {}) as Record<string, string>);

  const runStatus = async (fd: FormData) => {
    "use server";
    const r = await updateOrderStatus(id, fd);
    if (r.error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(r.error)}`);
  };

  return (
    <>
      <PageHeader title={`Order #${o.number}`} sub={`${formatDateTime(o.createdAt)} · ${o.email}${o.phone ? ` · ${o.phone}` : ""}`}>
        <Badge tone={statusTone[o.status]} className="text-sm">{ORDER_STATUS_LABELS[o.status]}</Badge>
        <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your ${b.storeName} order #${o.number}`)}`} className="rounded-pill border border-sand bg-white px-4 py-2 text-sm">Email customer</a>
        <PrintButton />
      </PageHeader>

      {sp.error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Order total" value={formatCents(o.totalCents, o.currency)} />
        <Summary label="Items" value={String(itemCount)} />
        <Summary label="Payment" value={o.payment?.status ?? "—"} />
        <Summary label="Net collected" value={formatCents(netCollected, o.currency)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {!["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status) && (
            <Card title="Next action" className="no-print">
              <div className="flex flex-wrap gap-2">
                {o.status === "PAID" && <QuickStatus action={runStatus} status="PROCESSING" label="Start processing" />}
                {o.status === "PROCESSING" && <QuickStatus action={runStatus} status="READY_TO_SHIP" label="Mark ready to ship" />}
                {o.status === "SHIPPED" && <QuickStatus action={runStatus} status="DELIVERED" label="Mark delivered" />}
                {(o.status === "READY_TO_SHIP" || o.status === "PROCESSING" || o.status === "PAID" || o.status === "PARTIALLY_REFUNDED") && <span className="rounded-pill bg-petal px-4 py-2 text-sm text-cocoa">To ship: enter carrier + tracking below</span>}
              </div>
            </Card>
          )}

          <Card title="Items">
            <ul className="divide-y divide-sand text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex gap-3 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-petal">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-xs text-ink-soft">{i.variantName} · SKU {i.sku}</p>
                    {options(i.options).length > 0 && <div className="mt-1 flex flex-wrap gap-1">{options(i.options).map(([key, value]) => <span key={key} className="rounded-full bg-petal px-2 py-0.5 text-[10px] text-cocoa">{key}: {key === "length" ? `${value}\"` : value}</span>)}</div>}
                    <p className="mt-1 text-xs text-ink-soft">{formatCents(i.unitCents, o.currency)} × {i.quantity}</p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatCents(i.totalCents, o.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-sand pt-3 text-sm text-ink-soft">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCents(o.subtotalCents, o.currency)}</span></div>
              {o.discountCents > 0 && <div className="flex justify-between text-flame"><span>Discount {o.discountCode}</span><span>−{formatCents(o.discountCents, o.currency)}</span></div>}
              <div className="flex justify-between"><span>Shipping ({o.shippingRate?.name ?? "—"})</span><span>{formatCents(o.shippingCents, o.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCents(o.taxCents, o.currency)}</span></div>
              <div className="flex justify-between border-t border-sand pt-2 text-base font-semibold text-ink"><span>Total</span><span>{formatCents(o.totalCents, o.currency)}</span></div>
              {o.refundedCents > 0 && <div className="flex justify-between text-flame"><span>Refunded</span><span>−{formatCents(o.refundedCents, o.currency)}</span></div>}
            </div>
          </Card>

          <Card title="Fulfillment & status" className="no-print">
            {next.length === 0 ? <p className="text-sm text-ink-soft">This order is final.</p> : (
              <form action={runStatus} className="space-y-4">
                <Field label="New status"><Select name="status" defaultValue={next[0]}>{next.map((k) => <option key={k} value={k}>{ORDER_STATUS_LABELS[k]}</option>)}</Select></Field>
                <p className="text-xs text-ink-soft">Shipping requires a carrier and tracking number. Marking Shipped sends the tracking email. Processing and Delivered notify the customer. Cancelling returns stock but does not automatically refund a captured payment.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Carrier" hint="Required for Shipped"><Input name="carrier" defaultValue={o.shipment?.carrier ?? ""} placeholder="USPS, UPS, DHL…" /></Field>
                  <Field label="Tracking number" hint="Required for Shipped"><Input name="trackingNumber" defaultValue={o.shipment?.trackingNumber ?? ""} /></Field>
                  <Field label="Tracking URL" hint="Optional http/https URL"><Input name="trackingUrl" type="url" defaultValue={o.shipment?.trackingUrl ?? ""} placeholder="https://…" /></Field>
                </div>
                <Field label="Note for the timeline"><Input name="note" placeholder="Optional internal status note" /></Field>
                <SubmitButton>Update order</SubmitButton>
              </form>
            )}
          </Card>

          <Card title="Internal notes" className="no-print">
            <form action={async (fd) => { "use server"; await saveInternalNote(id, fd); }} className="space-y-3">
              <Textarea name="internalNotes" defaultValue={o.internalNotes ?? ""} className="min-h-24" placeholder="Only visible to staff" />
              <SubmitButton size="sm" variant="ghost">Save notes</SubmitButton>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-medium">{o.user ? [o.user.firstName, o.user.lastName].filter(Boolean).join(" ") || o.email : "Guest customer"}</p>
            <a href={`mailto:${o.email}`} className="mt-1 block break-all text-sm text-flame underline">{o.email}</a>
            {o.phone && <a href={`tel:${o.phone}`} className="mt-1 block text-sm text-ink-soft">{o.phone}</a>}
            {o.user && <a href={`/admin/customers/${o.user.id}`} className="mt-3 inline-block text-xs underline">View full customer profile</a>}
          </Card>

          <Card title="Finance">
            <div className="space-y-2 text-sm">
              <FinanceRow label="Order total" value={formatCents(o.totalCents, o.currency)} />
              <FinanceRow label="Payment amount" value={formatCents(paymentAmount, o.currency)} />
              <FinanceRow label="Refunded" value={formatCents(paymentRefunded, o.currency)} muted={paymentRefunded === 0} />
              <FinanceRow label="Net collected" value={formatCents(netCollected, o.currency)} strong />
            </div>
            <div className="mt-4 border-t border-sand pt-3 text-xs text-ink-soft">
              <p>{o.payment?.provider ?? "Payment"} · {o.payment?.status ?? "—"}{o.payment?.method ? ` · ${o.payment.method}` : ""}</p>
              {o.payment?.intentId && <p className="mt-1 break-all">Intent: {o.payment.intentId}</p>}
              {o.payment?.providerId && <p className="mt-1 break-all">Provider ref: {o.payment.providerId}</p>}
              {o.paidAt && <p className="mt-1">Paid {formatDateTime(o.paidAt)}</p>}
            </div>
            {o.expiresAt && o.status === "PENDING_PAYMENT" && <p className="mt-3 text-xs text-amber-700">Reservation expires {formatDateTime(o.expiresAt)}</p>}
            {refundable > 0 && (
              <form action={async (fd) => { "use server"; const r = await refundOrder(id, fd); if (r.error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(r.error)}`); }} className="no-print mt-4 space-y-2 border-t border-sand pt-4">
                <Field label={`Refund amount (max ${fromCents(refundable)} ${o.currency})`} hint="Leave empty for the remaining refundable amount"><Input name="amount" type="number" step="0.01" min="0.01" max={fromCents(refundable)} /></Field>
                <SubmitButton variant="danger" size="sm" pendingText="Refunding…">Refund</SubmitButton>
              </form>
            )}
          </Card>

          <Card title="Shipment">
            {o.shipment ? (
              <div className="space-y-2 text-sm">
                <FinanceRow label="Carrier" value={o.shipment.carrier ?? "—"} />
                <FinanceRow label="Tracking" value={o.shipment.trackingNumber ?? "—"} />
                {o.shipment.shippedAt && <FinanceRow label="Shipped" value={formatDateTime(o.shipment.shippedAt)} />}
                {o.shipment.deliveredAt && <FinanceRow label="Delivered" value={formatDateTime(o.shipment.deliveredAt)} />}
                {o.shipment.trackingUrl && <a href={o.shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-flame underline">Open tracking ↗</a>}
              </div>
            ) : <p className="text-sm text-ink-soft">No shipment created yet.</p>}
          </Card>

          <Card title="Shipping address">
            <p className="whitespace-pre-line text-sm">{[a.fullName, a.line1, a.line2, `${a.city}${a.region ? ", " + a.region : ""} ${a.postalCode ?? ""}`, a.country, a.phone].filter(Boolean).join("\n")}</p>
            {o.shippingRate && <p className="mt-3 text-xs text-ink-soft">Method: {o.shippingRate.name}</p>}
            {o.notes && <p className="mt-3 rounded-xl bg-petal p-3 text-xs">Customer note: {o.notes}</p>}
          </Card>

          <Card title="Timeline">
            <ol className="space-y-3 text-sm">{o.history.map((h, index) => <li key={h.id} className="relative border-l-2 border-peach pl-4"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-cocoa" /><span className="font-medium">{ORDER_STATUS_LABELS[h.status]}</span><span className="block text-xs text-ink-soft">{formatDateTime(h.createdAt)}{h.actor ? ` · ${h.actor}` : ""}</span>{h.note && <span className="mt-1 block text-xs">{h.note}</span>}{index === o.history.length - 1 && <span className="mt-1 block text-[10px] uppercase tracking-wide text-flame">Current</span>}</li>)}</ol>
          </Card>
        </div>
      </div>
    </>
  );
}

function QuickStatus({ action, status, label }: { action: (formData: FormData) => Promise<void>; status: string; label: string }) {
  return <form action={action}><input type="hidden" name="status" value={status} /><button className="rounded-pill bg-cocoa px-4 py-2 text-sm font-medium text-cream hover:opacity-90">{label}</button></form>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-sand bg-white p-4"><p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p><p className="mt-2 text-xl font-semibold text-cocoa">{value}</p></div>;
}

function FinanceRow({ label, value, strong = false, muted = false }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return <div className={`flex justify-between gap-3 ${strong ? "font-semibold text-ink" : muted ? "text-ink-soft" : ""}`}><span>{label}</span><span className="text-right">{value}</span></div>;
}
