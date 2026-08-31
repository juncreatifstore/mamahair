import Link from "next/link";
import { redirect } from "next/navigation";
import { adminListAbandonedCarts, sendAbandonedCartRecovery } from "@/server/admin/abandoned-carts";
import { PageHeader, Table, td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export default async function AbandonedCartsPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const [carts, sp] = await Promise.all([adminListAbandonedCarts(), searchParams]);
  const now = Date.now();
  const recoverable = carts.filter((c) => !c.recoveryEmailSentAt && !c.user?.isBlocked && !!(c.email ?? c.user?.email));
  const sent = carts.filter((c) => !!c.recoveryEmailSentAt).length;
  const knownEmail = carts.filter((c) => !!(c.email ?? c.user?.email)).length;

  return (
    <>
      <PageHeader title="Abandoned carts" sub="Carts inactive for more than 1 hour. Automatic recovery runs separately; manual recovery below is protected against duplicate sends." />

      {sp.error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</p>}
      {sp.sent && <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Recovery email sent.</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Metric label="Abandoned carts" value={String(carts.length)} />
        <Metric label="Ready to recover" value={String(recoverable.length)} />
        <Metric label="Email known" value={String(knownEmail)} />
        <Metric label="Recovery sent" value={String(sent)} />
      </div>

      <Table head={["Customer", "Cart", "Value", "Last activity", "Recovery", "Action"]}>
        {carts.map((c) => {
          const email = c.email ?? c.user?.email ?? null;
          const value = c.items.reduce((sum, i) => sum + i.variant.priceCents * i.quantity, 0);
          const ageHours = Math.max(1, Math.floor((now - c.lastActivityAt.getTime()) / 3600_000));
          const canSend = !c.recoveryEmailSentAt && !c.user?.isBlocked && !!email;
          return (
            <tr key={c.id} className="align-top hover:bg-petal/40">
              <td className={td}>
                {c.user ? (
                  <>
                    <Link href={`/admin/customers/${c.user.id}`} className="font-semibold hover:text-flame">
                      {[c.user.firstName, c.user.lastName].filter(Boolean).join(" ") || c.user.email}
                    </Link>
                    <p className="mt-1 text-xs text-ink-soft">{email}</p>
                    {c.user.isBlocked && <Badge tone="red" className="mt-2">Blocked</Badge>}
                  </>
                ) : email ? <span>{email}</span> : <span className="text-ink-soft">Guest · no email</span>}
              </td>
              <td className={td}>
                <p className="font-medium">{c.items.reduce((s, i) => s + i.quantity, 0)} item{c.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "" : "s"}</p>
                <div className="mt-1 space-y-1 text-xs text-ink-soft">
                  {c.items.slice(0, 3).map((i) => <p key={i.id}>{i.variant.product.name} · {i.variant.name} × {i.quantity}</p>)}
                  {c.items.length > 3 && <p>+ {c.items.length - 3} more</p>}
                </div>
                {c.discount?.code && <p className="mt-2 text-xs text-flame">Promo: {c.discount.code}</p>}
              </td>
              <td className={td}><span className="font-semibold text-cocoa">{formatCents(value, c.currency)}</span></td>
              <td className={td}><p>{formatDateTime(c.lastActivityAt)}</p><p className="mt-1 text-xs text-ink-soft">Inactive {ageHours}h</p></td>
              <td className={td}>
                {c.recoveryEmailSentAt ? <><Badge tone="green">Sent</Badge><p className="mt-1 text-xs text-ink-soft">{formatDateTime(c.recoveryEmailSentAt)}</p></> : email ? <Badge tone="honey">Not sent</Badge> : <Badge>No email</Badge>}
              </td>
              <td className={td}>
                {canSend ? (
                  <form action={async () => {
                    "use server";
                    const r = await sendAbandonedCartRecovery(c.id);
                    if (r.error) redirect(`/admin/abandoned-carts?error=${encodeURIComponent(r.error)}`);
                    redirect("/admin/abandoned-carts?sent=1");
                  }}>
                    <SubmitButton size="sm" pendingText="Sending…">Send recovery</SubmitButton>
                  </form>
                ) : <span className="text-xs text-ink-soft">{c.recoveryEmailSentAt ? "Already sent" : c.user?.isBlocked ? "Blocked customer" : "Email required"}</span>}
              </td>
            </tr>
          );
        })}
        {carts.length === 0 && <tr><td className={td} colSpan={6}>No abandoned carts.</td></tr>}
      </Table>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-sand bg-white p-4"><p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p><p className="mt-1 text-2xl font-semibold text-cocoa">{value}</p></div>;
}
