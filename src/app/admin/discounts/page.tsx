import { adminListDiscounts, saveDiscount, toggleDiscount } from "@/server/admin/settings";
import { adminListCategories } from "@/server/admin/products";
import { db } from "@/lib/db";
import { getSection } from "@/lib/settings";
import { PageHeader, Table, td, Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function DiscountsPage() {
  const [discounts, categories, products, commerce] = await Promise.all([adminListDiscounts(), adminListCategories(), db.product.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 300 }), getSection("commerce")]);
  return (
    <>
      <PageHeader title="Discounts" sub="A fixed amount or a minimum order is always tied to one currency and only applies to carts in that currency." />
      <Table head={["Code", "Type", "Value", "Currency", "Min. order", "Uses", "Per customer", "Valid", "Restrictions", "Status", ""]}>
        {discounts.map((d) => <tr key={d.id}><td className={`${td} font-semibold`}>{d.code}</td><td className={td}>{d.type}</td><td className={td}>{d.type === "PERCENT" ? `${d.value}%` : d.type === "FIXED" ? formatCents(d.value, d.currency ?? "USD") : "—"}</td><td className={td}>{d.currency ?? "any"}</td><td className={td}>{d.minOrderCents ? formatCents(d.minOrderCents, d.currency ?? "USD") : "—"}</td><td className={td}>{d.usedCount}{d.maxUses ? ` / ${d.maxUses}` : ""}</td><td className={td}>{d.usesPerCustomer ?? "—"}</td><td className={td}>{d.startsAt ? formatDate(d.startsAt) : "…"} → {d.endsAt ? formatDate(d.endsAt) : "…"}</td><td className={td}>{[...d.categories.map((c) => c.name), ...d.products.map((p) => p.name)].join(", ") || "All"}</td><td className={td}><Badge tone={d.isActive ? "green" : "neutral"}>{d.isActive ? "Active" : "Off"}</Badge></td><td className={td}><form action={async () => { "use server"; await toggleDiscount(d.id, !d.isActive); }}><button className="text-xs underline">{d.isActive ? "Deactivate" : "Activate"}</button></form></td></tr>)}
      </Table>
      <Card title="Create or update a code" className="mt-8 max-w-3xl">
        <form action={async (fd) => { "use server"; await saveDiscount(fd); }} className="grid gap-4 sm:grid-cols-3">
          <Field label="Code"><Input name="code" placeholder="SUMMER15" required /></Field>
          <Field label="Type"><Select name="type" defaultValue="PERCENT"><option value="PERCENT">Percent off</option><option value="FIXED">Fixed amount off</option><option value="FREE_SHIPPING">Free shipping</option></Select></Field>
          <Field label="Value" hint="Percent (15) or amount (10.00)"><Input name="value" type="number" step="0.01" min="0" defaultValue={0} /></Field>
          <Field label="Currency" hint="Required for fixed amount / minimum order"><Select name="currency" defaultValue={commerce.defaultCurrency}><option value="">Any</option>{commerce.enabledCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Minimum order"><Input name="minOrder" type="number" step="0.01" min="0" /></Field>
          <Field label="Max uses (total)"><Input name="maxUses" type="number" min="1" /></Field>
          <Field label="Uses per customer"><Input name="usesPerCustomer" type="number" min="1" /></Field>
          <Field label="Starts"><Input name="startsAt" type="date" /></Field>
          <Field label="Ends"><Input name="endsAt" type="date" /></Field>
          <Field label="Only these categories" className="sm:col-span-3"><Select name="categoryIds" multiple className="h-28">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Only these products" className="sm:col-span-3"><Select name="productIds" multiple className="h-28">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <div className="sm:col-span-3"><SubmitButton>Save code</SubmitButton></div>
        </form>
      </Card>
    </>
  );
}
