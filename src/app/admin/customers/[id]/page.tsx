import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetCustomer, saveCustomerNotes } from "@/server/admin/settings";
import { PageHeader, Card, Table, td } from "@/components/admin/ui";
import { Badge, statusTone } from "@/components/ui/badge";
import { Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents } from "@/lib/money";
import { formatDate, ORDER_STATUS_LABELS, COUNTRY_NAMES } from "@/lib/utils";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await adminGetCustomer(id);
  if (!c) notFound();
  const paid = c.orders.filter((o) => !["PENDING_PAYMENT", "CANCELLED"].includes(o.status));
  return (
    <>
      <PageHeader title={`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email} sub={`${c.email}${c.phone ? ` · ${c.phone}` : ""} · since ${formatDate(c.createdAt)}`}>{c.isBlocked && <Badge tone="red">Blocked</Badge>}</PageHeader>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Table head={["Order", "Date", "Status", "Items", "Total"]}>
            {c.orders.map((o) => <tr key={o.id}><td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold">#{o.number}</Link></td><td className={td}>{formatDate(o.createdAt)}</td><td className={td}><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td><td className={td}>{o.items.length}</td><td className={td}>{formatCents(o.totalCents, o.currency)}</td></tr>)}
            {c.orders.length === 0 && <tr><td className={td} colSpan={5}>No orders.</td></tr>}
          </Table>
          <Card title="Notes"><form action={async (fd) => { "use server"; await saveCustomerNotes(id, fd); }} className="space-y-3"><Textarea name="notes" defaultValue={c.notes ?? ""} /><Checkbox name="isBlocked" label="Block this customer (cannot check out)" defaultChecked={c.isBlocked} /><SubmitButton size="sm" variant="ghost">Save</SubmitButton></form></Card>
        </div>
        <div className="space-y-6">
          <Card title="Summary"><p className="text-sm">{paid.length} paid orders · {formatCents(paid.reduce((s, o) => s + o.totalCents, 0), paid[0]?.currency ?? "USD")}</p><p className="mt-1 text-sm text-ink-soft">{c.reviews.length} reviews · {c.wishlist.length} wishlist items · locale {c.locale} · {c.currency}</p></Card>
          <Card title="Addresses">{c.addresses.length === 0 ? <p className="text-sm text-ink-soft">None saved.</p> : <ul className="space-y-3 text-sm">{c.addresses.map((a) => <li key={a.id} className="whitespace-pre-line">{[a.fullName + (a.isDefault ? " (default)" : ""), a.line1, a.line2, `${a.city}${a.region ? ", " + a.region : ""} ${a.postalCode ?? ""}`, COUNTRY_NAMES[a.country] ?? a.country, a.phone].filter(Boolean).join("\n")}</li>)}</ul>}</Card>
          {c.wishlist.length > 0 && <Card title="Wishlist"><ul className="text-sm">{c.wishlist.map((w) => <li key={w.id}>{w.product.name}</li>)}</ul></Card>}
        </div>
      </div>
    </>
  );
}
