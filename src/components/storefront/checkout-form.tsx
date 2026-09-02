"use client";
import { useActionState, useMemo, useState } from "react";
import { Check, Gift, LockKeyhole, MapPin, PackageCheck, UserRound } from "lucide-react";
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
type RewardRules = { enabled: boolean; minRedeemPoints: number; pointsPerPercent: number; maxRedeemPercent: number };

export function CheckoutForm({ countries, ratesByCountry, subtotalCents, currency, freeShipping, defaultEmail, defaultAddress, loggedIn, rewardBalance = 0, rewardRules, t }: {
  countries: { code: string; name: string }[]; ratesByCountry: Record<string, Rate[]>; subtotalCents: number; currency: string; freeShipping: boolean; defaultEmail?: string; defaultAddress?: Addr; loggedIn: boolean; rewardBalance?: number; rewardRules: RewardRules; t: Dict["checkout"];
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(defaultAddress?.country ?? countries[0]?.code ?? "US");
  const [rateId, setRateId] = useState<string>("");
  const [rewardPoints, setRewardPoints] = useState(0);
  const rates = ratesByCountry[country] ?? [];
  const chosen = rates.find((r) => r.id === rateId) ?? rates[0];
  const fe = (k: string) => state.fieldErrors?.[k]?.[0] ?? state.fieldErrors?.[`address.${k}`]?.[0];
  const steps = [t.stepContact, t.stepShipping, t.stepDelivery, t.stepPayment];
  const stepIcons = [UserRound, MapPin, PackageCheck, LockKeyhole];

  const rewardOptions = useMemo(() => {
    if (!loggedIn || !rewardRules.enabled || rewardBalance < rewardRules.minRedeemPoints) return [];
    const maxPoints = Math.min(rewardBalance, rewardRules.maxRedeemPercent * rewardRules.pointsPerPercent);
    const start = Math.ceil(rewardRules.minRedeemPoints / rewardRules.pointsPerPercent) * rewardRules.pointsPerPercent;
    const out: number[] = [];
    for (let p = start; p <= maxPoints; p += rewardRules.pointsPerPercent) out.push(p);
    return out;
  }, [loggedIn, rewardBalance, rewardRules]);
  const rewardPercent = rewardPoints > 0 ? Math.min(rewardRules.maxRedeemPercent, Math.floor(rewardPoints / rewardRules.pointsPerPercent)) : 0;
  const rewardEstimate = Math.floor((subtotalCents * rewardPercent) / 100);

  return (
    <form action={action} className="space-y-7">
      <input type="hidden" name="rewardPoints" value={rewardPoints} />
      <div className="rounded-[24px] border border-sand bg-cream/70 p-3 sm:p-4">
        <ol className="grid grid-cols-4 gap-1 sm:gap-2">
          {steps.map((label, i) => {
            const Icon = stepIcons[i];
            const done = i < step;
            const active = i === step;
            return <li key={label}><button type="button" onClick={() => i < step && setStep(i)} disabled={i > step} className="w-full text-left disabled:cursor-default"><div className={cn("flex items-center gap-2 rounded-2xl px-2 py-2.5 transition sm:px-3", active ? "bg-cocoa text-cream shadow-sm" : done ? "bg-white text-cocoa" : "text-ink-soft")}><span className={cn("grid size-7 shrink-0 place-items-center rounded-full", active ? "bg-white/15" : done ? "bg-petal" : "bg-white")}>{done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}</span><span className="hidden min-w-0 sm:block"><span className="block text-[9px] font-bold uppercase tracking-[.12em] opacity-65">0{i + 1}</span><span className="block truncate text-xs font-semibold">{label}</span></span></div></button></li>;
          })}
        </ol>
      </div>

      {state.error && <Alert>{state.error}</Alert>}

      {step === 0 && <section className="space-y-5"><SectionTitle eyebrow="01 · Contact" title={t.contact} text="We’ll use these details for your order confirmation and delivery updates." /><div className="grid gap-4 sm:grid-cols-2"><Field label="Email" error={fe("email")}><Input name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" /></Field><Field label="Phone"><Input name="phone" type="tel" defaultValue={defaultAddress?.phone ?? ""} autoComplete="tel" /></Field></div>{!loggedIn && <div className="rounded-2xl bg-petal/55 px-4 py-3 text-xs text-ink-soft">Have an account? <a href="/login?next=/checkout" className="font-semibold text-flame underline underline-offset-2">Sign in</a> to check out faster and use Mama Rewards.</div>}<Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => setStep(1)}>{t.next}</Button></section>}

      {step === 1 && <section className="space-y-5"><SectionTitle eyebrow="02 · Delivery address" title={t.shippingAddress} text="Enter the address exactly as it should appear for the carrier." /><Field label="Country"><Select name="country" value={country} onChange={(e) => { setCountry(e.target.value); setRateId(""); }}>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select></Field><Field label="Full name" error={fe("fullName")}><Input name="fullName" required defaultValue={defaultAddress?.fullName ?? ""} autoComplete="name" /></Field><Field label="Address" error={fe("line1")}><Input name="line1" required defaultValue={defaultAddress?.line1 ?? ""} autoComplete="address-line1" /></Field><Field label="Apartment, suite (optional)"><Input name="line2" defaultValue={defaultAddress?.line2 ?? ""} autoComplete="address-line2" /></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="City" error={fe("city")}><Input name="city" required defaultValue={defaultAddress?.city ?? ""} autoComplete="address-level2" /></Field><Field label="State / region"><Input name="region" defaultValue={defaultAddress?.region ?? ""} autoComplete="address-level1" /></Field><Field label="ZIP / postal code"><Input name="postalCode" defaultValue={defaultAddress?.postalCode ?? ""} autoComplete="postal-code" /></Field></div>{loggedIn && <div className="rounded-2xl border border-sand bg-cream px-4 py-3"><Checkbox name="saveAddress" label="Save this address to my account" defaultChecked /></div>}<StepButtons back={() => setStep(0)} next={() => setStep(2)} backLabel={t.back} nextLabel={t.next} /></section>}

      {step === 2 && <section className="space-y-5"><SectionTitle eyebrow="03 · Shipping" title={t.shippingMethod} text="Choose the delivery option that works best for you." />{rates.length === 0 && <Alert tone="info">{t.noShip}</Alert>}<div className="grid gap-3">{rates.map((r) => { const free = freeShipping || (r.freeAboveCents != null && subtotalCents >= r.freeAboveCents); const selected = (rateId || rates[0]?.id) === r.id; return <label key={r.id} className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-[22px] border p-4 transition", selected ? "border-cocoa bg-petal/45 shadow-sm" : "border-sand bg-white hover:border-cocoa/40")}><span className="flex min-w-0 items-center gap-3"><input type="radio" name="shippingRateId" value={r.id} checked={selected} onChange={() => setRateId(r.id)} className="size-4 accent-cocoa" required /><span className="min-w-0"><span className="block text-sm font-semibold text-cocoa">{r.name}</span>{r.minDays && r.maxDays && <span className="mt-1 block text-xs text-ink-soft">{r.minDays}–{r.maxDays} business days</span>}</span></span><span className={cn("shrink-0 text-sm font-bold", free ? "text-green-700" : "text-cocoa")}>{free ? "Free" : formatCents(r.priceCents, currency)}</span></label>; })}</div><Field label="Order notes (optional)"><Textarea name="notes" maxLength={500} className="min-h-24" /></Field><StepButtons back={() => setStep(1)} next={() => setStep(3)} backLabel={t.back} nextLabel={t.next} nextDisabled={rates.length === 0} /></section>}

      {step === 3 && (
        <section className="space-y-5">
          <SectionTitle eyebrow="04 · Payment" title={t.stepPayment} text="Review your delivery method, use rewards if available, then continue to secure payment." />
          <div className="rounded-[22px] border border-sand bg-cream p-4 sm:p-5"><div className="flex items-start gap-3"><PackageCheck className="mt-0.5 size-5 shrink-0 text-flame" /><div><p className="text-xs font-bold uppercase tracking-[.12em] text-ink-soft">Shipping method</p><p className="mt-1 font-semibold text-cocoa">{chosen?.name ?? "—"}</p><p className="mt-1 text-xs text-ink-soft">Destination: {country}</p></div></div></div>

          {loggedIn && rewardRules.enabled && (
            <div className="rounded-[22px] border border-sand bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-petal text-flame"><Gift className="size-5" /></span><div><p className="font-semibold text-cocoa">Mama Rewards</p><p className="mt-1 text-xs text-ink-soft">You have <strong className="text-cocoa">{rewardBalance} points</strong>.</p></div></div>
              {rewardOptions.length > 0 ? <div className="mt-4"><label className="text-xs font-semibold uppercase tracking-[.08em] text-ink-soft">Use points</label><Select value={String(rewardPoints)} onChange={(e) => setRewardPoints(Number(e.target.value))} className="mt-2"><option value="0">Don’t use points</option>{rewardOptions.map((points) => { const percent = Math.floor(points / rewardRules.pointsPerPercent); return <option key={points} value={points}>{points} points · {percent}% off</option>; })}</Select>{rewardPoints > 0 && <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-xs text-green-900"><span>{rewardPoints} points applied</span><strong>Est. −{formatCents(rewardEstimate, currency)}</strong></div>}</div> : <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-xs text-ink-soft">Earn at least {rewardRules.minRedeemPoints} points to redeem them at checkout.</p>}
            </div>
          )}

          <div className="rounded-[22px] border border-green-200 bg-green-50/70 p-4 text-sm text-green-900"><div className="flex gap-3"><LockKeyhole className="mt-0.5 size-4 shrink-0" /><p>Your payment details are entered on the secure payment page. MAMAHAIR does not display your full card information here.</p></div></div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row"><Button type="button" variant="ghost" className="sm:min-w-28" onClick={() => setStep(2)}>{t.back}</Button><SubmitButton size="lg" className="flex-1" pendingText="Redirecting…" disabled={rates.length === 0}>{t.pay}</SubmitButton></div><p className="text-center text-xs leading-5 text-ink-soft">{t.secure}</p>
        </section>
      )}
    </form>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-flame">{eyebrow}</p><h2 className="mt-1.5 text-3xl text-cocoa sm:text-[2.1rem]">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">{text}</p></div>; }
function StepButtons({ back, next, backLabel, nextLabel, nextDisabled }: { back: () => void; next: () => void; backLabel: string; nextLabel: string; nextDisabled?: boolean }) { return <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row"><Button type="button" variant="ghost" className="sm:min-w-28" onClick={back}>{backLabel}</Button><Button type="button" size="lg" className="flex-1" disabled={nextDisabled} onClick={next}>{nextLabel}</Button></div>; }
