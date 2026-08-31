import Link from "next/link";
import { adminListCustomersEnhanced, type AdminCustomerFilter } from "@/server/admin/customers";
import { PageHeader, Table, td } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";

const filters: { value: AdminCustomerFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
  { value: "abandoned", label: "Abandoned cart" },
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const sp = await searchParams;
  const filter = filters.some((f) => f.value === sp.filter) ? (sp.filter as AdminCustomerFilter) : "";
  const [customers, all] = await Promise.all([
    adminListCustomersEnhanced({ q: sp.q, filter }),
    adminListCustomersEnhanced(),
  ]);
  const now = Date.now();
  const isAbandoned = (c: (typeof all)[number]) => !!c.cart && !c.cart.convertedAt && c.cart.items.length > 0 && now - c.cart.lastActivityAt.getTime() >= 60 * 60 * 1000;
  const activeCount = all.filter((c) => !c.isBlocked).length;
  const blockedCount = all.filter((c) => c.isBlocked).length;
  const abandonedCount = all.filter(isAbandoned).length;
  const repeatCount = all.filter((c) => c.orders.length > 1).length;

  const paramsFor = (nextFilter: AdminCustomerFilter) => {
    const p = new URLSearchParams();
    if (nextFilter) p.set("filter", nextFilter);
    if (sp.q) p.set("q", sp.q);
    const s = p.toString();
    return `/admin/customers${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Customers" sub="Customer value, engagement and recovery signals" />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Customers loaded" value={all.length} />
        <Metric label="Active" value={activeCount} />
        <Metric label="Blocked" value={blockedCount} />
        <Metric label="Abandoned carts" value={abandonedCount} />
        <Metric label="Repeat customers" value={repeatCount} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap gap-2">
          <Input name="q" placeholder="Search name, email, phone…" defaultValue={sp.q} className="max-w-sm" />
          {filter && <input type="hidden" name="filter" value={filter} />}
          <button className="h-11 rounded-pill bg-cocoa px-5 text-sm text-cream">Search</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link key={f.value} href={paramsFor(f.value)} className={cn("rounded-pill border px-3 py-1.5 text-sm", filter === f.value ? "border-cocoa bg-cocoa text-cream" : "border-sand bg-white")}>{f.label}</Link>
          ))}
        </div>
      </div>

      <Table head={["Customer", "Orders", "Net value", "Cart", "Engagement", "Last order", "Status"]}>
        {customers.map((c) => {
          const byCur = c.orders.reduce<Record<string, number>>((m, o) => ({ ...m, [o.currency]: (m[o.currency] ?? 0) + Math.max(0, o.totalCents - o.refundedCents) }), {});
          const cartValue = c.cart?.items.reduce((s, i) => s + i.variant.priceCents * i.quantity, 0) ?? 0;
          const abandoned = !!c.cart && !c.cart.convertedAt && c.cart.items.length > 0 && now - c.cart.lastActivityAt.getTime() >= 60 * 60 * 1000;
          return (
            <tr key={c.id} className="hover:bg-petal/40">
              <td className={td}>
                <Link href={`/admin/customers/${c.id}`} className="font-semibold hover:text-flame">{`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email}</Link>
                <span className="block text-xs text-ink-soft">{c.email}{c.phone ? ` · ${c.phone}` : ""}</span>
              </td>
              <td className={td}><span className="font-semibold">{c.orders.length}</span>{c.orders.length > 1 && <span className="block text-xs text-ink-soft">Repeat</span>}</td>
              <td className={td}>{Object.entries(byCur).map(([cur, v]) => <span key={cur} className="block font-medium">{formatCents(v, cur)}</span>)}{Object.keys(byCur).length === 0 && "—"}</td>
              <td className={td}>
                {c.cart && c.cart.items.length > 0 ? <><span className="font-medium">{c.cart.items.length} line{c.cart.items.length === 1 ? "" : "s"}</span><span className="block text-xs text-ink-soft">{formatCents(cartValue, c.cart.currency)}</span>{abandoned && <Badge tone="honey" className="mt-1">Abandoned</Badge>}</> : <span className="text-ink-soft">Empty</span>}
              </td>
              <td className={td}><span>{c._count.wishlist} wishlist</span><span className="block text-xs text-ink-soft">{c._count.reviews} reviews</span></td>
              <td className={td}>{c.orders[0] ? formatDate(c.orders[0].createdAt) : "—"}</td>
              <td className={td}>{c.isBlocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}</td>
            </tr>
          );
        })}
        {customers.length === 0 && <tr><td className={td} colSpan={7}>No customers match these filters.</td></tr>}
      </Table>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-sand bg-white p-4"><p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p><p className="mt-1 text-2xl font-semibold text-cocoa">{value}</p></div>;
}
