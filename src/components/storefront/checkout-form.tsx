"use client";
import { useActionState, useState } from "react";
import { startCheckout, type CheckoutState } from "@/server/checkout";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Dict } from "@/i18n";

type Rate = { id: string; name: string; priceCents: number; freeAboveCents: number | null; minDays: number | null; maxDays: number | null };
type Addr = Partial<Record<"fullName" | "line1" | "line2" | "city" | "region" | "postalCode" | "country" | "phone", string | null>>;

/** Checkout en 4 étapes (Contact → Shipping → Delivery → Payment). Tout est revalidé côté serveur. */
export function CheckoutForm({ countries, ratesByCountry, subtotalCents, currency, freeShipping, defaultEmail, defaultAddress, loggedIn, t }: {
  countries: { code: string; name: string }[]; ratesByCountry: Record<string, Rate[]>; subtotalCents: number; currency: string; freeShipping: boolean; defaultEmail?: string; defaultAddress?: Addr; loggedIn: boolean; t: Dict["checkout"];
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(defaultAddress?.country ?? countries[0]?.code ?? "US");
  const [rateId, setRateId] = useState<string>("");
  const rates = ratesByCountry[country] ?? [];
  const chosen = rates.find((r) => r.id === rateId) ?? rates[0];
  const fe = (k: string) => state.fieldErrors?.[k]?.[0] ?? state.fieldErrors?.[`address.${k}`]?.[0];
  const steps = [t.stepContact, t.stepShipping, t.stepDelivery, t.stepPayment];
  const show = (i: number) => (step === i ? "block" : "hidden");

  return (
    <form action={action} className="space-y-8">
      <ol className="flex gap-2 text-xs sm:text-sm">{steps.map((s, i) => <li key={s} className="flex items-center gap-2"><button type="button" onClick={() => i < step && setStep(i)} className={cn("grid size-7 place-items-center rounded-pill text-xs font-semibold", i <= step ? "bg-cocoa text-cream" : "bg-sand text-ink-soft")}>{i + 1}</button><span className={i === step ? "font-semibold" : "text-ink-soft"}>{s}</span>{i < 3 && <span className="mx-1 h-px w-4 bg-sand" />}</li>)}</ol>
      {state.error && <Alert>{state.error}</Alert>}

      <section className={cn("space-y-4", show(0))}>
        <h2 className="text-2xl text-cocoa">{t.contact}</h2>
        <Field label="Email" error={fe("email")}><Input name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" /></Field>
        <Field label="Phone"><Input name="phone" type="tel" defaultValue={defaultAddress?.phone ?? ""} autoComplete="tel" /></Field>
        {!loggedIn && <p className="text-xs text-ink-soft">Have an account? <a href="/login?next=/checkout" className="text-flame underline">Sign in</a> to check out faster.</p>}
        <Button type="button" onClick={() => setStep(1)}>{t.next}</Button>
      </section>

      <section className={cn("space-y-4", show(1))}>
        <h2 className="text-2xl text-cocoa">{t.shippingAddress}</h2>
        <Field label="Country"><Select name="country" value={country} onChange={(e) => { setCountry(e.target.value); setRateId(""); }}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field>
        <Field label="Full name" error={fe("fullName")}><Input name="fullName" required defaultValue={defaultAddress?.fullName ?? ""} autoComplete="name" /></Field>
        <Field label="Address" error={fe("line1")}><Input name="line1" required defaultValue={defaultAddress?.line1 ?? ""} autoComplete="address-line1" /></Field>
        <Field label="Apartment, suite (optional)"><Input name="line2" defaultValue={defaultAddress?.line2 ?? ""} autoComplete="address-line2" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" error={fe("city")}><Input name="city" required defaultValue={defaultAddress?.city ?? ""} autoComplete="address-level2" /></Field>
          <Field label="State / region"><Input name="region" defaultValue={defaultAddress?.region ?? ""} autoComplete="address-level1" /></Field>
          <Field label="ZIP / postal code"><Input name="postalCode" defaultValue={defaultAddress?.postalCode ?? ""} autoComplete="postal-code" /></Field>
        </div>
        {loggedIn && <Checkbox name="saveAddress" label="Save this address to my account" defaultChecked />}
        <div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setStep(0)}>{t.back}</Button><Button type="button" onClick={() => setStep(2)}>{t.next}</Button></div>
      </section>

      <section className={cn("space-y-3", show(2))}>
        <h2 className="text-2xl text-cocoa">{t.shippingMethod}</h2>
        {rates.length === 0 && <Alert tone="info">{t.noShip}</Alert>}
        {rates.map((r) => {
          const free = freeShipping || (r.freeAboveCents != null && subtotalCents >= r.freeAboveCents);
          return (
            <label key={r.id} className="flex cursor-pointer items-center justify-between rounded-2xl border border-sand bg-white px-4 py-3 has-[:checked]:border-cocoa">
              <span className="flex items-center gap-3"><input type="radio" name="shippingRateId" value={r.id} checked={(rateId || rates[0]?.id) === r.id} onChange={() => setRateId(r.id)} className="accent-cocoa" required /><span><span className="block text-sm font-medium">{r.name}</span>{r.minDays && r.maxDays && <span className="block text-xs text-ink-soft">{r.minDays}–{r.maxDays} business days</span>}</span></span>
              <span className="text-sm font-semibold">{free ? "Free" : formatCents(r.priceCents, currency)}</span>
            </label>
          );
        })}
        <Field label="Order notes (optional)"><Textarea name="notes" maxLength={500} className="min-h-20" /></Field>
        <div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setStep(1)}>{t.back}</Button><Button type="button" disabled={rates.length === 0} onClick={() => setStep(3)}>{t.next}</Button></div>
      </section>

      <section className={cn("space-y-4", show(3))}>
        <h2 className="text-2xl text-cocoa">{t.stepPayment}</h2>
        <div className="rounded-2xl bg-white p-5 text-sm">
          <p>{t.shipping}: <strong>{chosen?.name ?? "—"}</strong> → {country}</p>
          <p className="mt-1 text-ink-soft">{t.tax}: {t.taxNote}</p>
        </div>
        <div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setStep(2)}>{t.back}</Button><SubmitButton size="lg" className="flex-1" pendingText="Redirecting…" disabled={rates.length === 0}>{t.pay}</SubmitButton></div>
        <p className="text-center text-xs text-ink-soft">{t.secure}</p>
      </section>
    </form>
  );
}
