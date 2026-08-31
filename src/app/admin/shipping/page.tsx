import { adminListZones, saveZone, saveRate, deleteRate, saveTaxRate, deleteTaxRate } from "@/server/admin/settings";
import { getSection } from "@/lib/settings";
import { PageHeader, Card } from "@/components/admin/ui";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents, fromCents } from "@/lib/money";

export default async function ShippingPage() {
  const [zones, commerce, shipping] = await Promise.all([adminListZones(), getSection("commerce"), getSection("shipping")]);
  const curSel = (def: string) => <Select name="currency" defaultValue={def}>{commerce.enabledCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}</Select>;
  return (
    <>
      <PageHeader title="Shipping & tax" sub={`Zones group ISO country codes. Each rate has a currency and optional weight range. Carrier integration: ${shipping.carrierIntegration} (Shippo / EasyPost ready in Settings → Shipping).`} />
      <div className="grid gap-6 lg:grid-cols-2">
        {zones.map((z) => (
          <Card key={z.id} title={`${z.name} · ${z.countries.join(", ")}`}>
            <form action={async (fd) => { "use server"; await saveZone(fd); }} className="mb-4 flex flex-wrap items-end gap-2"><input type="hidden" name="id" value={z.id} /><Field label="Zone name"><Input name="name" defaultValue={z.name} /></Field><Field label="Countries"><Input name="countries" defaultValue={z.countries.join(", ")} /></Field><SubmitButton size="sm" variant="ghost">Save zone</SubmitButton></form>
            <ul className="divide-y divide-sand">
              {z.rates.filter((r) => r.isActive).map((r) => (
                <li key={r.id} className="py-3">
                  <form action={async (fd) => { "use server"; await saveRate(fd); }} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                    <input type="hidden" name="id" value={r.id} /><input type="hidden" name="zoneId" value={z.id} />
                    <Field label="Rate" className="col-span-2"><Input name="name" defaultValue={r.name} /></Field>
                    <Field label="Price"><Input name="price" type="number" step="0.01" defaultValue={fromCents(r.priceCents)} /></Field>
                    <Field label="Currency">{curSel(r.currency)}</Field>
                    <Field label="Free above"><Input name="freeAbove" type="number" step="0.01" defaultValue={r.freeAboveCents ? fromCents(r.freeAboveCents) : ""} /></Field>
                    <Field label="Min g"><Input name="minWeightGrams" type="number" defaultValue={r.minWeightGrams ?? ""} /></Field>
                    <Field label="Max g"><Input name="maxWeightGrams" type="number" defaultValue={r.maxWeightGrams ?? ""} /></Field>
                    <Field label="Days"><div className="flex gap-1"><Input name="minDays" type="number" defaultValue={r.minDays ?? ""} /><Input name="maxDays" type="number" defaultValue={r.maxDays ?? ""} /></div></Field>
                    <div className="col-span-2 flex items-center gap-3 sm:col-span-4 lg:col-span-8"><SubmitButton size="sm" variant="ghost">Save rate</SubmitButton><span className="text-xs text-ink-soft">{formatCents(r.priceCents, r.currency)}</span></div>
                  </form>
                  <form action={async () => { "use server"; await deleteRate(r.id); }}><button className="text-xs text-red-700 underline">Remove {r.name}</button></form>
                </li>
              ))}
            </ul>
            <form action={async (fd) => { "use server"; await saveRate(fd); }} className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-dashed border-sand p-3 sm:grid-cols-5">
              <input type="hidden" name="zoneId" value={z.id} />
              <Field label="New rate"><Input name="name" placeholder="Standard" required /></Field><Field label="Price"><Input name="price" type="number" step="0.01" required /></Field><Field label="Currency">{curSel(commerce.defaultCurrency)}</Field><Field label="Free above"><Input name="freeAbove" type="number" step="0.01" /></Field>
              <div className="flex items-end"><SubmitButton size="sm">Add</SubmitButton></div>
            </form>
            <div className="mt-4 border-t border-sand pt-3">
              <p className="mb-2 text-xs font-semibold">Tax rates (estimate in cart; Stripe Tax computes the final amount)</p>
              <ul className="space-y-1 text-xs">{z.taxRates.map((t) => <li key={t.id} className="flex justify-between"><span>{t.name}{t.region ? ` (${t.region})` : ""} · {(t.rateBps / 100).toFixed(2)}%</span><form action={async () => { "use server"; await deleteTaxRate(t.id); }}><button className="text-red-700 underline">Remove</button></form></li>)}</ul>
              <form action={async (fd) => { "use server"; await saveTaxRate(fd); }} className="mt-2 flex flex-wrap items-end gap-2"><input type="hidden" name="zoneId" value={z.id} /><Field label="Name"><Input name="name" placeholder="Sales tax" className="h-9" /></Field><Field label="Region (opt.)"><Input name="region" placeholder="CA" className="h-9 w-20" /></Field><Field label="Rate %"><Input name="rate" type="number" step="0.01" className="h-9 w-24" /></Field><SubmitButton size="sm" variant="ghost">Add tax</SubmitButton></form>
            </div>
          </Card>
        ))}
        <Card title="New zone"><form action={async (fd) => { "use server"; await saveZone(fd); }} className="space-y-3"><Field label="Zone name"><Input name="name" placeholder="Canada" required /></Field><Field label="Countries (ISO codes, comma-separated)"><Input name="countries" placeholder="CA" required /></Field><SubmitButton>Create zone</SubmitButton></form></Card>
      </div>
    </>
  );
}
