"use client";
import { useActionState, useState } from "react";
import { createProduct, updateProduct, type ActionState } from "@/server/admin/products";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { CONCERN_LABELS, HAIR_TYPE_LABELS, cn } from "@/lib/utils";
import { fromCents, CURRENCIES } from "@/lib/money";
import { PRODUCT_TYPES, HAIR_MATERIALS, HAIR_ORIGINS, TEXTURES, DENSITIES, LACE_TYPES, LENGTHS, CAP_SIZES, WIG_TYPES, HAIR_GRADES, CLOSURE_TYPES, HAIR_PRODUCT_TYPES } from "@/lib/catalog";
import type { Product } from "@prisma/client";

const TABS = ["General", "Hair attributes", "Pricing & inventory", "Shipping", "SEO"] as const;

export function ProductForm({ product, categories, currencies }: { product?: Product; categories: { id: string; name: string }[]; currencies: string[] }) {
  const action = product?.id ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [type, setType] = useState(product?.productType ?? "WIG");
  const p = product;
  const isHair = HAIR_PRODUCT_TYPES.includes(type);
  const tri = (name: string, label: string, v: boolean | null | undefined) => <Field label={label}><Select name={name} defaultValue={v == null ? "" : String(v)}><option value="">—</option><option value="true">Yes</option><option value="false">No</option></Select></Field>;
  const show = (t: (typeof TABS)[number]) => (tab === t ? "block" : "hidden");

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">Saved.</Alert>}
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-pill bg-white p-1">{TABS.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("shrink-0 rounded-pill px-4 py-2 text-sm font-medium", tab === t ? "bg-cocoa text-cream" : "hover:bg-petal")}>{t}</button>)}</div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className={cn("space-y-4 rounded-2xl bg-white p-5", show("General"))}>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><Input name="name" required defaultValue={p?.name} /></Field><Field label="Product type"><Select name="productType" value={type} onChange={(e) => setType(e.target.value as typeof type)}>{Object.entries(PRODUCT_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="URL slug" hint="Leave empty to generate from the name"><Input name="slug" defaultValue={p?.slug} pattern="[a-z0-9-]*" /></Field><Field label="Product SKU (optional)"><Input name="sku" defaultValue={p?.sku ?? ""} /></Field></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Brand"><Input name="brand" defaultValue={p?.brand ?? ""} /></Field><Field label="Category"><Select name="categoryId" defaultValue={p?.categoryId ?? ""}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field></div>
            <Field label="Short description (cards, SEO)"><Input name="shortDesc" defaultValue={p?.shortDesc ?? ""} maxLength={200} /></Field>
            <Field label="Description"><Textarea name="description" defaultValue={p?.description ?? ""} className="min-h-40" /></Field>
            <Field label="How to use / install"><Textarea name="howToUse" defaultValue={p?.howToUse ?? ""} className="min-h-20" /></Field>
            <Field label="Ingredients (care products)"><Textarea name="ingredients" defaultValue={p?.ingredients ?? ""} className="min-h-20" /></Field>
          </section>

          <section className={cn("space-y-4 rounded-2xl bg-white p-5", show("Hair attributes"))}>
            {isHair ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Hair material"><Select name="hairMaterial" defaultValue={p?.hairMaterial ?? ""}><option value="">—</option>{HAIR_MATERIALS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
                  <Field label="Origin"><Select name="hairOrigin" defaultValue={p?.hairOrigin ?? ""}><option value="">—</option>{HAIR_ORIGINS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
                  <Field label="Grade"><Select name="hairGrade" defaultValue={p?.hairGrade ?? ""}><option value="">—</option>{HAIR_GRADES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
                  {type === "WIG" && <Field label="Wig type"><Select name="wigType" defaultValue={p?.wigType ?? ""}><option value="">—</option>{WIG_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></Field>}
                  {type === "WIG" && <Field label="Cap size"><Select name="capSize" defaultValue={p?.capSize ?? ""}><option value="">—</option>{CAP_SIZES.map((v) => <option key={v}>{v}</option>)}</Select></Field>}
                  {(type === "CLOSURE" || type === "FRONTAL" || type === "WIG") && <Field label="Closure / parting"><Select name="closureType" defaultValue={p?.closureType ?? ""}><option value="">—</option>{CLOSURE_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></Field>}
                  <Field label="Parting"><Input name="parting" defaultValue={p?.parting ?? ""} /></Field>
                  {type === "BUNDLE" && <Field label="Bundles in pack"><Input name="bundlesCount" type="number" min="0" defaultValue={p?.bundlesCount ?? ""} /></Field>}
                </div>
                <Multi name="textures" label="Textures available" values={TEXTURES} selected={p?.textures ?? []} />
                <Multi name="lengths" label="Lengths available (inches)" values={LENGTHS.map(String)} selected={(p?.lengths ?? []).map(String)} suffix='"' />
                <Multi name="densities" label="Densities" values={DENSITIES} selected={p?.densities ?? []} />
                <Multi name="laceTypes" label="Lace" values={LACE_TYPES} selected={p?.laceTypes ?? []} />
                <Field label="Colors (comma-separated)"><Input name="colors" defaultValue={(p?.colors ?? []).join(", ")} placeholder="Natural Black, 1B, 613 Blonde" /></Field>
                <div className="grid gap-4 sm:grid-cols-4">{tri("canBleach", "Can be bleached", p?.canBleach)}{tri("canDye", "Can be dyed", p?.canDye)}{tri("heatSafe", "Heat safe", p?.heatSafe)}{tri("prePlucked", "Pre-plucked", p?.prePlucked)}{tri("babyHair", "Baby hair", p?.babyHair)}{tri("glueless", "Glueless", p?.glueless)}{tri("adjustableStrap", "Adjustable strap", p?.adjustableStrap)}</div>
                <p className="text-xs text-ink-soft">These attributes describe the product range; each variant (texture × length × …) is defined in the Variants section below.</p>
              </>
            ) : <p className="text-sm text-ink-soft">Hair attributes apply to wigs, bundles, extensions, closures and frontals. Fill the hair-type profile instead.</p>}
            <div><p className="mb-2 text-sm font-medium">Best for hair types</p><div className="flex flex-wrap gap-3">{Object.entries(HAIR_TYPE_LABELS).map(([k, l]) => <Checkbox key={k} name="hairTypes" value={k} label={l} defaultChecked={p?.hairTypes.includes(k as never)} />)}</div></div>
            <div><p className="mb-2 text-sm font-medium">Concerns</p><div className="flex flex-wrap gap-3">{Object.entries(CONCERN_LABELS).map(([k, l]) => <Checkbox key={k} name="concerns" value={k} label={l} defaultChecked={p?.concerns.includes(k)} />)}</div></div>
            <Field label="Extra attributes (one per line: Label: value)" hint="For future product types without changing the database"><Textarea name="attributes" defaultValue={Object.entries((p?.attributes as Record<string, string> | null) ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")} className="min-h-20 font-mono text-xs" /></Field>
          </section>

          <section className={cn("space-y-4 rounded-2xl bg-white p-5", show("Pricing & inventory"))}>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Currency"><Select name="currency" defaultValue={p?.currency ?? currencies[0]}>{currencies.map((c) => <option key={c} value={c}>{c} {CURRENCIES[c]?.symbol}</option>)}</Select></Field>
              <Field label="Base price"><Input name="basePrice" type="number" step="0.01" min="0" required defaultValue={p ? fromCents(p.basePriceCents) : ""} /></Field>
              <Field label="Compare-at price"><Input name="compareAt" type="number" step="0.01" min="0" defaultValue={p?.compareAtCents ? fromCents(p.compareAtCents) : ""} /></Field>
              <Field label="Cost (internal)"><Input name="cost" type="number" step="0.01" min="0" defaultValue={p?.costCents ? fromCents(p.costCents) : ""} /></Field>
            </div>
            <div className="flex flex-wrap gap-4"><Checkbox name="isFeatured" label="Featured" defaultChecked={p?.isFeatured} /><Checkbox name="isBestSeller" label="Best seller" defaultChecked={p?.isBestSeller} /><Checkbox name="isNew" label="New arrival" defaultChecked={p?.isNew} /><Checkbox name="isBundle" label="This is a set / bundle (uses components below)" defaultChecked={p?.isBundle} /></div>
            <Field label="Set price (bundles only)"><Input name="bundlePrice" type="number" step="0.01" min="0" defaultValue={p?.bundlePriceCents ? fromCents(p.bundlePriceCents) : ""} /></Field>
            <p className="text-xs text-ink-soft">Stock is managed per variant in the Variants section.</p>
          </section>

          <section className={cn("space-y-4 rounded-2xl bg-white p-5", show("Shipping"))}>
            <Field label="Weight (grams)" hint="Used for weight-based shipping rates"><Input name="weightGrams" type="number" min="0" defaultValue={p?.weightGrams ?? ""} /></Field>
          </section>

          <section className={cn("space-y-4 rounded-2xl bg-white p-5", show("SEO"))}>
            <Field label="Title tag"><Input name="seoTitle" defaultValue={p?.seoTitle ?? ""} maxLength={70} /></Field>
            <Field label="Meta description"><Input name="seoDescription" defaultValue={p?.seoDescription ?? ""} maxLength={160} /></Field>
          </section>
        </div>

        <div className="space-y-4">
          <section className="space-y-4 rounded-2xl bg-white p-5">
            <Field label="Status"><Select name="status" defaultValue={p?.status ?? "ACTIVE"}><option value="DRAFT">Draft (hidden)</option><option value="ACTIVE">Published</option><option value="ARCHIVED">Archived</option></Select></Field>
            <SubmitButton className="w-full" size="lg">{p?.id ? "Save product" : "Create product"}</SubmitButton>
          </section>
        </div>
      </div>
    </form>
  );
}

function Multi({ name, label, values, selected, suffix = "" }: { name: string; label: string; values: string[]; selected: string[]; suffix?: string }) {
  return <div><p className="mb-2 text-sm font-medium">{label}</p><div className="flex flex-wrap gap-2">{values.map((v) => <label key={v} className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-sand px-3 py-1 text-sm has-[:checked]:border-cocoa has-[:checked]:bg-petal"><input type="checkbox" name={name} value={v} defaultChecked={selected.includes(v)} className="accent-cocoa" />{v}{suffix}</label>)}</div></div>;
}
