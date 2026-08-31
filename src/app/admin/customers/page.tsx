import Link from "next/link";
import { adminListCustomers } from "@/server/admin/settings";
import { PageHeader, Table, td } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await adminListCustomers(q);
  return (
    <>
      <PageHeader title="Customers" />
      <form className="mb-4"><Input name="q" placeholder="Search name, email, phone…" defaultValue={q} className="max-w-sm" /></form>
      <Table head={["Customer", "Email", "Phone", "Orders", "Total spent", "Last order", "Status"]}>
        {customers.map((c) => {
          const byCur = c.orders.reduce<Record<string, number>>((m, o) => ({ ...m, [o.currency]: (m[o.currency] ?? 0) + o.totalCents }), {});
          return <tr key={c.id} className="hover:bg-petal/40"><td className={td}><Link href={`/admin/customers/${c.id}`} className="font-semibold">{`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—"}</Link></td><td className={td}>{c.email}</td><td className={td}>{c.phone ?? "—"}</td><td className={td}>{c.orders.length}</td><td className={td}>{Object.entries(byCur).map(([cur, v]) => formatCents(v, cur)).join(" + ") || "—"}</td><td className={td}>{c.orders[0] ? formatDate(c.orders[0].createdAt) : "—"}</td><td className={td}>{c.isBlocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}</td></tr>;
        })}
        {customers.length === 0 && <tr><td className={td} colSpan={7}>No customers yet.</td></tr>}
      </Table>
    </>
  );
}
