import Link from "next/link";
import { getDashboardStats } from "@/server/admin/dashboard";
import { adminTopWishlisted } from "@/server/admin/settings";
import { getSection } from "@/lib/settings";
import { PageHeader, StatCard, Card, Table, td, BarChart } from "@/components/admin/ui";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";

export default async function DashboardPage() {
  const commerce = await getSection("commerce");
  const [s, wl] = await Promise.all([getDashboardStats(commerce.defaultCurrency), adminTopWishlisted()]);
  const f = (c: number) => formatCents(c, s.currency);
  return (
    <>
      <PageHeader title="Dashboard" sub={`Figures in ${s.currency}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales today" value={f(s.todayCents)} sub={`${s.todayCount} orders`} />
        <StatCard label="Sales this week" value={f(s.weekCents)} sub={`${s.weekCount} orders`} />
        <StatCard label="Sales this month" value={f(s.monthCents)} sub={`${s.monthCount} orders · avg ${f(s.avgOrderCents)}`} />
        <StatCard label="To process" value={String(s.toProcess)} sub="Paid, processing, ready to ship" />
        <StatCard label="New customers" value={String(s.newCustomers)} sub="This month" />
        <StatCard label="Refunds" value={f(s.refundedCents)} sub={`${s.refundCount} this month`} />
        <StatCard label="Low stock" value={String(s.lowStock.length)} sub="At or below threshold" />
        <StatCard label="Out of stock" value={String(s.outOfStock.length)} sub="Active variants at 0" />
      </div>
      <Card title="Revenue — last 30 days" className="mt-6"><BarChart data={s.daily.map((d) => ({ label: d.date.slice(5), value: d.cents }))} format={f} /></Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-xl text-cocoa">Latest orders</h2><Link href="/admin/orders" className="text-sm underline">All orders</Link></div>
          <Table head={["Order", "Date", "Customer", "Payment", "Status", "Total"]}>
            {s.recent.map((o) => <tr key={o.id} className="hover:bg-petal/40"><td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold">#{o.number}</Link></td><td className={td}>{formatDate(o.createdAt)}</td><td className={td}>{o.email}</td><td className={td}>{o.payment?.status ?? "—"}</td><td className={td}><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td><td className={td}>{formatCents(o.totalCents, o.currency)}</td></tr>)}
            {s.recent.length === 0 && <tr><td className={td} colSpan={6}>No orders yet.</td></tr>}
          </Table>
        </div>
        <div className="space-y-6">
          <Card title="Best sellers this month"><ul className="space-y-2 text-sm">{s.topProducts.map((p) => <li key={p.productName} className="flex justify-between gap-2"><span>{p.productName}</span><span className="shrink-0 text-ink-soft">{p._sum.quantity} · {f(p._sum.totalCents ?? 0)}</span></li>)}{s.topProducts.length === 0 && <li className="text-ink-soft">Nothing sold yet.</li>}</ul></Card>
          <Card title="Stock alerts"><ul className="space-y-2 text-sm">{[...s.outOfStock, ...s.lowStock].map((i) => <li key={i.id} className="flex justify-between gap-2"><Link href={`/admin/products/${i.variant.product.id}`} className="underline">{i.variant.product.name} · {i.variant.name}</Link><span className={i.quantity === 0 ? "font-semibold text-red-700" : "text-ink-soft"}>{i.quantity}</span></li>)}{s.lowStock.length + s.outOfStock.length === 0 && <li className="text-ink-soft">All stocked.</li>}</ul></Card>
          <Card title="Most wishlisted"><ul className="space-y-2 text-sm">{wl.map((w) => <li key={w.product?.id} className="flex justify-between"><span>{w.product?.name}</span><span className="text-ink-soft">{w.count}</span></li>)}{wl.length === 0 && <li className="text-ink-soft">No wishlist data yet.</li>}</ul></Card>
          {s.pendingReviews > 0 && <Card title="Reviews"><Link href="/admin/reviews" className="text-sm underline">{s.pendingReviews} awaiting moderation</Link></Card>}
        </div>
      </div>
    </>
  );
}
