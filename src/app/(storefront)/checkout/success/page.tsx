import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { Badge, statusTone } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

export const metadata = { title: "Order received", robots: { index: false } };

/** Le statut affiché vient de la base (mis à jour par le webhook), jamais du simple redirect. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: id } = await searchParams;
  const order = id ? await db.order.findUnique({ where: { id }, include: { items: true } }) : null;
  const pending = order?.status === "PENDING_PAYMENT";
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-5xl text-cocoa">Thank you</h1>
      {order ? (
        <>
          <p className="mt-4 text-ink-soft">Order <strong className="text-ink">#{order.number}</strong> {pending ? "was received. We're confirming your payment — this page updates automatically." : "is confirmed."} A receipt goes to {order.email}.</p>
          <div className="mt-3"><Badge tone={statusTone[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge></div>
          {pending && <meta httpEquiv="refresh" content="5" />}
          <ul className="mt-8 divide-y divide-sand rounded-3xl bg-white text-left text-sm">
            {order.items.map((i) => <li key={i.id} className="flex justify-between px-5 py-3"><span>{i.productName} · {i.variantName} × {i.quantity}</span><span>{formatCents(i.totalCents, order.currency)}</span></li>)}
            <li className="flex justify-between px-5 py-3 font-semibold"><span>Total</span><span>{formatCents(order.totalCents, order.currency)}</span></li>
          </ul>
        </>
      ) : <p className="mt-4 text-ink-soft">Your payment was received. A confirmation email is on its way.</p>}
      <div className="mt-10 flex justify-center gap-3"><Button href="/shop">Keep shopping</Button><Button href="/account/orders" variant="ghost">My orders</Button></div>
    </div>
  );
}
