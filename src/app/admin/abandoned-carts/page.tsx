import { adminAbandonedCarts } from "@/server/admin/settings";
import { PageHeader, Table, td } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";

export default async function AbandonedCartsPage() {
  const carts = await adminAbandonedCarts();
  return (
    <>
      <PageHeader title="Abandoned carts" sub="Carts inactive for over 1 hour and not converted. Recovery emails go out automatically (cron every 6 h, once per cart, only when an email is known)." />
      <Table head={["Email", "Items", "Last activity", "Recovery email"]}>
        {carts.map((c) => <tr key={c.id}><td className={td}>{c.user?.email ?? c.email ?? <span className="text-ink-soft">guest</span>}</td><td className={td}>{c.items.map((i) => `${i.variant.product.name} (${i.variant.name}) × ${i.quantity}`).join(", ")}</td><td className={td}>{formatDateTime(c.lastActivityAt)}</td><td className={td}>{c.recoveryEmailSentAt ? formatDateTime(c.recoveryEmailSentAt) : "—"}</td></tr>)}
        {carts.length === 0 && <tr><td className={td} colSpan={4}>No abandoned carts.</td></tr>}
      </Table>
    </>
  );
}
