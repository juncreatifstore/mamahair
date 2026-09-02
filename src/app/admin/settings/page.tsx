import Image from "next/image";
import { getSection, DEFAULT_SETTINGS, type SettingSection } from "@/lib/settings";
import { saveSettingsSection, uploadBrandingAsset } from "@/server/admin/settings";
import { PageHeader, Card } from "@/components/admin/ui";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { SettingsTabs } from "@/components/admin/settings-tabs";

const SECTIONS: { key: SettingSection; title: string; help?: string }[] = [
  { key: "general", title: "General", help: "Company and store names, tagline, announcement bar." },
  { key: "branding", title: "Branding", help: "Logos, favicon and brand colors used across the site and emails." },
  { key: "contact", title: "Contact", help: "Shown in the footer and emails." },
  { key: "social", title: "Social", help: "Full URLs. Empty fields are hidden." },
  { key: "commerce", title: "Commerce", help: "Countries and currencies you sell in (ISO codes, comma-separated). Each country needs a shipping zone." },
  { key: "payments", title: "Payments", help: "Stripe is live. Other providers can be enabled when configured." },
  { key: "rewards", title: "Mama Rewards", help: "Control how customers earn and redeem points. Redemption is percentage-based so it stays fair across currencies." },
  { key: "shipping", title: "Shipping", help: "Zones and rates are managed under Shipping & tax." },
  { key: "email", title: "Email", help: "Sender identity for Resend (the domain must be verified in Resend)." },
  { key: "seo", title: "SEO", help: "Default title/description and OpenGraph image." },
  { key: "localization", title: "Localization", help: "Enabled languages: en, es, fr, ht." },
  { key: "policies", title: "Policies", help: "Shipping, returns, privacy and terms." },
];

const LABELS: Record<string, string> = {
  companyName: "Company name", storeName: "Store name (short)", tagline: "Tagline", announcement: "Announcement bar text", announcementEnabled: "Show announcement bar",
  logoUrl: "Main logo URL", logoLightUrl: "Light logo URL (dark backgrounds)", logoDarkUrl: "Dark logo URL", faviconUrl: "Favicon URL", primaryColor: "Primary color", accentColor: "Accent color",
  email: "Email", phone: "Phone", whatsapp: "WhatsApp number (with country code)", addressLine: "Address", city: "City", region: "State / region", postalCode: "Postal code", country: "Country (ISO)",
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", pinterest: "Pinterest",
  defaultCurrency: "Default currency", enabledCurrencies: "Enabled currencies", enabledCountries: "Countries you ship to", lowStockThreshold: "Low stock threshold", reservationMinutes: "Stock reservation (minutes, min 30)", freeShippingBannerCents: "Free shipping threshold shown in banners (cents)", allowGuestCheckout: "Allow guest checkout",
  stripeEnabled: "Stripe enabled", stripeTaxEnabled: "Stripe Tax (automatic tax)", applePayGooglePay: "Apple Pay / Google Pay (Stripe Checkout)", mercadoPagoEnabled: "Mercado Pago (Mexico)", paypalEnabled: "PayPal",
  enabled: "Enable Mama Rewards", paidOrderPoints: "Points per paid order", perItemPoints: "Extra points per item", minRedeemPoints: "Minimum points to redeem", pointsPerPercent: "Points required for 1% discount", maxRedeemPercent: "Maximum reward discount (%)", flameThreshold: "Flame tier threshold", crownThreshold: "Crown tier threshold",
  originCountry: "Ship-from country", handlingDays: "Handling days", carrierIntegration: "Carrier integration (none / shippo / easypost)", fromName: "From name", fromEmail: "From email", replyTo: "Reply-to", footerText: "Email footer text",
  defaultTitle: "Default title", defaultDescription: "Default description", ogImageUrl: "OpenGraph image URL", twitterHandle: "Twitter/X handle", defaultLocale: "Default language", enabledLocales: "Enabled languages", defaultCountry: "Default country",
  shipping: "Shipping policy", returns: "Return policy", privacy: "Privacy policy", terms: "Terms & conditions",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const current = SECTIONS.find((s) => s.key === tab) ?? SECTIONS[0];
  const value = await getSection(current.key) as Record<string, unknown>;
  const branding = current.key === "branding" ? await getSection("branding") : null;
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsTabs tabs={SECTIONS.map((s) => ({ key: s.key, title: s.title }))} active={current.key} />
      <Card title={current.title} className="mt-4 max-w-3xl">
        {current.help && <p className="mb-4 text-sm text-ink-soft">{current.help}</p>}
        {branding && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {(["logoUrl", "logoLightUrl", "logoDarkUrl", "faviconUrl"] as const).map((f) => (
              <form key={f} action={async (fd) => { "use server"; await uploadBrandingAsset(f, fd); }} className="flex items-center gap-2 rounded-xl border border-sand p-2 text-xs">
                <div className="relative size-10 overflow-hidden rounded bg-petal">{branding[f] && <Image src={branding[f]} alt="" fill sizes="40px" className="object-contain" />}</div>
                <span className="w-24">{LABELS[f]}</span><input type="file" name="file" accept="image/*,.ico,.svg" className="flex-1" /><button className="rounded-pill border border-sand px-2 py-1">Upload</button>
              </form>
            ))}
          </div>
        )}
        <form action={async (fd) => { "use server"; await saveSettingsSection(current.key, fd); }} className="space-y-4">
          {Object.entries(DEFAULT_SETTINGS[current.key]).map(([k, def]) => {
            const v = value[k];
            const label = LABELS[k] ?? k;
            if (typeof def === "boolean") return <div key={k}><Checkbox name={k} label={label} defaultChecked={!!v} /></div>;
            if (typeof def === "number") return <Field key={k} label={label}><Input name={k} type="number" min={0} defaultValue={String(v ?? def)} /></Field>;
            if (Array.isArray(def)) return <Field key={k} label={label} hint="Comma-separated"><Input name={k} defaultValue={(v as string[]).join(", ")} /></Field>;
            if (current.key === "policies" || k === "defaultDescription") return <Field key={k} label={label}><Textarea name={k} defaultValue={String(v ?? "")} className="min-h-40" /></Field>;
            return <Field key={k} label={label}><Input name={k} defaultValue={String(v ?? "")} /></Field>;
          })}
          {current.key === "rewards" && <p className="rounded-xl bg-petal px-4 py-3 text-xs leading-5 text-ink-soft">Example: 100 points per 1% means 500 points = 5% off. The maximum discount prevents excessive point use on one order.</p>}
          <SubmitButton>Save {current.title.toLowerCase()}</SubmitButton>
        </form>
      </Card>
    </>
  );
}
