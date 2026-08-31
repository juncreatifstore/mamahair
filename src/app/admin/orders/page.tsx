import Link from "next/link";
import { adminListOrders } from "@/server/admin/orders";
import { PageHeader, Table, td } from "@/components/admin/ui";
import { Badge, statusTone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/money";
import { formatDate, ORDER_STATUS_LABELS, cn } from "@/lib/utils";

const tabs = ["", "PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED", "PENDING_PAYMENT"];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const orders = await adminListOrders(sp);
  return (
    <>
      <PageHeader title="Orders" />
      <form className="mb-4 flex flex-wrap items-center gap-2"><Input name="q" placeholder="Order #, email, name, SKU…" defaultValue={sp.q} className="max-w-xs" /><Input name="from" type="date" defaultValue={sp.from} className="w-40" /><Input name="to" type="date" defaultValue={sp.to} className="w-40" />{sp.status && <input type="hidden" name="status" value={sp.status} />}<button className="h-11 rounded-pill bg-cocoa px-5 text-sm text-cream">Search</button></form>
      <div className="mb-4 flex flex-wrap gap-2">{tabs.map((t) => <Link key={t} href={t ? `/admin/orders?status=${t}` : "/admin/orders"} className={cn("rounded-pill border px-3 py-1 text-sm", (sp.status ?? "") === t ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>{t ? ORDER_STATUS_LABELS[t] : "All"}</Link>)}</div>
      <Table head={["Order", "Date", "Customer", "Items", "Payment", "Status", "Total"]}>
        {orders.map((o) => <tr key={o.id} className="hover:bg-petal/40"><td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold">#{o.number}</Link></td><td className={td}>{formatDate(o.createdAt)}</td><td className={td}>{o.user ? `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim() || o.email : o.email}</td><td className={td}>{o.items.reduce((s, i) => s + i.quantity, 0)}</td><td className={td}>{o.payment?.status}{o.payment?.method ? ` · ${o.payment.method}` : ""}</td><td className={td}><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td><td className={td}>{formatCents(o.totalCents, o.currency)}</td></tr>)}
        {orders.length === 0 && <tr><td className={td} colSpan={7}>No orders here.</td></tr>}
      </Table>
    </>
  );
}
