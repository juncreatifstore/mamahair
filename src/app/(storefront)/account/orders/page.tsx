import Link from "next/link";
import { listMyOrders } from "@/server/orders";
import { Badge, statusTone } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import { getT } from "@/i18n/server";

export default async function OrdersPage() {
  const [orders, t] = await Promise.all([listMyOrders(), getT()]);
  return (
    <div>
      <h2 className="text-2xl text-cocoa">{t.account.orders}</h2>
      {orders.length === 0 ? <p className="mt-4 text-ink-soft">{t.account.noOrders}</p> : (
        <ul className="mt-6 divide-y divide-sand rounded-3xl bg-white">
          {orders.map((o) => <li key={o.id}><Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-petal/50"><div><p className="font-semibold">{t.account.orderNumber} #{o.number}</p><p className="text-sm text-ink-soft">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p></div><div className="flex items-center gap-4"><Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge><span className="font-semibold">{formatCents(o.totalCents, o.currency)}</span></div></Link></li>)}
        </ul>
      )}
    </div>
  );
}
