import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetCustomer, saveCustomerNotes } from "@/server/admin/settings";
import { PageHeader, Card, Table, td } from "@/components/admin/ui";
import { Badge, statusTone } from "@/components/ui/badge";
import { Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents } from "@/lib/money";
import { formatDate, formatDateTime, ORDER_STATUS_LABELS, COUNTRY_NAMES } from "@/lib/utils";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await adminGetCustomer(id);
  if (!c) notFound();

  const completedOrders = c.orders.filter((o) => !["PENDING_PAYMENT", "CANCELLED"].includes(o.status));
  const spentByCurrency = completedOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.currency] = (acc[o.currency] ?? 0) + Math.max(0, o.totalCents - o.refundedCents);
    return acc;
  }, {});
  const refundedByCurrency = c.orders.reduce<Record<string, number>>((acc, o) => {
    if (o.refundedCents > 0) acc[o.currency] = (acc[o.currency] ?? 0) + o.refundedCents;
    return acc;
  }, {});
  const cart = c.cart;
  const cartTotal = cart?.items.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0) ?? 0;
  const cartAgeHours = cart ? Math.floor((Date.now() - cart.lastActivityAt.getTime()) / 3_600_000) : 0;
  const abandoned = !!cart && cart.items.length > 0 && !cart.convertedAt && cartAgeHours >= 1;

  return (
    <>
      <PageHeader
        title={`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email}
        sub={`${c.email}${c.phone ? ` · ${c.phone}` : ""} · since ${formatDate(c.createdAt)}`}
      >
        {c.isBlocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>}
        <a href={`mailto:${c.email}`} className="rounded-pill border border-sand bg-white px-4 py-2 text-sm">Email customer</a>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Paid orders" value={String(completedOrders.length)} />
        <Metric label="Wishlist" value={String(c.wishlist.length)} />
        <Metric label="Reviews" value={String(c.reviews.length)} />
        <Metric label="Cart items" value={String(cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0)} warn={abandoned} />
        <Metric label="Account" value={c.isBlocked ? "Blocked" : "Active"} danger={c.isBlocked} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Order history">
            <Table head={["Order", "Date", "Status", "Payment", "Items", "Total"]}>
              {c.orders.map((o) => (
                <tr key={o.id}>
                  <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold">#{o.number}</Link></td>
                  <td className={td}>{formatDate(o.createdAt)}</td>
                  <td className={td}><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td>
                  <td className={td}>{o.payment?.status ?? "—"}{o.payment?.method ? ` · ${o.payment.method}` : ""}</td>
                  <td className={td}>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className={td}>{formatCents(o.totalCents, o.currency)}</td>
                </tr>
              ))}
              {c.orders.length === 0 && <tr><td className={td} colSpan={6}>No orders.</td></tr>}
            </Table>
          </Card>

          {cart && cart.items.length > 0 && (
            <Card title={abandoned ? "Abandoned cart" : "Current cart"}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{cart.items.reduce((s, i) => s + i.quantity, 0)} item(s) · {formatCents(cartTotal, cart.currency)}</p>
                  <p className="text-xs text-ink-soft">Last activity {formatDateTime(cart.lastActivityAt)}{cart.discount?.code ? ` · promo ${cart.discount.code}` : ""}</p>
                </div>
                {abandoned && <Badge tone="honey">Inactive {cartAgeHours}h</Badge>}
              </div>
              <ul className="divide-y divide-sand text-sm">
                {cart.items.map((item) => {
                  const image = item.variant.image?.url ?? item.variant.product.images[0]?.url;
                  const available = Math.max(0, (item.variant.inventory?.quantity ?? 0) - (item.variant.inventory?.reserved ?? 0));
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-petal">{image && <Image src={image} alt="" fill sizes="48px" className="object-cover" />}</div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${item.variant.product.slug}`} className="font-medium hover:text-flame">{item.variant.product.name}</Link>
                        <p className="text-xs text-ink-soft">{item.variant.name} · SKU {item.variant.sku} · qty {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCents(item.variant.priceCents * item.quantity, cart.currency)}</p>
                        <p className={`text-xs ${available < item.quantity ? "text-red-700" : "text-ink-soft"}`}>{available} available</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card title="Internal notes">
            <form action={async (fd) => { "use server"; await saveCustomerNotes(id, fd); }} className="space-y-3">
              <Textarea name="notes" defaultValue={c.notes ?? ""} className="min-h-28" placeholder="Private staff notes about this customer" />
              <Checkbox name="isBlocked" label="Block this customer (cannot place orders)" defaultChecked={c.isBlocked} />
              <p className="text-xs text-ink-soft">Blocking affects checkout. Existing order history remains available to staff.</p>
              <SubmitButton size="sm" variant="ghost">Save customer settings</SubmitButton>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Financial summary">
            <div className="space-y-3 text-sm">
              <div><p className="text-xs uppercase tracking-wide text-ink-soft">Net spent</p><p className="mt-1 font-semibold">{Object.entries(spentByCurrency).map(([cur, value]) => formatCents(value, cur)).join(" + ") || "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-ink-soft">Refunded</p><p className="mt-1">{Object.entries(refundedByCurrency).map(([cur, value]) => formatCents(value, cur)).join(" + ") || "—"}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-ink-soft">Last order</p><p className="mt-1">{c.orders[0] ? `#${c.orders[0].number} · ${formatDate(c.orders[0].createdAt)}` : "—"}</p></div>
            </div>
          </Card>

          <Card title="Customer profile">
            <div className="space-y-2 text-sm">
              <p><span className="text-ink-soft">Email:</span> {c.email}</p>
              <p><span className="text-ink-soft">Phone:</span> {c.phone ?? "—"}</p>
              <p><span className="text-ink-soft">Locale:</span> {c.locale}</p>
              <p><span className="text-ink-soft">Preferred currency:</span> {c.currency}</p>
              <p><span className="text-ink-soft">Updated:</span> {formatDateTime(c.updatedAt)}</p>
            </div>
          </Card>

          {c.hairProfile && (
            <Card title="Hair profile">
              <div className="space-y-2 text-sm">
                <p><span className="text-ink-soft">Hair type:</span> {c.hairProfile.hairType ?? "—"}</p>
                <p><span className="text-ink-soft">Porosity:</span> {c.hairProfile.porosity ?? "—"}</p>
                <p><span className="text-ink-soft">Concerns:</span> {c.hairProfile.concerns.join(", ") || "—"}</p>
              </div>
            </Card>
          )}

          <Card title="Addresses">
            {c.addresses.length === 0 ? <p className="text-sm text-ink-soft">None saved.</p> : (
              <ul className="space-y-4 text-sm">
                {c.addresses.map((a) => <li key={a.id} className="whitespace-pre-line rounded-xl border border-sand p-3">{[a.fullName + (a.isDefault ? " (default)" : ""), a.line1, a.line2, `${a.city}${a.region ? ", " + a.region : ""} ${a.postalCode ?? ""}`, COUNTRY_NAMES[a.country] ?? a.country, a.phone].filter(Boolean).join("\n")}</li>)}
              </ul>
            )}
          </Card>

          {c.wishlist.length > 0 && (
            <Card title={`Wishlist (${c.wishlist.length})`}>
              <ul className="space-y-3 text-sm">
                {c.wishlist.slice(0, 12).map((w) => (
                  <li key={w.id} className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-petal">{w.product.images[0] && <Image src={w.product.images[0].url} alt="" fill sizes="40px" className="object-cover" />}</div>
                    <div className="min-w-0 flex-1"><Link href={`/products/${w.product.slug}`} className="font-medium hover:text-flame">{w.product.name}</Link><p className="text-xs text-ink-soft">{formatCents(w.product.basePriceCents, w.product.currency)}</p></div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {c.reviews.length > 0 && (
            <Card title={`Recent reviews (${c.reviews.length})`}>
              <ul className="space-y-3 text-sm">
                {c.reviews.slice(0, 5).map((r) => <li key={r.id}><Link href={`/products/${r.product.slug}`} className="font-medium hover:text-flame">{r.product.name}</Link><p className="text-xs text-ink-soft">{"★".repeat(r.rating)} · {formatDate(r.createdAt)}{r.isApproved ? " · approved" : " · pending"}</p></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, warn = false, danger = false }: { label: string; value: string; warn?: boolean; danger?: boolean }) {
  return <div className={`rounded-2xl border p-4 shadow-sm ${danger ? "border-red-200 bg-red-50" : warn ? "border-amber-200 bg-amber-50" : "border-sand bg-white"}`}><p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p><p className={`mt-2 text-2xl font-semibold ${danger ? "text-red-700" : warn ? "text-amber-700" : "text-cocoa"}`}>{value}</p></div>;
}
