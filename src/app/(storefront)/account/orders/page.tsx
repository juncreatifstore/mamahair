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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl text-cocoa">{t.account.orders}</h2>
          <p className="mt-1 text-sm text-ink-soft">Track payment, fulfillment and delivery from one place.</p>
        </div>
        {orders.length > 0 && <span className="text-sm text-ink-soft">{orders.length} order{orders.length === 1 ? "" : "s"}</span>}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-sand bg-white p-8 text-center">
          <p className="text-ink-soft">{t.account.noOrders}</p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-flame underline">Start shopping</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="block rounded-3xl border border-sand bg-white p-5 transition hover:border-cocoa/30 hover:bg-petal/30">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{t.account.orderNumber} #{o.number}</p>
                    <p className="mt-1 text-sm text-ink-soft">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
                    {o.shipment?.trackingNumber && <p className="mt-1 text-xs text-ink-soft">Tracking: {o.shipment.carrier ? `${o.shipment.carrier} · ` : ""}{o.shipment.trackingNumber}</p>}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge tone={statusTone[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    {o.payment && <Badge tone={o.payment.status === "SUCCEEDED" ? "green" : o.payment.status === "FAILED" ? "red" : "neutral"}>Payment {o.payment.status}</Badge>}
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-sand pt-4">
                  <div className="min-w-0 text-sm text-ink-soft">
                    {o.items.slice(0, 2).map((i) => <p key={i.id} className="truncate">{i.productName} · {i.variantName} × {i.quantity}</p>)}
                    {o.items.length > 2 && <p>+ {o.items.length - 2} more item{o.items.length - 2 === 1 ? "" : "s"}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-ink-soft">Total</p>
                    <p className="font-semibold text-cocoa">{formatCents(o.totalCents, o.currency)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
