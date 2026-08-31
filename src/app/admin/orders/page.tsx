import Link from "next/link";
import { adminListOrders } from "@/server/admin/orders";
import { PageHeader, Table, td } from "@/components/admin/ui";
import { Badge, statusTone } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { formatDate, ORDER_STATUS_LABELS, cn } from "@/lib/utils";

const tabs = ["", "PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED", "PENDING_PAYMENT"];
const paymentStatuses = ["", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string; q?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const orders = await adminListOrders(sp);

  const metrics = orders.reduce(
    (acc, o) => {
      acc.totalOrders += 1;
      if (["PAID", "PROCESSING", "READY_TO_SHIP"].includes(o.status)) acc.toFulfill += 1;
      if (o.status === "READY_TO_SHIP") acc.readyToShip += 1;
      if (o.status === "SHIPPED") acc.inTransit += 1;
      if (o.payment?.status === "SUCCEEDED") acc.paidRevenue += o.totalCents;
      return acc;
    },
    { totalOrders: 0, toFulfill: 0, readyToShip: 0, inTransit: 0, paidRevenue: 0 },
  );
  const metricCurrency = orders.find((o) => o.payment?.status === "SUCCEEDED")?.currency ?? orders[0]?.currency ?? "USD";

  return (
    <>
      <PageHeader title="Orders" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Orders shown" value={String(metrics.totalOrders)} />
        <Metric label="To fulfill" value={String(metrics.toFulfill)} warn={metrics.toFulfill > 0} />
        <Metric label="Ready to ship" value={String(metrics.readyToShip)} warn={metrics.readyToShip > 0} />
        <Metric label="In transit" value={String(metrics.inTransit)} />
        <Metric label="Paid revenue" value={formatCents(metrics.paidRevenue, metricCurrency)} />
      </div>

      <form className="mb-4 grid gap-2 rounded-2xl border border-sand bg-white p-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_190px_auto]">
        <Input name="q" placeholder="Order #, email, name, SKU…" defaultValue={sp.q} />
        <Input name="from" type="date" defaultValue={sp.from} />
        <Input name="to" type="date" defaultValue={sp.to} />
        <Select name="payment" defaultValue={sp.payment ?? ""}>
          {paymentStatuses.map((p) => <option key={p} value={p}>{p ? `Payment: ${p.replaceAll("_", " ")}` : "Any payment"}</option>)}
        </Select>
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button className="h-11 rounded-pill bg-cocoa px-5 text-sm text-cream">Search</button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const qs = new URLSearchParams();
          if (t) qs.set("status", t);
          if (sp.payment) qs.set("payment", sp.payment);
          if (sp.q) qs.set("q", sp.q);
          if (sp.from) qs.set("from", sp.from);
          if (sp.to) qs.set("to", sp.to);
          const href = `/admin/orders${qs.toString() ? `?${qs.toString()}` : ""}`;
          return <Link key={t} href={href} className={cn("rounded-pill border px-3 py-1 text-sm", (sp.status ?? "") === t ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>{t ? ORDER_STATUS_LABELS[t] : "All"}</Link>;
        })}
      </div>

      <Table head={["Order", "Date", "Customer", "Items", "Payment", "Fulfillment", "Tracking", "Total"]}>
        {orders.map((o) => {
          const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
          return (
            <tr key={o.id} className="hover:bg-petal/40">
              <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold">#{o.number}</Link></td>
              <td className={td}>{formatDate(o.createdAt)}</td>
              <td className={td}><div className="max-w-48"><p className="truncate font-medium">{o.user ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() || o.email : o.email}</p><p className="truncate text-xs text-ink-soft">{o.email}</p></div></td>
              <td className={td}>{itemCount}</td>
              <td className={td}><PaymentBadge status={o.payment?.status ?? "PENDING"} method={o.payment?.method ?? null} /></td>
              <td className={td}><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td>
              <td className={td}>{o.shipment?.trackingNumber ? <div className="max-w-44"><p className="truncate text-xs font-medium">{o.shipment.carrier ?? "Carrier"}</p>{o.shipment.trackingUrl ? <a href={o.shipment.trackingUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-flame underline">{o.shipment.trackingNumber}</a> : <p className="truncate text-xs text-ink-soft">{o.shipment.trackingNumber}</p>}</div> : <span className="text-ink-soft">—</span>}</td>
              <td className={td}><span className="font-semibold">{formatCents(o.totalCents, o.currency)}</span></td>
            </tr>
          );
        })}
        {orders.length === 0 && <tr><td className={td} colSpan={8}>No orders match these filters.</td></tr>}
      </Table>
    </>
  );
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p><p className={cn("mt-2 text-2xl font-semibold text-cocoa", warn && "text-amber-700")}>{value}</p></div>;
}

function PaymentBadge({ status, method }: { status: string; method: string | null }) {
  const tone = status === "SUCCEEDED" ? "green" : status === "FAILED" ? "red" : status.includes("REFUND") ? "honey" : "neutral";
  return <div><Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>{method && <p className="mt-1 text-xs text-ink-soft">{method.replaceAll("_", " ")}</p>}</div>;
}
