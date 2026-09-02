import Image from "next/image";
import { notFound } from "next/navigation";
import { adminGetProduct, adminListCategories, saveVariant, deleteVariant, generateVariants, uploadProductImages, deleteProductImage, updateImageMeta, setProductStatus, duplicateProduct, addBundleItem, removeBundleItem } from "@/server/admin/products";
import { getSection } from "@/lib/settings";
import { ProductForm } from "@/components/admin/product-form";
import { ImageReorder } from "@/components/admin/image-reorder";
import { PageHeader, Card } from "@/components/admin/ui";
import { Field, Input, Checkbox, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fromCents, formatCents } from "@/lib/money";
import { TEXTURES, DENSITIES, LACE_TYPES, LENGTHS, CAP_SIZES } from "@/lib/catalog";

const KINDS = ["MAIN", "GALLERY", "VARIANT", "WORN", "LACE_DETAIL", "TEXTURE", "PACKAGING"];
const KIND_HELP: Record<string, string> = {
  MAIN: "Primary storefront image",
  GALLERY: "General product gallery",
  VARIANT: "Color, texture or length specific",
  WORN: "Model / installed look",
  LACE_DETAIL: "Close-up of lace and hairline",
  TEXTURE: "Close-up of curl or wave pattern",
  PACKAGING: "Packaging and unboxing",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, commerce] = await Promise.all([adminGetProduct(id), adminListCategories(), getSection("commerce")]);
  if (!product) notFound();
  const opts = (v: unknown) => (v ?? {}) as Record<string, string>;
  const active = product.variants.filter((v) => v.isActive);

  return (
    <>
      <PageHeader title={product.name} sub={`/${product.slug} · ${product.status}`}>
        <Button href={`/products/${product.slug}`} variant="ghost" size="sm">View in store</Button>
        <form action={async () => { "use server"; await duplicateProduct(id); }}><Button variant="ghost" size="sm" type="submit">Duplicate</Button></form>
        {product.status !== "ACTIVE" && <form action={async () => { "use server"; await setProductStatus(id, "ACTIVE"); }}><Button size="sm" type="submit">Publish</Button></form>}
        {product.status === "ACTIVE" && <form action={async () => { "use server"; await setProductStatus(id, "DRAFT"); }}><Button variant="ghost" size="sm" type="submit">Hide</Button></form>}
        {product.status !== "ARCHIVED" && <form action={async () => { "use server"; await setProductStatus(id, "ARCHIVED"); }}><Button variant="danger" size="sm" type="submit">Archive</Button></form>}
      </PageHeader>

      <ProductForm product={product} categories={categories} currencies={commerce.enabledCurrencies} />

      <div className="mt-8 space-y-6">
        <Card title="Media studio">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-cocoa p-4 text-cream">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-peach">Storefront hero</p>
              <p className="mt-2 text-sm font-semibold">Image #1 is the main product image.</p>
              <p className="mt-1 text-xs leading-5 text-cream/65">Use a clean vertical photo with the full hair visible. Recommended 1200 × 1500 px (4:5).</p>
            </div>
            <div className="rounded-2xl border border-sand bg-cream/55 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Gallery strategy</p>
              <p className="mt-2 text-sm font-semibold text-cocoa">Show the product from multiple angles.</p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">Add model photos, lace close-ups, texture details and packaging only when those photos really exist.</p>
            </div>
            <div className="rounded-2xl border border-sand bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Variant photos</p>
              <p className="mt-2 text-sm font-semibold text-cocoa">Link a specific image to each variant.</p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">Useful for colors, textures or other options that visually change the product.</p>
            </div>
          </div>

          {product.images.length > 0 ? (
            <>
              <ImageReorder productId={id} images={product.images} />
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {product.images.map((img, index) => (
                  <div key={img.id} className="overflow-hidden rounded-2xl border border-sand bg-white shadow-[0_10px_30px_rgba(74,27,12,.035)]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-petal">
                      <Image src={img.url} alt={img.alt ?? ""} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                        <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-cocoa shadow-sm">#{index + 1}</span>
                        <span className="rounded-full bg-cocoa/92 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-cream shadow-sm">{index === 0 ? "MAIN" : img.kind.replaceAll("_", " ")}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-semibold text-cocoa">{KIND_HELP[index === 0 ? "MAIN" : img.kind] ?? "Product image"}</p>
                      <form action={async (fd) => { "use server"; await updateImageMeta(id, img.id, fd); }} className="mt-3 grid gap-3">
                        <Field label="Photo type">
                          <Select name="kind" defaultValue={index === 0 ? "MAIN" : img.kind} disabled={index === 0} className="h-10">
                            {KINDS.map((k) => <option key={k} value={k}>{k.replaceAll("_", " ")}</option>)}
                          </Select>
                        </Field>
                        {index === 0 && <input type="hidden" name="kind" value="MAIN" />}
                        <Field label="Alt text" hint="Describe what is visible for accessibility and SEO.">
                          <Input name="alt" defaultValue={img.alt ?? ""} placeholder={`${product.name} — ${index === 0 ? "front view" : "detail"}`} />
                        </Field>
                        <div className="flex items-center justify-between gap-3">
                          <button className="rounded-xl border border-cocoa px-3 py-2 text-xs font-semibold text-cocoa transition hover:bg-petal">Save details</button>
                        </div>
                      </form>
                      <form action={async () => { "use server"; await deleteProductImage(id, img.id); }} className="mt-3 border-t border-sand pt-3">
                        <button className="text-xs font-semibold text-red-700 underline underline-offset-2">Remove photo</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-sand bg-cream/40 p-8 text-center">
              <p className="text-lg font-semibold text-cocoa">No product photos yet</p>
              <p className="mt-1 text-sm text-ink-soft">Upload the main product photo first. It will automatically become the storefront image.</p>
            </div>
          )}

          <div className="mt-6 rounded-[1.5rem] border border-dashed border-cocoa/25 bg-petal/35 p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-flame">Upload product photos</p>
              <h3 className="mt-1 text-xl font-semibold text-cocoa">Add new media</h3>
              <p className="mt-1 text-xs leading-5 text-ink-soft">JPG, PNG, WebP or AVIF · max 5 MB each · up to 10 files per upload. If the product has no images yet, the first uploaded image becomes MAIN automatically.</p>
            </div>
            <form action={async (fd) => { "use server"; await uploadProductImages(id, fd); }} className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,.65fr)_minmax(0,1fr)_auto] lg:items-end">
              <Field label="Choose photos"><Input type="file" name="files" accept="image/jpeg,image/png,image/webp,image/avif" multiple required className="py-2" /></Field>
              <Field label="Photo type"><Select name="kind" defaultValue="GALLERY">{KINDS.filter((k) => k !== "MAIN").map((k) => <option key={k} value={k}>{k.replaceAll("_", " ")}</option>)}</Select></Field>
              <Field label="Alt text" hint="Applied to this upload batch"><Input name="alt" placeholder={`${product.name} product photo`} /></Field>
              <SubmitButton pendingText="Uploading…">Upload photos</SubmitButton>
            </form>
          </div>
        </Card>

        <Card title={`Variants & inventory (${active.length})`}>
          <div className="space-y-3">
            {product.variants.map((v) => {
              const o = opts(v.options);
              return (
                <form key={v.id} action={async (fd) => { "use server"; await saveVariant(id, fd); }} className={`grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-4 lg:grid-cols-8 ${v.isActive ? "border-sand" : "border-dashed border-sand opacity-60"}`}>
                  <input type="hidden" name="id" value={v.id} />
                  <Field label="SKU" className="col-span-2"><Input name="sku" defaultValue={v.sku} required /></Field>
                  <Field label="Texture"><Input name="opt_texture" defaultValue={o.texture ?? ""} list="textures" /></Field>
                  <Field label='Length "'><Input name="opt_length" defaultValue={o.length ?? ""} list="lengths" /></Field>
                  <Field label="Density"><Input name="opt_density" defaultValue={o.density ?? ""} list="densities" /></Field>
                  <Field label="Lace"><Input name="opt_lace" defaultValue={o.lace ?? ""} list="laces" /></Field>
                  <Field label="Color"><Input name="opt_color" defaultValue={o.color ?? ""} /></Field>
                  <Field label="Cap"><Input name="opt_capSize" defaultValue={o.capSize ?? ""} list="caps" /></Field>
                  <Field label="Label (auto if empty)" className="col-span-2"><Input name="name" defaultValue={v.name} /></Field>
                  <Field label="Price"><Input name="price" type="number" step="0.01" defaultValue={fromCents(v.priceCents)} required /></Field>
                  <Field label="Compare-at"><Input name="compareAt" type="number" step="0.01" defaultValue={v.compareAtCents ? fromCents(v.compareAtCents) : ""} /></Field>
                  <Field label="Cost"><Input name="cost" type="number" step="0.01" defaultValue={v.costCents ? fromCents(v.costCents) : ""} /></Field>
                  <Field label="Stock"><Input name="quantity" type="number" min="0" defaultValue={v.inventory?.quantity ?? 0} /></Field>
                  <Field label="Weight g"><Input name="weightGrams" type="number" min="0" defaultValue={v.weightGrams ?? ""} /></Field>
                  <Field label="Variant photo" hint="Shown when this variant is selected"><Select name="imageId" defaultValue={v.imageId ?? ""}><option value="">Use main image</option>{product.images.map((im, i) => <option key={im.id} value={im.id}>#{i + 1} · {im.kind.replaceAll("_", " ")}{im.alt ? ` · ${im.alt.slice(0, 32)}` : ""}</option>)}</Select></Field>
                  <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-4 lg:col-span-8">
                    <Checkbox name="isDefault" label="Default" defaultChecked={v.isDefault} />
                    <input type="hidden" name="activePresent" value="1" />
                    <Checkbox name="active" label="Active" defaultChecked={v.isActive} />
                    {v.inventory && v.inventory.reserved > 0 && <Badge tone="honey">{v.inventory.reserved} reserved</Badge>}
                    {v.imageId && <Badge>Photo #{product.images.findIndex((im) => im.id === v.imageId) + 1}</Badge>}
                    <span className="text-xs text-ink-soft">{formatCents(v.priceCents, product.currency)}</span>
                    <SubmitButton size="sm" variant="ghost">Save</SubmitButton>
                  </div>
                </form>
              );
            })}
            {active.length > 1 && <div className="flex flex-wrap gap-2">{active.map((v) => <form key={v.id} action={async () => { "use server"; await deleteVariant(id, v.id); }}><button className="text-xs text-red-700 underline">Deactivate {v.name}</button></form>)}</div>}
            <datalist id="textures">{TEXTURES.map((v) => <option key={v} value={v} />)}</datalist><datalist id="lengths">{LENGTHS.map((v) => <option key={v} value={v} />)}</datalist><datalist id="densities">{DENSITIES.map((v) => <option key={v} value={v} />)}</datalist><datalist id="laces">{LACE_TYPES.map((v) => <option key={v} value={v} />)}</datalist><datalist id="caps">{CAP_SIZES.map((v) => <option key={v} value={v} />)}</datalist>

            <form action={async (fd) => { "use server"; await saveVariant(id, fd); }} className="grid grid-cols-2 gap-2 rounded-xl border border-dashed border-sand p-3 sm:grid-cols-4 lg:grid-cols-8">
              <Field label="New variant SKU" className="col-span-2"><Input name="sku" required /></Field>
              <Field label="Texture"><Input name="opt_texture" list="textures" /></Field><Field label='Length "'><Input name="opt_length" list="lengths" /></Field><Field label="Density"><Input name="opt_density" list="densities" /></Field><Field label="Lace"><Input name="opt_lace" list="laces" /></Field><Field label="Color"><Input name="opt_color" /></Field><Field label="Cap"><Input name="opt_capSize" list="caps" /></Field>
              <Field label="Price"><Input name="price" type="number" step="0.01" required /></Field><Field label="Stock"><Input name="quantity" type="number" min="0" defaultValue={0} /></Field>
              <Field label="Variant photo"><Select name="imageId" defaultValue=""><option value="">Use main image</option>{product.images.map((im, i) => <option key={im.id} value={im.id}>#{i + 1} · {im.kind.replaceAll("_", " ")}</option>)}</Select></Field>
              <div className="flex items-end"><SubmitButton size="sm">Add variant</SubmitButton></div>
            </form>
          </div>

          <details className="mt-6 rounded-xl bg-petal p-4">
            <summary className="cursor-pointer text-sm font-semibold">Generate variant combinations</summary>
            <form action={async (fd) => { "use server"; await generateVariants(id, fd); }} className="mt-3 space-y-3">
              <p className="text-xs text-ink-soft">Pick the values for each axis. One variant is created per combination (texture × length × density × lace × color) at the base price, stock 0. Existing SKUs are skipped.</p>
              <Gen name="gen_texture" label="Textures" values={product.textures.length ? product.textures : TEXTURES} />
              <Gen name="gen_length" label="Lengths" values={(product.lengths.length ? product.lengths : LENGTHS).map(String)} />
              <Gen name="gen_density" label="Densities" values={product.densities.length ? product.densities : DENSITIES} />
              <Gen name="gen_lace" label="Lace" values={product.laceTypes.length ? product.laceTypes : LACE_TYPES} />
              <Gen name="gen_color" label="Colors" values={product.colors} />
              <SubmitButton size="sm" pendingText="Generating…">Generate variants</SubmitButton>
            </form>
          </details>
        </Card>

        <Card title="Set / bundle components">
          <p className="mb-3 text-xs text-ink-soft">Add product variants by SKU to build sets (Wig + Care Kit, 3 Bundles + Closure…). Set price is defined in Pricing.</p>
          <ul className="divide-y divide-sand text-sm">{product.bundleItems.map((bi) => <li key={bi.id} className="flex items-center justify-between py-2"><span>{bi.variant.product.name} · {bi.variant.name} <span className="text-ink-soft">× {bi.quantity} · {bi.variant.sku}</span></span><form action={async () => { "use server"; await removeBundleItem(id, bi.id); }}><button className="text-xs text-red-700 underline">Remove</button></form></li>)}</ul>
          <form action={async (fd) => { "use server"; await addBundleItem(id, fd); }} className="mt-3 flex flex-wrap items-end gap-2"><Field label="Variant SKU"><Input name="sku" required /></Field><Field label="Qty"><Input name="quantity" type="number" min="1" defaultValue={1} className="w-20" /></Field><SubmitButton size="sm" variant="ghost">Add component</SubmitButton></form>
        </Card>
      </div>
    </>
  );
}

function Gen({ name, label, values }: { name: string; label: string; values: string[] }) {
  if (!values.length) return null;
  return <div><p className="mb-1 text-xs font-medium">{label}</p><div className="flex flex-wrap gap-2">{values.map((v) => <label key={v} className="inline-flex items-center gap-1 rounded-pill border border-sand bg-white px-2.5 py-1 text-xs has-[:checked]:border-cocoa"><input type="checkbox" name={name} value={v} className="accent-cocoa" />{v}</label>)}</div></div>;
}
