import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSendTestEmail } from "@/server/admin/emails";
import { EMAIL_TEMPLATES, EMAIL_TEMPLATE_LABELS, type EmailTemplate } from "@/lib/admin/email-templates";
import { PageHeader, Card } from "@/components/admin/ui";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";

const PREVIEW_COPY: Record<EmailTemplate, { title: string; eyebrow: string; text: string; cta: string; tone: string }> = {
  WELCOME: { title: "Welcome, Maya", eyebrow: "Account", text: "Your MAMAHAIR account is ready. Track orders, save your wishlist and check out faster.", cta: "Start shopping", tone: "New customer" },
  ORDER_CONFIRMATION: { title: "Thank you for your order", eyebrow: "Order #1048", text: "Payment is confirmed. Your items are being prepared carefully.", cta: "View my order", tone: "Paid" },
  ORDER_PROCESSING: { title: "We're preparing your order", eyebrow: "Order #1048", text: "Your order is being inspected, prepared and packed with care.", cta: "View order", tone: "Processing" },
  ORDER_SHIPPED: { title: "Your order shipped", eyebrow: "DHL Express", text: "Your package is on its way. Tracking MAMA123456789 is included in the email.", cta: "Track my package", tone: "Shipped" },
  ORDER_DELIVERED: { title: "Delivered", eyebrow: "Order #1048", text: "Your order was marked delivered. The customer is invited to leave a review.", cta: "View order & leave a review", tone: "Delivered" },
  REFUND: { title: "Your refund is on its way", eyebrow: "Refund", text: "$50.00 USD refund initiated. The email explains the usual bank processing time.", cta: "View my orders", tone: "Refund" },
  ABANDONED_CART: { title: "Still thinking about it?", eyebrow: "Saved cart", text: "The cart is saved with product images and an optional recovery discount code.", cta: "Return to my cart", tone: "Recovery" },
};

export default async function AdminEmailsPage({ searchParams }: { searchParams: Promise<{ template?: string; error?: string; sent?: string }> }) {
  const sp = await searchParams;
  const selected = EMAIL_TEMPLATES.includes(sp.template as EmailTemplate) ? (sp.template as EmailTemplate) : "ORDER_CONFIRMATION";
  const preview = PREVIEW_COPY[selected];

  return (
    <>
      <PageHeader title="Email preview" sub="Preview transactional email scenarios and send a real test through the same Resend functions used in production." />

      {sp.error && <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</p>}
      {sp.sent && <p className="mb-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">Test email sent successfully.</p>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card title="Send test email">
            <form action={async (fd) => {
              "use server";
              const r = await adminSendTestEmail(fd);
              const template = encodeURIComponent(String(fd.get("template") ?? selected));
              if (r.error) redirect(`/admin/emails?template=${template}&error=${encodeURIComponent(r.error)}`);
              redirect(`/admin/emails?template=${template}&sent=1`);
            }} className="space-y-4">
              <Field label="Template">
                <Select name="template" defaultValue={selected}>
                  {EMAIL_TEMPLATES.map((key) => <option key={key} value={key}>{EMAIL_TEMPLATE_LABELS[key]}</option>)}
                </Select>
              </Field>
              <Field label="Send test to" hint="Only this address receives the test.">
                <Input name="to" type="email" required placeholder="you@example.com" autoComplete="email" />
              </Field>
              <SubmitButton className="w-full" pendingText="Sending test…">Send test email</SubmitButton>
            </form>
          </Card>

          <Card title="Templates">
            <nav className="space-y-1">
              {EMAIL_TEMPLATES.map((key) => (
                <Link key={key} href={`/admin/emails?template=${key}`} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${selected === key ? "bg-cocoa text-cream" : "hover:bg-petal"}`}>
                  <span>{EMAIL_TEMPLATE_LABELS[key]}</span>
                  {selected === key && <span className="text-xs opacity-80">Previewing</span>}
                </Link>
              ))}
            </nav>
          </Card>

          <Card title="Delivery status">
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span>Provider</span><strong>Resend</strong></p>
              <p className="flex items-center justify-between"><span>Production function</span><Badge tone="green">Same code path</Badge></p>
              <p className="text-xs text-ink-soft">If RESEND_API_KEY is missing, the test action stops before claiming an email was sent.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={`${EMAIL_TEMPLATE_LABELS[selected]} preview`}>
            <div className="overflow-hidden rounded-[28px] border border-sand bg-[#FAF6F1] p-4 sm:p-8">
              <div className="mx-auto max-w-[620px]">
                <div className="pb-6 text-center">
                  <div className="display text-3xl text-cocoa">MAMAHAIR</div>
                </div>
                <div className="rounded-[24px] border border-sand bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-flame">{preview.eyebrow}</p>
                  <h2 className="display mt-2 text-3xl text-cocoa">{preview.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-ink-soft">{preview.text}</p>

                  {["ORDER_CONFIRMATION", "ORDER_PROCESSING", "ORDER_SHIPPED", "ABANDONED_CART"].includes(selected) && (
                    <div className="mt-6 space-y-3 border-y border-sand py-4">
                      <PreviewItem title="Body Wave HD Lace Wig" variant={'Body Wave · 24\" · 180% · Natural Black'} price={selected === "ABANDONED_CART" ? undefined : "$189.00"} />
                      <PreviewItem title="Silk Hair Care Set" variant="Hydration Set" price={selected === "ABANDONED_CART" ? undefined : "$39.00"} />
                    </div>
                  )}

                  {selected === "ORDER_CONFIRMATION" && (
                    <div className="mt-4 space-y-1 text-sm">
                      <PreviewRow label="Subtotal" value="$228.00" />
                      <PreviewRow label="Discount" value="−$15.00" />
                      <PreviewRow label="Shipping" value="Free" />
                      <PreviewRow label="Tax" value="$13.74" />
                      <PreviewRow label="Total" value="$226.74" strong />
                    </div>
                  )}

                  {selected === "ORDER_SHIPPED" && <div className="mt-5 rounded-2xl bg-petal p-4 text-sm"><span className="block text-xs uppercase tracking-wider text-ink-soft">Tracking</span><strong>DHL Express · MAMA123456789</strong></div>}
                  {selected === "REFUND" && <div className="mt-5 rounded-2xl bg-petal p-5 text-center"><span className="block text-xs uppercase tracking-wider text-ink-soft">Refund</span><strong className="display mt-1 block text-3xl text-cocoa">$50.00</strong></div>}
                  {selected === "ABANDONED_CART" && <div className="mt-5 rounded-2xl border border-dashed border-flame p-4 text-center"><span className="text-xs uppercase tracking-wider text-ink-soft">Recovery code</span><strong className="mt-1 block text-lg text-cocoa">COME10</strong></div>}

                  <span className="mt-7 inline-flex rounded-pill bg-flame px-6 py-3 text-sm font-semibold text-white">{preview.cta}</span>
                </div>
                <p className="px-6 pt-5 text-center text-xs leading-5 text-ink-soft">MAMAHAIR · Transactional email preview<br />Brand footer, contact details and social links appear here.</p>
              </div>
            </div>
          </Card>

          <Card title="What this template tests">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">{preview.tone}</Badge>
              <Badge>Branding</Badge>
              <Badge>Responsive email</Badge>
              <Badge>CTA</Badge>
              {selected !== "WELCOME" && selected !== "ORDER_DELIVERED" && selected !== "REFUND" && <Badge>Product content</Badge>}
              {selected === "ORDER_SHIPPED" && <Badge>Tracking</Badge>}
              {selected === "ABANDONED_CART" && <Badge>Recovery code</Badge>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function PreviewItem({ title, variant, price }: { title: string; variant: string; price?: string }) {
  return <div className="flex items-center gap-3"><div className="h-16 w-14 shrink-0 rounded-xl bg-petal" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="truncate text-xs text-ink-soft">{variant} · Qty 1</p></div>{price && <span className="text-sm font-semibold">{price}</span>}</div>;
}

function PreviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <p className={`flex justify-between ${strong ? "border-t border-sand pt-2 font-semibold text-ink" : "text-ink-soft"}`}><span>{label}</span><span>{value}</span></p>;
}
