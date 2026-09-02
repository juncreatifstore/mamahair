"use client";

import { useActionState } from "react";
import { PackageCheck, Search, Truck } from "lucide-react";
import { lookupOrderTracking, type OrderTrackingState } from "@/server/order-tracking";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Payment pending",
  PAID: "Payment confirmed",
  PROCESSING: "Preparing your order",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

export function OrderTrackingForm() {
  const [state, action] = useActionState<OrderTrackingState, FormData>(lookupOrderTracking, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <form action={action} className="rounded-[2rem] border border-sand bg-white p-5 shadow-[0_18px_55px_rgba(74,27,12,.05)] sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-petal text-cocoa"><Search className="size-5" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Find your order</p><h2 className="mt-1 text-2xl text-cocoa">Track Order</h2></div>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.08em] text-ink-soft">Order number</span><Input name="number" inputMode="numeric" placeholder="#1234" required /></label>
          <label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.08em] text-ink-soft">Email used at checkout</span><Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <SubmitButton size="lg" className="w-full" pendingText="Checking…">Track my order</SubmitButton>
        </div>
        {state.error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.error}</p>}
        <p className="mt-4 text-xs leading-5 text-ink-soft">For privacy, both the order number and checkout email must match.</p>
      </form>

      <div className="rounded-[2rem] bg-cocoa p-6 text-cream sm:p-8">
        {state.order ? (
          <div>
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-peach">Order #{state.order.number}</p><h3 className="mt-2 text-3xl text-white">{STATUS_LABELS[state.order.status] ?? state.order.status}</h3></div><PackageCheck className="size-7 text-peach" /></div>
            <p className="mt-3 text-sm text-cream/70">Placed {new Date(state.order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
            <div className="mt-7 rounded-2xl border border-cream/10 bg-white/[.05] p-5">
              <div className="flex items-center gap-3"><Truck className="size-5 text-peach" /><div><p className="text-sm font-semibold">Shipping details</p><p className="mt-1 text-xs text-cream/65">Tracking appears as soon as the carrier label is created.</p></div></div>
              {state.order.trackingNumber ? <div className="mt-4 border-t border-cream/10 pt-4 text-sm"><p><span className="text-cream/60">Carrier:</span> {state.order.carrier || "Carrier"}</p><p className="mt-1"><span className="text-cream/60">Tracking:</span> {state.order.trackingNumber}</p>{state.order.trackingUrl && <a href={state.order.trackingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-flame px-5 py-2.5 text-xs font-bold uppercase tracking-[.08em] text-white">Track shipment</a>}</div> : <p className="mt-4 border-t border-cream/10 pt-4 text-sm text-cream/70">Your order has not received a tracking number yet.</p>}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[320px] flex-col justify-center"><Truck className="size-8 text-peach" /><h3 className="mt-5 text-3xl text-white">From our store to your door.</h3><p className="mt-4 max-w-md text-sm leading-7 text-cream/70">Enter your order number and checkout email to see the latest order status and carrier tracking when available.</p></div>
        )}
      </div>
    </div>
  );
}
