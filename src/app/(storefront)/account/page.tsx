import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/i18n/server";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";

export async function generateMetadata() { return { title: (await getT()).account.title, robots: { index: false } }; }

export default async function AccountDashboard() {
  const [user, t] = await Promise.all([requireUser(), getT()]);
  const [orders, wishlistCount, addresses] = await Promise.all([
    db.order.findMany({ where: { userId: user.id, status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, take: 3, include: { shipment: true } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
    db.address.count({ where: { userId: user.id } }),
  ]);
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-petal p-6"><p className="display text-2xl text-cocoa">Hello{user.firstName ? `, ${user.firstName}` : ""}</p><p className="mt-1 text-sm text-ink-soft">{user.email}</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat href="/account/orders" label={t.account.orders} value={String(await db.order.count({ where: { userId: user.id, status: { not: "PENDING_PAYMENT" } } }))} />
        <Stat href="/account/wishlist" label={t.account.wishlist} value={String(wishlistCount)} />
        <Stat href="/account/addresses" label={t.account.addresses} value={String(addresses)} />
      </div>
      <div>
        <h2 className="text-2xl text-cocoa">{t.account.orders}</h2>
        {orders.length === 0 ? <p className="mt-3 text-sm text-ink-soft">{t.account.noOrders}</p> : (
          <ul className="mt-4 divide-y divide-sand rounded-3xl bg-white">{orders.map((o) => <li key={o.id}><Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-petal/50"><div><p className="font-medium">#{o.number}</p><p className="text-xs text-ink-soft">{formatDate(o.createdAt)}{o.shipment?.trackingNumber ? ` · ${t.account.tracking} ${o.shipment.trackingNumber}` : ""}</p></div><div className="flex items-center gap-3"><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge><span className="font-semibold">{formatCents(o.totalCents, o.currency)}</span></div></Link></li>)}</ul>
        )}
      </div>
    </div>
  );
}
function Stat({ href, label, value }: { href: string; label: string; value: string }) { return <Link href={href} className="rounded-3xl bg-white p-5 hover:bg-petal/50"><p className="text-sm text-ink-soft">{label}</p><p className="display mt-1 text-3xl text-cocoa">{value}</p></Link>; }
