import { OrderTrackingForm } from "@/components/storefront/order-tracking-form";

export const metadata = { title: "Track Order", robots: { index: false } };

export default function TrackOrderPage() {
  return (
    <div className="pb-20">
      <section className="border-b border-sand bg-[#fbf7f3]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-flame">MAMAHAIR DELIVERY</p>
          <h1 className="mt-2 text-4xl text-cocoa sm:text-5xl">Track your order</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">Check the latest status of your MAMAHAIR order securely using your order number and checkout email.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12"><OrderTrackingForm /></div>
    </div>
  );
}
