"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, CircleDollarSign, FileText, Images, Package, Search, Sparkles, Truck } from "lucide-react";
import { createProduct, updateProduct, type ActionState } from "@/server/admin/products";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { CONCERN_LABELS, HAIR_TYPE_LABELS, cn } from "@/lib/utils";
import { fromCents, CURRENCIES } from "@/lib/money";
import { PRODUCT_TYPES, HAIR_MATERIALS, HAIR_ORIGINS, TEXTURES, DENSITIES, LACE_TYPES, LENGTHS, CAP_SIZES, WIG_TYPES, HAIR_GRADES, CLOSURE_TYPES, HAIR_PRODUCT_TYPES } from "@/lib/catalog";
import type { Product } from "@prisma/client";

const SECTIONS = [
  { key: "General", label: "General", short: "Identity", icon: Package },
  { key: "Media", label: "Media", short: "Photos", icon: Images },
  { key: "Hair attributes", label: "Hair attributes", short: "Hair", icon: Sparkles },
  { key: "Pricing & inventory", label: "Pricing & merchandising", short: "Pricing", icon: CircleDollarSign },
  { key: "Shipping", label: "Shipping", short: "Shipping", icon: Truck },
  { key: "SEO", label: "SEO & search", short: "SEO", icon: Search },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function ProductForm({ product, categories, currencies }: { product?: Product; categories: { id: string; name: string }[]; currencies: string[] }) {
  const action = product?.id ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  const [section, setSection] = useState<SectionKey>("General");
  const [type, setType] = useState(product?.productType ?? "WIG");
  const [name, setName] = useState(product?.name ?? "");
  const [status, setStatus] = useState(product?.status ?? "DRAFT");
  const [currency, setCurrency] = useState(product?.currency ?? currencies[0] ?? "USD");
  const [basePrice, setBasePrice] = useState(product ? fromCents(product.basePriceCents) : "");
  const p = product;
  const isHair = HAIR_PRODUCT_TYPES.includes(type);
  const currentIndex = SECTIONS.findIndex((item) => item.key === section);
  const currentMeta = SECTIONS[currentIndex];

  const statusLabel = status === "ACTIVE" ? "Published" : status === "ARCHIVED" ? "Archived" : "Draft";
  const completion = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 25;
    if (type) score += 15;
    if (basePrice && Number(basePrice) >= 0) score += 25;
    if (p?.shortDesc || p?.description) score += 15;
    if (p?.categoryId) score += 10;
    if (p?.seoTitle || p?.seoDescription) score += 10;
    return Math.min(100, score);
  }, [name, type, basePrice, p?.shortDesc, p?.description, p?.categoryId, p?.seoTitle, p?.seoDescription]);

  const tri = (field: string, label: string, value: boolean | null | undefined) => (
    <Field label={label}>
      <Select name={field} defaultValue={value == null ? "" : String(value)}>
        <option value="">Not specified</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
    </Field>
  );

  const go = (direction: -1 | 1) => {
    const next = Math.min(SECTIONS.length - 1, Math.max(0, currentIndex + direction));
    setSection(SECTIONS[next].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">Product saved successfully.</Alert>}

      <div className="sticky top-0 z-20 -mx-2 border-y border-sand/70 bg-[#faf7f4]/95 px-2 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {SECTIONS.map((item, index) => {
            const Icon = item.icon;
            const active = section === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={cn(
                  "flex min-w-[138px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition sm:min-w-0 sm:flex-1",
                  active ? "border-cocoa bg-cocoa text-cream shadow-sm" : "border-sand bg-white text-cocoa hover:border-cocoa/40",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", active ? "bg-white/10" : "bg-petal")}><Icon className="size-4" /></span>
                <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[.12em] opacity-65">0{index + 1}</span><span className="block truncate text-xs font-semibold sm:text-sm">{item.short}</span></span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <SectionShell eyebrow={`Step ${currentIndex + 1} of ${SECTIONS.length}`} title={currentMeta.label} description={sectionDescription(section)}>
            {section === "General" && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Product name"><Input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Example: Body Wave HD Lace Wig" /></Field>
                  <Field label="Product type"><Select name="productType" value={type} onChange={(e) => setType(e.target.value as typeof type)}>{Object.entries(PRODUCT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="URL slug" hint="Leave empty to generate automatically"><Input name="slug" defaultValue={p?.slug} pattern="[a-z0-9-]*" placeholder="body-wave-hd-lace-wig" /></Field>
                  <Field label="Product SKU" hint="Optional at product level"><Input name="sku" defaultValue={p?.sku ?? ""} placeholder="MH-BW-HD" /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Brand"><Input name="brand" defaultValue={p?.brand ?? ""} placeholder="MAMAHAIR" /></Field>
                  <Field label="Category"><Select name="categoryId" defaultValue={p?.categoryId ?? ""}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
                </div>
                <Field label="Short description" hint="Used on product cards and search previews"><Input name="shortDesc" defaultValue={p?.shortDesc ?? ""} maxLength={200} placeholder="One concise sentence that sells the product." /></Field>
                <Field label="Full description"><Textarea name="description" defaultValue={p?.description ?? ""} className="min-h-44" placeholder="Describe the product, finish, construction, benefits and care expectations." /></Field>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="How to use / install"><Textarea name="howToUse" defaultValue={p?.howToUse ?? ""} className="min-h-28" /></Field>
                  <Field label="Ingredients" hint="For care products"><Textarea name="ingredients" defaultValue={p?.ingredients ?? ""} className="min-h-28" /></Field>
                </div>
              </div>
            )}

            {section === "Media" && (
              <div className="space-y-5">
                {!p?.id ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-cocoa p-4 text-cream"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-peach">Main image</p><p className="mt-2 text-sm font-semibold">The first selected photo becomes MAIN.</p><p className="mt-1 text-xs leading-5 text-cream/65">Use the strongest vertical product photo first.</p></div>
                      <div className="rounded-2xl border border-sand bg-petal/40 p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-flame">Recommended</p><p className="mt-2 text-sm font-semibold text-cocoa">1200 × 1500 px · 4:5</p><p className="mt-1 text-xs leading-5 text-ink-soft">JPG, PNG, WebP or AVIF. Up to 10 photos.</p></div>
                      <div className="rounded-2xl border border-sand bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-flame">After creation</p><p className="mt-2 text-sm font-semibold text-cocoa">You can reorder and assign variant photos.</p><p className="mt-1 text-xs leading-5 text-ink-soft">The full Media Studio opens on the product edit page.</p></div>
                    </div>
                    <Field label="Product photos" hint="Select the main photo first, then the gallery photos.">
                      <Input type="file" name="initialImages" accept="image/jpeg,image/png,image/webp,image/avif" multiple />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Type for additional photos" hint="The first photo is always MAIN.">
                        <Select name="initialImageKind" defaultValue="GALLERY">
                          <option value="GALLERY">Gallery</option>
                          <option value="VARIANT">Variant</option>
                          <option value="WORN">Worn / model</option>
                          <option value="LACE_DETAIL">Lace detail</option>
                          <option value="TEXTURE">Texture detail</option>
                          <option value="PACKAGING">Packaging</option>
                        </Select>
                      </Field>
                      <Field label="Alt text" hint="Applied to the uploaded photos; can be edited later.">
                        <Input name="initialImageAlt" placeholder={name ? `${name} product photo` : "Describe the product photo"} maxLength={240} />
                      </Field>
                    </div>
                    <div className="rounded-2xl border border-dashed border-sand bg-[#fbf8f5] p-4 text-sm leading-6 text-ink-soft">Photos are uploaded only when you click <strong className="text-cocoa">Create product</strong> or <strong className="text-cocoa">Create & publish</strong>. If an image upload fails, the new product creation is rolled back so you do not end up with a half-created product.</div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-sand bg-petal/45 p-6">
                    <Images className="size-5 text-flame" />
                    <p className="mt-3 font-semibold text-cocoa">Media Studio is available below this editor.</p>
                    <p className="mt-1 text-sm leading-6 text-ink-soft">Use it to upload, reorder, categorize, edit ALT text and link photos to variants.</p>
                  </div>
                )}
              </div>
            )}

            {section === "Hair attributes" && (
              <div className="space-y-6">
                {isHair ? (
                  <>
                    <div className="rounded-2xl bg-petal/60 p-4 text-sm text-cocoa"><strong>Hair product.</strong> These values describe the overall product. Exact purchasable combinations are managed as variants after the product is created.</div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Hair material"><Select name="hairMaterial" defaultValue={p?.hairMaterial ?? ""}><option value="">Not specified</option>{HAIR_MATERIALS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
                      <Field label="Origin"><Select name="hairOrigin" defaultValue={p?.hairOrigin ?? ""}><option value="">Not specified</option>{HAIR_ORIGINS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
                      <Field label="Grade"><Select name="hairGrade" defaultValue={p?.hairGrade ?? ""}><option value="">Not specified</option>{HAIR_GRADES.map((v) => <option key={v}>{v}</option>)}</Select></Field>
                      {type === "WIG" && <Field label="Wig type"><Select name="wigType" defaultValue={p?.wigType ?? ""}><option value="">Not specified</option>{WIG_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></Field>}
                      {type === "WIG" && <Field label="Cap size"><Select name="capSize" defaultValue={p?.capSize ?? ""}><option value="">Not specified</option>{CAP_SIZES.map((v) => <option key={v}>{v}</option>)}</Select></Field>}
                      {(type === "CLOSURE" || type === "FRONTAL" || type === "WIG") && <Field label="Closure type"><Select name="closureType" defaultValue={p?.closureType ?? ""}><option value="">Not specified</option>{CLOSURE_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></Field>}
                      <Field label="Parting"><Input name="parting" defaultValue={p?.parting ?? ""} placeholder="Middle part, free part…" /></Field>
                      {type === "BUNDLE" && <Field label="Bundles in pack"><Input name="bundlesCount" type="number" min="0" defaultValue={p?.bundlesCount ?? ""} /></Field>}
                    </div>
                    <Multi name="textures" label="Textures available" values={TEXTURES} selected={p?.textures ?? []} />
                    <Multi name="lengths" label="Lengths available" values={LENGTHS.map(String)} selected={(p?.lengths ?? []).map(String)} suffix='"' />
                    <Multi name="densities" label="Densities" values={DENSITIES} selected={p?.densities ?? []} />
                    <Multi name="laceTypes" label="Lace options" values={LACE_TYPES} selected={p?.laceTypes ?? []} />
                    <Field label="Colors" hint="Comma-separated"><Input name="colors" defaultValue={(p?.colors ?? []).join(", ")} placeholder="Natural Black, 1B, 613 Blonde" /></Field>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tri("canBleach", "Can be bleached", p?.canBleach)}{tri("canDye", "Can be dyed", p?.canDye)}{tri("heatSafe", "Heat safe", p?.heatSafe)}{tri("prePlucked", "Pre-plucked", p?.prePlucked)}{tri("babyHair", "Baby hair", p?.babyHair)}{tri("glueless", "Glueless", p?.glueless)}{tri("adjustableStrap", "Adjustable strap", p?.adjustableStrap)}</div>
                  </>
                ) : <div className="rounded-2xl border border-dashed border-sand p-6 text-sm text-ink-soft">Hair construction fields are hidden because this product type is not a wig, bundle, extension, closure or frontal.</div>}

                <div className="rounded-2xl border border-sand p-4">
                  <p className="font-semibold text-cocoa">Customer hair profile</p>
                  <p className="mt-1 text-xs text-ink-soft">Used by quiz recommendations and product discovery.</p>
                  <div className="mt-4"><p className="mb-2 text-sm font-medium">Best for hair types</p><div className="flex flex-wrap gap-3">{Object.entries(HAIR_TYPE_LABELS).map(([k, l]) => <Checkbox key={k} name="hairTypes" value={k} label={l} defaultChecked={p?.hairTypes.includes(k as never)} />)}</div></div>
                  <div className="mt-5"><p className="mb-2 text-sm font-medium">Concerns</p><div className="flex flex-wrap gap-3">{Object.entries(CONCERN_LABELS).map(([k, l]) => <Checkbox key={k} name="concerns" value={k} label={l} defaultChecked={p?.concerns.includes(k)} />)}</div></div>
                </div>
                <Field label="Extra attributes" hint="One per line: Label: value"><Textarea name="attributes" defaultValue={Object.entries((p?.attributes as Record<string, string> | null) ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")} className="min-h-24 font-mono text-xs" /></Field>
              </div>
            )}

            {section === "Pricing & inventory" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Currency"><Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map((c) => <option key={c} value={c}>{c} {CURRENCIES[c]?.symbol}</option>)}</Select></Field>
                  <Field label="Base price"><Input name="basePrice" type="number" step="0.01" min="0" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} /></Field>
                  <Field label="Compare-at price"><Input name="compareAt" type="number" step="0.01" min="0" defaultValue={p?.compareAtCents ? fromCents(p.compareAtCents) : ""} /></Field>
                  <Field label="Cost" hint="Internal only"><Input name="cost" type="number" step="0.01" min="0" defaultValue={p?.costCents ? fromCents(p.costCents) : ""} /></Field>
                </div>
                <div className="rounded-2xl border border-sand bg-[#fbf8f5] p-4">
                  <p className="font-semibold text-cocoa">Merchandising</p>
                  <p className="mt-1 text-xs text-ink-soft">Control where this product is highlighted in the storefront.</p>
                  <div className="mt-4 flex flex-wrap gap-5"><Checkbox name="isFeatured" label="Featured" defaultChecked={p?.isFeatured} /><Checkbox name="isBestSeller" label="Best seller" defaultChecked={p?.isBestSeller} /><Checkbox name="isNew" label="New arrival" defaultChecked={p?.isNew} /><Checkbox name="isBundle" label="Set / bundle" defaultChecked={p?.isBundle} /></div>
                </div>
                <Field label="Set price" hint="Only used when this product is a bundle"><Input name="bundlePrice" type="number" step="0.01" min="0" defaultValue={p?.bundlePriceCents ? fromCents(p.bundlePriceCents) : ""} /></Field>
                <div className="rounded-2xl bg-petal/60 p-4 text-sm text-cocoa"><strong>Inventory is variant-based.</strong> After creating the product, use the Variants & inventory section to set stock, variant prices, SKU and reserved quantities.</div>
              </div>
            )}

            {section === "Shipping" && (
              <div className="space-y-5">
                <Field label="Product weight (grams)" hint="Used by real shipping-rate calculations"><Input name="weightGrams" type="number" min="0" defaultValue={p?.weightGrams ?? ""} placeholder="250" /></Field>
                <div className="rounded-2xl border border-sand p-5"><Truck className="size-5 text-flame" /><p className="mt-3 font-semibold text-cocoa">Shipping is calculated at checkout</p><p className="mt-1 text-sm leading-6 text-ink-soft">Destination, currency, product/variant weight and configured shipping zones determine the real delivery methods shown to the customer.</p></div>
              </div>
            )}

            {section === "SEO" && (
              <div className="space-y-5">
                <Field label="SEO title" hint="Recommended: up to 60–70 characters"><Input name="seoTitle" defaultValue={p?.seoTitle ?? ""} maxLength={70} placeholder={name || "Product title"} /></Field>
                <Field label="Meta description" hint="Recommended: up to 150–160 characters"><Textarea name="seoDescription" defaultValue={p?.seoDescription ?? ""} maxLength={160} className="min-h-28" /></Field>
                <div className="rounded-2xl border border-sand bg-white p-5">
                  <p className="text-xs text-ink-soft">Search preview</p>
                  <p className="mt-2 truncate text-lg font-semibold text-[#1a0dab]">{p?.seoTitle || name || "Product title"}</p>
                  <p className="mt-1 text-sm text-green-700">mamahair.com/products/{p?.slug || "product-slug"}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">{p?.seoDescription || p?.shortDesc || "Add a concise meta description to control how this product can appear in search results."}</p>
                </div>
              </div>
            )}
          </SectionShell>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => go(-1)} disabled={currentIndex === 0} className="rounded-xl border border-sand bg-white px-4 py-2.5 text-sm font-semibold text-cocoa disabled:opacity-35">Previous</button>
            {currentIndex < SECTIONS.length - 1 ? <button type="button" onClick={() => go(1)} className="rounded-xl bg-cocoa px-5 py-2.5 text-sm font-semibold text-white">Next section</button> : <span className="text-xs text-ink-soft">Review publication settings →</span>}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[1.5rem] border border-sand bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-flame">Product</p><p className="mt-1 line-clamp-2 font-semibold text-cocoa">{name || "Untitled product"}</p></div><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase", status === "ACTIVE" ? "bg-green-50 text-green-700" : status === "ARCHIVED" ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-700")}>{statusLabel}</span></div>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Type" value={PRODUCT_TYPES[type] ?? type} />
              <SummaryRow label="Currency" value={currency} />
              <SummaryRow label="Base price" value={basePrice ? `${CURRENCIES[currency]?.symbol ?? ""}${basePrice}` : "Not set"} />
              <SummaryRow label="Category" value={categories.find((c) => c.id === p?.categoryId)?.name ?? (p?.categoryId ? "Selected" : "Not set")} />
            </div>
            <div className="mt-5 border-t border-sand pt-4"><div className="flex items-center justify-between text-xs"><span className="text-ink-soft">Setup completeness</span><strong className="text-cocoa">{completion}%</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-petal"><div className="h-full rounded-full bg-cocoa" style={{ width: `${completion}%` }} /></div></div>
          </section>

          <section className="rounded-[1.5rem] border border-sand bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><FileText className="size-4 text-flame" /><p className="font-semibold text-cocoa">Publication</p></div>
            <Field label="Status" className="mt-4"><Select name="status" value={status} onChange={(e) => setStatus(e.target.value as Product["status"])}><option value="DRAFT">Draft — hidden</option><option value="ACTIVE">Published</option><option value="ARCHIVED">Archived</option></Select></Field>
            <p className="mt-3 text-xs leading-5 text-ink-soft">Draft keeps the product hidden. Published makes it eligible for the storefront. Archived removes it from active selling.</p>
            <SubmitButton className="mt-5 w-full" size="lg">{p?.id ? "Save changes" : status === "ACTIVE" ? "Create & publish" : "Create product"}</SubmitButton>
          </section>

          {p?.id && <section className="rounded-[1.5rem] border border-sand bg-[#fbf8f5] p-5 text-xs leading-5 text-ink-soft"><p className="font-semibold text-cocoa">Next after saving</p><p className="mt-1">Use Media Studio for product photos, then Variants & inventory for purchasable combinations, SKU, stock and variant-specific prices.</p></section>}
        </aside>
      </div>
    </form>
  );
}

function SectionShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-[1.6rem] border border-sand bg-white shadow-sm"><div className="border-b border-sand bg-[#fbf8f5] px-5 py-5 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-flame">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold text-cocoa">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">{description}</p></div><div className="p-5 sm:p-6">{children}</div></section>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-ink-soft">{label}</span><span className="max-w-[160px] truncate text-right font-medium text-cocoa">{value}</span></div>;
}

function sectionDescription(section: SectionKey) {
  if (section === "General") return "Core identity and customer-facing product content.";
  if (section === "Media") return "Upload the first product photos during creation. The first selected image becomes the storefront main image.";
  if (section === "Hair attributes") return "Hair construction, available options and recommendation profile.";
  if (section === "Pricing & inventory") return "Base pricing and merchandising flags. Variant stock is managed after creation.";
  if (section === "Shipping") return "Weight used by your real shipping zones and checkout rates.";
  return "Control the search title and description shown to search engines.";
}

function Multi({ name, label, values, selected, suffix = "" }: { name: string; label: string; values: string[]; selected: string[]; suffix?: string }) {
  return <div><p className="mb-2 text-sm font-medium text-cocoa">{label}</p><div className="flex flex-wrap gap-2">{values.map((value) => <label key={value} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-sand bg-white px-3 py-2 text-sm transition has-[:checked]:border-cocoa has-[:checked]:bg-petal has-[:checked]:font-semibold"><input type="checkbox" name={name} value={value} defaultChecked={selected.includes(value)} className="accent-cocoa" />{value}{suffix}</label>)}</div></div>;
}
